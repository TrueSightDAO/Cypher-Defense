#!/usr/bin/env python3
"""
Create periodic **AMI** backups of the two production database EC2 instances
in the Nelanco account (us-east-1).

Why AMI in addition to the EBS snapshots in ``snapshot_databases.py``: that
sibling script snapshots only each box's **data volume**. An AMI captures the
**whole instance** — OS root disk + *all* attached EBS volumes (including the
external data disk) — as one consistent, **bootable** image, which is what the
disaster-recovery path actually needs (launch a replacement DB host from the
AMI, not hand-rebuild the OS and re-attach a bare data snapshot).

Instances (update if ever replaced — same convention as snapshot_databases.py):
    i-08ebe96afbc649a95  →  seni_sql    (Edgar / seni_ror PostgreSQL; data vol /dev/sdb 250 GiB)
    i-07c76510b231d787f  →  krake_data  (krake_ror data / DB;          data vol /dev/sdf 100 GiB)

``--no-reboot`` so a backup never interrupts a live database. The image is
therefore **crash-consistent** (not application-quiesced) — fine for PostgreSQL,
which recovers from a crash-consistent disk state via its WAL, exactly as it
would after a power loss. This matches the existing EBS-snapshot behaviour.

Retention is **per instance**: keep the newest ``--retain`` AMIs this script
created for each instance (grouped by the ``Instance`` tag), deregistering older
ones and deleting their backing snapshots.

Auth: repo-root ``.env`` — ``CYPHER_DEFENCE_AWS_KEY/SECRET`` (the Nelanco
account that owns these instances), falling back to standard ``AWS_*`` names.
In GitHub Actions the same names are injected from repo secrets.

Usage (dry-run lists what it would do)::

    python3 scripts/aws/snapshot_databases_ami.py
    python3 scripts/aws/snapshot_databases_ami.py --execute
    python3 scripts/aws/snapshot_databases_ami.py --execute --retain 6
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
MANAGED_BY = "snapshot_databases_ami"
DEFAULT_RETAIN = 6  # monthly cadence → ~6 months of restore points

# instance_id → codebase label (mirrors snapshot_databases.py)
INSTANCE_MAP: dict[str, str] = {
    "i-08ebe96afbc649a95": "seni_sql",    # Edgar / seni_ror PostgreSQL
    "i-07c76510b231d787f": "krake_data",  # krake_ror data / DB
}


def repo_root() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def apply_aws_dotenv() -> None:
    """Load AWS creds from repo-root .env, preferring the Nelanco (cypher) key."""
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


def create_ami(ec2, instance_id: str, label: str, name: str, description: str) -> str:
    resp = ec2.create_image(
        InstanceId=instance_id,
        Name=name,
        Description=description,
        NoReboot=True,
        TagSpecifications=[
            {"ResourceType": rt, "Tags": [
                {"Key": "Name", "Value": name},
                {"Key": "Project", "Value": "TrueSightDAO"},
                {"Key": "Service", "Value": "database"},
                {"Key": "Codebase", "Value": label},
                {"Key": "Instance", "Value": instance_id},
                {"Key": "ManagedBy", "Value": MANAGED_BY},
            ]}
            for rt in ("image", "snapshot")
        ],
    )
    return resp["ImageId"]


def prune_instance(ec2, instance_id: str, retain: int, execute: bool) -> list[str]:
    """Per-instance retention: deregister AMIs beyond ``retain`` (newest first)
    for this instance and delete their backing snapshots."""
    resp = ec2.describe_images(Owners=["self"], Filters=[
        {"Name": "tag:ManagedBy", "Values": [MANAGED_BY]},
        {"Name": "tag:Instance", "Values": [instance_id]},
    ])
    images = sorted(resp.get("Images", []), key=lambda im: im["CreationDate"], reverse=True)
    actions: list[str] = []
    for im in images[retain:]:
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
    p = argparse.ArgumentParser(description="Periodic AMI backups of the two production DB EC2 instances.")
    p.add_argument("--execute", action="store_true",
                   help="Create AMIs + prune. Without it, only describe.")
    p.add_argument("--retain", type=int, default=DEFAULT_RETAIN,
                   help=f"AMIs to keep per instance (default {DEFAULT_RETAIN}).")
    args = p.parse_args()

    apply_aws_dotenv()
    if not os.environ.get("AWS_ACCESS_KEY_ID"):
        print("No AWS credentials (set CYPHER_DEFENCE_AWS_KEY/SECRET).", file=sys.stderr)
        return 1

    ec2 = boto3.Session().client("ec2", region_name=REGION)
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M")
    errors: list[str] = []

    for instance_id, label in INSTANCE_MAP.items():
        name = f"{label}_ami_{date_str}"
        desc = f"Automated DB AMI backup of {label} ({instance_id}) - {MANAGED_BY}"
        if not args.execute:
            print(f"  [dry-run] {instance_id} ({label}) -> AMI {name}")
            for a in prune_instance(ec2, instance_id, args.retain, execute=False):
                print(f"  [dry-run]   would {a}")
            continue
        try:
            ami_id = create_ami(ec2, instance_id, label, name, desc)
            print(f"  created AMI {ami_id}  name={name}  instance={instance_id} ({label})  (NoReboot)")
        except (ClientError, BotoCoreError) as e:
            errors.append(f"{instance_id}/{label}: create-image failed — {e}")
            continue
        for a in prune_instance(ec2, instance_id, args.retain, execute=True):
            print(f"  pruned: {a}")

    if errors:
        print("\nErrors:", file=sys.stderr)
        for err in errors:
            print(f"  {err}", file=sys.stderr)
    if not args.execute:
        print("\nDry-run only. Re-run with --execute to create AMIs.")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
