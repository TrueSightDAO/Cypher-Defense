#!/usr/bin/env python3
"""
Create EBS snapshots for the two production database EC2 instances (N. Virginia).

Instance → (codebase, data_volume_id) mapping (update if instances are ever replaced):
    i-07c76510b231d787f  →  krake     vol-0344926855e4fe8a2  (100 GiB /dev/sdf)
    i-08ebe96afbc649a95  →  seni_sql  vol-0dfe671e3d6254b08  (250 GiB /dev/sdb)

Snapshot names follow the pattern: <codebase>_YYYYMMDD  (e.g. krake_20260417)
Only the large data volume on each instance is snapshotted (not the 8 GiB OS disk).

Authentication: repo-root ``.env`` (``AWS_KEY`` / ``AWS_SECRET`` or standard
``AWS_*`` names), or GitHub Actions secrets set as env vars (same names).

Usage (dry-run lists volumes without creating snapshots)::

    python3 scripts/aws/snapshot_databases.py
    python3 scripts/aws/snapshot_databases.py --execute
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

# Maps instance ID → (codebase name, data volume ID to snapshot)
INSTANCE_MAP: dict[str, tuple[str, str]] = {
    "i-07c76510b231d787f": ("krake",    "vol-0344926855e4fe8a2"),  # 100 GiB /dev/sdf
    "i-08ebe96afbc649a95": ("seni_sql", "vol-0dfe671e3d6254b08"),  # 250 GiB /dev/sdb
}


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

    # Prefer the permanent IAM key over any temporary STS credentials in the file.
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



def create_snapshot(ec2, volume_id: str, name: str, description: str) -> str:
    resp = ec2.create_snapshot(
        VolumeId=volume_id,
        Description=description,
        TagSpecifications=[
            {
                "ResourceType": "snapshot",
                "Tags": [{"Key": "Name", "Value": name}],
            }
        ],
    )
    return resp["SnapshotId"]


def main() -> int:
    p = argparse.ArgumentParser(description="Snapshot production database EBS volumes.")
    p.add_argument(
        "--execute",
        action="store_true",
        help="Create snapshots. Without this flag, volumes are listed only.",
    )
    args = p.parse_args()

    apply_aws_dotenv()

    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    session = boto3.Session()
    ec2 = session.client("ec2", region_name=REGION)

    errors: list[str] = []
    created: list[dict] = []

    for instance_id, (codebase, vol_id) in INSTANCE_MAP.items():
        snap_name = f"{codebase}_{date_str}"
        description = f"Monthly backup of {codebase} ({instance_id})"

        if not args.execute:
            print(f"  [dry-run] {instance_id} ({codebase})  volume={vol_id}  → snapshot name: {snap_name}")
            continue

        try:
            snap_id = create_snapshot(ec2, vol_id, snap_name, description)
            print(f"  Created {snap_id}  name={snap_name}  volume={vol_id}  instance={instance_id} ({codebase})")
            created.append({"snapshot_id": snap_id, "name": snap_name, "volume_id": vol_id, "instance_id": instance_id})
        except (ClientError, BotoCoreError) as e:
            errors.append(f"{instance_id}/{vol_id}: snapshot failed — {e}")

    if errors:
        print("\nErrors:", file=sys.stderr)
        for err in errors:
            print(f"  {err}", file=sys.stderr)

    if not args.execute:
        print("\nDry-run only. Re-run with --execute to create snapshots.")

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
