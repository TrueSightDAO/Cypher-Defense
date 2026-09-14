#!/usr/bin/env python3
"""
Create periodic AMI backups of the nelanco-claude (interactive Claude Code
jump-box) EC2 instance.

Why AMI (not just EBS snapshot): the box holds non-git state laid down by hand
per agentic_ai_context/plans/NELANCO_CLAUDE_CODE_BOX_PLAN.md Gate C that has
no other backup path -- 64+ credential files (.env's, Google/Gmail service
accounts, clasp token), the claude_dao_identity signing key, a dedicated fleet
SSH key already distributed to the Nelanco fleet's authorized_keys, the box's
own GitHub push key, and the claude-telegram-monitor systemd unit + its
runtime state. An AMI lets a replacement instance boot with all of that
already in place instead of redoing the entire laydown from scratch. See
agentic_ai_context/AWS_DIGITAL_INFRASTRUCTURE.md (nelanco-claude entry) and
§4.5 (EIP blue-green + AMI DR runbook, same pattern used for Sophia).

The instance is resolved by the **Name tag** (``nelanco-claude-code``), not a
hardcoded instance ID, so this keeps working across resizes and blue/green
swaps. ``--no-reboot`` so an active Gary-driven `claude` / tmux / remote-control
session is never interrupted by a backup.

Retention: keep the newest ``--retain`` AMIs this script created (tag
``ManagedBy=snapshot_nelanco_claude_ami``); older ones are deregistered and
their backing snapshots deleted.

Auth: repo-root ``.env`` -- CYPHER_DEFENCE_AWS_KEY/SECRET (Nelanco account
767697632458, which owns this instance), falling back to standard ``AWS_*``
names. In GitHub Actions the same names are injected as env vars from repo
secrets.

Usage (dry-run lists what it would do)::

    python3 scripts/aws/snapshot_nelanco_claude_ami.py
    python3 scripts/aws/snapshot_nelanco_claude_ami.py --execute
    python3 scripts/aws/snapshot_nelanco_claude_ami.py --execute --retain 8
"""
from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
except ImportError:
    print("Install boto3: pip install boto3", file=sys.stderr)
    raise SystemExit(1)

REGION = "us-east-1"
INSTANCE_NAME_TAG = "nelanco-claude-code"  # Nelanco 767697632458, resolved via CYPHER_DEFENCE_AWS_*
MANAGED_BY = "snapshot_nelanco_claude_ami"
DEFAULT_RETAIN = 8  # weekly cadence -> ~2 months of restore points


def repo_root() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def apply_aws_dotenv() -> None:
    """Load AWS creds from repo-root .env, preferring the Nelanco account."""
    try:
        from dotenv import dotenv_values
    except ImportError:
        return
    env_path = repo_root() / ".env"
    if not env_path.is_file():
        return
    vals = {k: v for k, v in dotenv_values(env_path).items() if v not in (None, "")}

    if vals.get("CYPHER_DEFENCE_AWS_KEY"):
        os.environ["AWS_ACCESS_KEY_ID"] = str(vals["CYPHER_DEFENCE_AWS_KEY"]).strip()
        os.environ["AWS_SECRET_ACCESS_KEY"] = str(vals["CYPHER_DEFENCE_AWS_SECRET"]).strip()
        os.environ.pop("AWS_SESSION_TOKEN", None)
        return
    if not os.environ.get("AWS_ACCESS_KEY_ID"):
        for k in ("AWS_ACCESS_KEY_ID", "AWS_KEY"):
            if vals.get(k):
                os.environ["AWS_ACCESS_KEY_ID"] = str(vals[k]).strip()
                break
    if not os.environ.get("AWS_SECRET_ACCESS_KEY"):
        for k in ("AWS_SECRET_ACCESS_KEY", "AWS_SECRET"):
            if vals.get(k):
                os.environ["AWS_SECRET_ACCESS_KEY"] = str(vals[k]).strip()
                break


