#!/usr/bin/env python3
"""
Read-only multi-region inventory for AWS incident-response / support-case replies.

Enumerates the resource classes AWS Trust & Safety asks operators to confirm:
EC2 instances, key pairs, self-owned AMIs, self-owned EBS snapshots, and
non-default security groups. Read-only: issues only Describe* calls.

Credentials: loads repo-root .env. Pass --account to choose which keypair:
  nelanco   -> CYPHER_DEFENCE_AWS_KEY/SECRET        (767697632458)
  explorya  -> TRUESIGHT_DAO_AUTOPILOT_AWS_KEY/SECRET (440626669078)
Falls back to the ambient AWS_ACCESS_KEY_ID/SECRET if --account is omitted.

Usage:
  python3 scripts/aws/inventory_account.py --account nelanco
  python3 scripts/aws/inventory_account.py --account nelanco --detail
"""
import argparse
import os
import sys

import boto3
from botocore.config import Config
from dotenv import load_dotenv

ACCOUNTS = {
    "nelanco": ("CYPHER_DEFENCE_AWS_KEY", "CYPHER_DEFENCE_AWS_SECRET"),
    "explorya": ("TRUESIGHT_DAO_AUTOPILOT_AWS_KEY", "TRUESIGHT_DAO_AUTOPILOT_AWS_SECRET"),
}

# Retry hard — a full multi-region sweep fires hundreds of calls and AWS
# throttles aggressively on limited / IR accounts.
CFG = Config(retries={"max_attempts": 10, "mode": "adaptive"})


def session_for(account):
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
    if account:
        kk, sk = ACCOUNTS[account]
        ak, secret = os.getenv(kk), os.getenv(sk)
        if not ak or not secret:
            sys.exit(f"Missing {kk}/{sk} in .env")
        return boto3.Session(aws_access_key_id=ak, aws_secret_access_key=secret)
    return boto3.Session()


def regions(sess):
    ec2 = sess.client("ec2", region_name="us-east-1", config=CFG)
    return [r["RegionName"] for r in ec2.describe_regions()["Regions"]]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--account", choices=list(ACCOUNTS))
    ap.add_argument("--detail", action="store_true", help="print per-resource IDs")
    args = ap.parse_args()

    sess = session_for(args.account)
    ident = sess.client("sts", config=CFG).get_caller_identity()
    print(f"Account {ident['Account']}  ARN {ident['Arn']}\n")

    tot = {"inst": 0, "keys": 0, "amis": 0, "snaps": 0, "nd_sg": 0}
    print(f"{'REGION':<16} | inst | keys | AMIs | snaps | nondef-SG")
    print("-" * 60)
    for r in regions(sess):
        ec2 = sess.client("ec2", region_name=r, config=CFG)
        try:
            insts = [i for res in ec2.describe_instances()["Reservations"]
                     for i in res["Instances"]]
            keys = ec2.describe_key_pairs()["KeyPairs"]
            amis = ec2.describe_images(Owners=["self"])["Images"]
            snaps = ec2.describe_snapshots(OwnerIds=["self"])["Snapshots"]
            sgs = [g for g in ec2.describe_security_groups()["SecurityGroups"]
                   if g["GroupName"] != "default"]
        except Exception as e:  # surface, don't swallow
            print(f"{r:<16} | ERROR: {type(e).__name__}: {e}")
            continue
        c = (len(insts), len(keys), len(amis), len(snaps), len(sgs))
        tot["inst"] += c[0]; tot["keys"] += c[1]; tot["amis"] += c[2]
        tot["snaps"] += c[3]; tot["nd_sg"] += c[4]
        if any(c):
            print(f"{r:<16} | {c[0]:>4} | {c[1]:>4} | {c[2]:>4} | {c[3]:>5} | {c[4]:>9}")
            if args.detail:
                for i in insts:
                    name = next((t["Value"] for t in i.get("Tags", [])
                                 if t["Key"] == "Name"), "-")
                    print(f"      inst {i['InstanceId']} {i['State']['Name']:<10} "
                          f"key={i.get('KeyName','-')} name={name}")
                for k in keys:
                    print(f"      key  {k['KeyName']}  ({k.get('CreateTime','?')})")
                for a in amis:
                    print(f"      ami  {a['ImageId']} {a.get('Name','-')} "
                          f"{a.get('CreationDate','?')}")
                for s in snaps:
                    print(f"      snap {s['SnapshotId']} {s['VolumeSize']}GiB "
                          f"{s['StartTime']} {s.get('Description','-')}")
                for g in sgs:
                    print(f"      sg   {g['GroupId']} {g['GroupName']}")
    print("-" * 60)
    print(f"{'TOTAL':<16} | {tot['inst']:>4} | {tot['keys']:>4} | "
          f"{tot['amis']:>4} | {tot['snaps']:>5} | {tot['nd_sg']:>9}")


if __name__ == "__main__":
    main()
