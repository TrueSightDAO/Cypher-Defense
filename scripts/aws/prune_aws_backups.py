#!/usr/bin/env python3
"""
Reclaim AWS backup storage in the Nelanco account (us-east-1): prune old AMIs
and EBS snapshots so backups don't accumulate forever.

Context: the per-script retention in ``snapshot_autopilot_ami.py`` and
``snapshot_databases_ami.py`` only bounds the AMIs *those* scripts create. It
does NOT touch (a) the legacy monthly data-volume snapshots from
``snapshot_databases.py`` (now redundant — the DB AMI captures the data volume
too), (b) years of ad-hoc manual AMIs, or (c) orphaned snapshots left behind by
deregistered AMIs. As of 2026-06-07 Nelanco held 62 snapshots / ~4,164 GiB and
41 AMIs (27 of them >1yr old). This is the catch-all janitor.

Policy applied each run (all deletes are guarded — see SAFETY):
  1. **Legacy monthly EBS** — snapshots named ``^(krake|seni_sql)_\\d{8}$``
     (created by snapshot_databases.py): keep the newest ``--keep-monthly-ebs``
     per codebase, delete the rest. (Redundant with the DB AMI now.)
  2. **Age sweep** — AMIs older than ``--older-than-days`` are deregistered;
     then snapshots older than that cutoff which no longer back any registered
     AMI are deleted.
  3. **Orphans** — snapshots whose Description references an ``ami-…`` that no
     longer exists are deleted regardless of age (pure waste).

SAFETY:
  - ``--dry-run`` is the DEFAULT. Nothing is deleted without ``--execute``.
  - The set of snapshots backing *currently registered* AMIs is recomputed
    AFTER deregistrations and is NEVER deleted — so a snapshot that still backs
    a kept AMI is always protected.
  - AMIs/snapshots created by the managed backup scripts are recent and fall
    under their own retention, so the age sweep never collides with them.

Auth: repo-root ``.env`` ``CYPHER_DEFENCE_AWS_KEY/SECRET`` (Nelanco), or
standard ``AWS_*`` env vars (GitHub Actions secrets).

Usage::

    python3 scripts/aws/prune_aws_backups.py                          # dry-run report
    python3 scripts/aws/prune_aws_backups.py --execute                # apply (defaults: 730d, keep 2)
    python3 scripts/aws/prune_aws_backups.py --execute --older-than-days 730 --keep-monthly-ebs 2
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
except ImportError:
    print("Install boto3: pip install boto3", file=sys.stderr)
    raise SystemExit(1)

REGION = "us-east-1"
MONTHLY_EBS_RE = re.compile(r"^(krake|seni_sql)_\d{8}$")
AMI_IN_DESC_RE = re.compile(r"for (ami-[0-9a-f]+)")


def repo_root() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def apply_aws_dotenv() -> None:
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
    for std, alts in (("AWS_ACCESS_KEY_ID", ("AWS_ACCESS_KEY_ID", "AWS_KEY")),
                      ("AWS_SECRET_ACCESS_KEY", ("AWS_SECRET_ACCESS_KEY", "AWS_SECRET"))):
        if not os.environ.get(std):
            for k in alts:
                if vals.get(k):
                    os.environ[std] = str(vals[k]).strip()
                    break


def _name(tags: list[dict]) -> str:
    return next((t["Value"] for t in (tags or []) if t["Key"] == "Name"), "")


def _snap_name(s: dict) -> str:
    return _name(s.get("Tags", []))


def main() -> int:
    p = argparse.ArgumentParser(description="Prune old AWS AMIs + snapshots (Nelanco).")
    p.add_argument("--execute", action="store_true", help="Apply deletions. Default: dry-run report.")
    p.add_argument("--older-than-days", type=int, default=730, help="Age cutoff for the sweep (default 730 = 2yr).")
    p.add_argument("--keep-monthly-ebs", type=int, default=2, help="Legacy monthly EBS snapshots to keep per codebase (default 2).")
    args = p.parse_args()

    apply_aws_dotenv()
    if not os.environ.get("AWS_ACCESS_KEY_ID"):
        print("No AWS credentials (set CYPHER_DEFENCE_AWS_KEY/SECRET).", file=sys.stderr)
        return 1
    ec2 = boto3.Session().client("ec2", region_name=REGION)
    cutoff = datetime.now(timezone.utc) - timedelta(days=args.older_than_days)

    images = ec2.describe_images(Owners=["self"])["Images"]
    snaps = ec2.describe_snapshots(OwnerIds=["self"])["Snapshots"]
    live_ami_ids = {im["ImageId"] for im in images}

    amis_to_deregister: list[dict] = []
    for im in images:
        if im["CreationDate"] < cutoff.isoformat():
            amis_to_deregister.append(im)

    # ---- Plan AMI deregistrations (age sweep) ----
    dereg_ids = {im["ImageId"] for im in amis_to_deregister}
    # AMIs that will REMAIN registered after the sweep:
    remaining_amis = [im for im in images if im["ImageId"] not in dereg_ids]
    protected_snaps: set[str] = set()
    for im in remaining_amis:
        for m in im.get("BlockDeviceMappings", []):
            sid = m.get("Ebs", {}).get("SnapshotId")
            if sid:
                protected_snaps.add(sid)

    # ---- Plan snapshot deletions ----
    snap_delete: dict[str, tuple[dict, str]] = {}  # id -> (snap, reason)

    # 1. legacy monthly EBS: keep newest N per codebase
    by_codebase: dict[str, list[dict]] = {}
    for s in snaps:
        nm = _snap_name(s)
        m = MONTHLY_EBS_RE.match(nm)
        if m:
            by_codebase.setdefault(m.group(1), []).append(s)
    for codebase, group in by_codebase.items():
        group.sort(key=lambda s: s["StartTime"], reverse=True)
        for s in group[args.keep_monthly_ebs:]:
            snap_delete[s["SnapshotId"]] = (s, f"legacy monthly EBS beyond keep-{args.keep_monthly_ebs} ({codebase})")

    # 2. age sweep: snapshots older than cutoff not protected
    for s in snaps:
        if s["SnapshotId"] in snap_delete:
            continue
        start = s["StartTime"]
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        if start < cutoff and s["SnapshotId"] not in protected_snaps:
            snap_delete[s["SnapshotId"]] = (s, f"older than {args.older_than_days}d, not backing a kept AMI")

    # 3. orphans (any age): description references a deleted AMI
    for s in snaps:
        if s["SnapshotId"] in snap_delete or s["SnapshotId"] in protected_snaps:
            continue
        m = AMI_IN_DESC_RE.search(s.get("Description", ""))
        if m and m.group(1) not in live_ami_ids:
            snap_delete[s["SnapshotId"]] = (s, f"orphan (backs deleted {m.group(1)})")

    # ---- Report ----
    reclaim = sum(s["VolumeSize"] for s, _ in snap_delete.values())
    print(f"Nelanco backup prune — cutoff {cutoff.date()} ({args.older_than_days}d), keep-monthly-ebs {args.keep_monthly_ebs}")
    print(f"AMIs to deregister: {len(amis_to_deregister)}")
    for im in sorted(amis_to_deregister, key=lambda x: x["CreationDate"]):
        print(f"  {im['ImageId']}  {im.get('Name','')[:40]:40}  {im['CreationDate'][:10]}")
    print(f"Snapshots to delete: {len(snap_delete)}  (~{reclaim} GiB reclaimed)")
    for sid, (s, reason) in sorted(snap_delete.items(), key=lambda kv: kv[1][0]["StartTime"]):
        st = s["StartTime"].isoformat()[:10] if hasattr(s["StartTime"], "isoformat") else str(s["StartTime"])[:10]
        print(f"  {sid}  {s['VolumeSize']:>4} GiB  {st}  {reason}")
    print(f"Protected (back kept AMIs): {len(protected_snaps)} snapshots")

    if not args.execute:
        print("\nDry-run only. Re-run with --execute to apply.")
        return 0

    # ---- Apply: deregister AMIs first (frees their snapshots), then delete ----
    errors: list[str] = []
    for im in amis_to_deregister:
        try:
            ec2.deregister_image(ImageId=im["ImageId"])
            print(f"deregistered {im['ImageId']} ({im.get('Name','')})")
        except (ClientError, BotoCoreError) as e:
            errors.append(f"deregister {im['ImageId']}: {e}")
    for sid, (s, reason) in snap_delete.items():
        try:
            ec2.delete_snapshot(SnapshotId=sid)
            print(f"deleted {sid} ({s['VolumeSize']} GiB)")
        except (ClientError, BotoCoreError) as e:
            # A snapshot still 'in use by AMI' (e.g. a just-deregistered image
            # mid-propagation) is non-fatal — next run catches it.
            errors.append(f"delete {sid}: {e}")
    if errors:
        print("\nNon-fatal errors (will retry next run):", file=sys.stderr)
        for e in errors:
            print(f"  {e}", file=sys.stderr)
    print(f"\ndone — deregistered {len(amis_to_deregister)} AMIs, deleted "
          f"{len(snap_delete) - sum(1 for e in errors if e.startswith('delete'))} snapshots (~{reclaim} GiB target).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