def find_instance(ec2) -> dict | None:
    """Resolve the nelanco-claude instance by Name tag (most recently launched
    if more than one matches -- e.g. mid blue/green)."""
    resp = ec2.describe_instances(Filters=[
        {"Name": "tag:Name", "Values": [INSTANCE_NAME_TAG]},
        {"Name": "instance-state-name", "Values": ["running", "stopped", "stopping"]},
    ])
    instances = [i for r in resp.get("Reservations", []) for i in r.get("Instances", [])]
    if not instances:
        return None
    instances.sort(key=lambda i: i.get("LaunchTime"), reverse=True)
    return instances[0]


def create_ami(ec2, instance_id: str, name: str, description: str) -> str:
    resp = ec2.create_image(
        InstanceId=instance_id,
        Name=name,
        Description=description,
        NoReboot=True,
        TagSpecifications=[
            {"ResourceType": rt, "Tags": [
                {"Key": "Name", "Value": name},
                {"Key": "Project", "Value": "TrueSightDAO"},
                {"Key": "Service", "Value": "nelanco-claude"},
                {"Key": "ManagedBy", "Value": MANAGED_BY},
            ]}
            for rt in ("image", "snapshot")
        ],
    )
    return resp["ImageId"]


def prune(ec2, retain: int, execute: bool) -> list[str]:
    """Deregister AMIs beyond the retention count + delete their snapshots."""
    resp = ec2.describe_images(Owners=["self"], Filters=[
        {"Name": "tag:ManagedBy", "Values": [MANAGED_BY]},
    ])
    images = sorted(resp.get("Images", []), key=lambda im: im["CreationDate"], reverse=True)
    stale = images[retain:]
    actions: list[str] = []
    for im in stale:
        ami_id = im["ImageId"]
        snap_ids = [m["Ebs"]["SnapshotId"]
                    for m in im.get("BlockDeviceMappings", [])
                    if m.get("Ebs", {}).get("SnapshotId")]
        actions.append(f"deregister {ami_id} ({im.get('Name')}) + snapshots {snap_ids}")
        if not execute:
            continue
        try:
            ec2.deregister_image(ImageId=ami_id)
            for sid in snap_ids:
                ec2.delete_snapshot(SnapshotId=sid)
        except (ClientError, BotoCoreError) as e:
            actions[-1] += f"  [ERROR: {e}]"
    return actions


def main() -> int:
    p = argparse.ArgumentParser(description="Periodic AMI backup of the nelanco-claude EC2.")
    p.add_argument("--execute", action="store_true",
                   help="Create the AMI + prune. Without it, only describe.")
    p.add_argument("--retain", type=int, default=DEFAULT_RETAIN,
                   help=f"AMIs to keep (default {DEFAULT_RETAIN}).")
    args = p.parse_args()

    apply_aws_dotenv()
    if not os.environ.get("AWS_ACCESS_KEY_ID"):
        print("No AWS credentials (set CYPHER_DEFENCE_AWS_KEY/SECRET).", file=sys.stderr)
        return 1

    ec2 = boto3.Session().client("ec2", region_name=REGION)
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M")

    inst = find_instance(ec2)
    if not inst:
        print(f"No instance tagged Name={INSTANCE_NAME_TAG} in {REGION}.", file=sys.stderr)
        return 1
    instance_id = inst["InstanceId"]
    name = f"{INSTANCE_NAME_TAG}_{date_str}"
    # AWS CreateImage Description rejects non-ASCII -- keep it plain ASCII.
    desc = f"Automated backup of {instance_id} ({inst.get('InstanceType')}) - {MANAGED_BY}"

    print(f"instance: {instance_id} ({inst.get('InstanceType')}, state={inst['State']['Name']})")
    if not args.execute:
        print(f"  [dry-run] would create AMI: {name}")
        for a in prune(ec2, args.retain, execute=False):
            print(f"  [dry-run] would {a}")
        print("\nDry-run only. Re-run with --execute.")
        return 0

    try:
        ami_id = create_ami(ec2, instance_id, name, desc)
        print(f"  created AMI {ami_id}  name={name}  (NoReboot)")
    except (ClientError, BotoCoreError) as e:
        print(f"AMI creation failed: {e}", file=sys.stderr)
        return 1

    for a in prune(ec2, args.retain, execute=True):
        print(f"  pruned: {a}")
    print("done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
