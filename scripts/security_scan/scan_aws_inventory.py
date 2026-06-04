#!/usr/bin/env python3
"""
Security Dashboard — AWS Inventory Scanner

Scans both TrueSight DAO AWS accounts (Explorya + Nelanco) for:
  - EC2 instances (count, state, type, name)
  - Security groups (count, open ports)
  - Key pairs (count, names)
  - Overall account summary

Outputs JSON to stdout for consumption by compile_security_report.py.

Credentials: loads repo-root .env. Falls back gracefully if missing.
"""

import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

try:
    import boto3
    from botocore.config import Config
    from dotenv import load_dotenv
    HAS_BOTO = True
except ImportError:
    HAS_BOTO = False


ACCOUNTS = {
    "nelanco": ("CYPHER_DEFENCE_AWS_KEY", "CYPHER_DEFENCE_AWS_SECRET"),
    "explorya": ("TRUESIGHT_DAO_AUTOPILOT_AWS_KEY", "TRUESIGHT_DAO_AUTOPILOT_AWS_SECRET"),
}

CFG = Config(retries={"max_attempts": 5, "mode": "adaptive"})


def session_for(account):
    """Create a boto3 session for the given account label."""
    env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
    if os.path.exists(env_path):
        load_dotenv(env_path)
    kk, sk = ACCOUNTS[account]
    ak, secret = os.getenv(kk), os.getenv(sk)
    if not ak or not secret:
        return None
    return boto3.Session(aws_access_key_id=ak, aws_secret_access_key=secret)


def get_regions(sess):
    """Return list of region names."""
    try:
        ec2 = sess.client("ec2", region_name="us-east-1", config=CFG)
        return [r["RegionName"] for r in ec2.describe_regions()["Regions"]]
    except Exception:
        return ["us-east-1"]


def scan_account(account_label):
    """Scan a single AWS account and return a summary dict."""
    result = {
        "account": account_label,
        "account_id": None,
        "regions": {},
        "totals": {
            "instances": 0,
            "instances_running": 0,
            "instances_stopped": 0,
            "key_pairs": 0,
            "security_groups": 0,
            "open_ports": [],
        },
        "error": None,
    }

    if not HAS_BOTO:
        result["error"] = "boto3 not installed"
        return result

    sess = session_for(account_label)
    if not sess:
        result["error"] = "AWS credentials not configured"
        return result

    try:
        sts = sess.client("sts", config=CFG)
        result["account_id"] = sts.get_caller_identity()["Account"]
    except Exception as e:
        result["error"] = f"STS error: {e}"
        return result

    all_open_ports = set()

    for region in get_regions(sess):
        ec2 = sess.client("ec2", region_name=region, config=CFG)
        region_data = {
            "instances": [],
            "key_pairs": [],
            "security_groups": [],
            "error": None,
        }
        try:
            reservations = ec2.describe_instances()["Reservations"]
            for res in reservations:
                for inst in res["Instances"]:
                    name = "-"
                    for t in inst.get("Tags", []):
                        if t["Key"] == "Name":
                            name = t["Value"]
                            break
                    region_data["instances"].append({
                        "id": inst["InstanceId"],
                        "name": name,
                        "state": inst["State"]["Name"],
                        "type": inst["InstanceType"],
                        "launch_time": inst["LaunchTime"].isoformat(),
                    })
                    result["totals"]["instances"] += 1
                    if inst["State"]["Name"] == "running":
                        result["totals"]["instances_running"] += 1
                    elif inst["State"]["Name"] == "stopped":
                        result["totals"]["instances_stopped"] += 1

            keys = ec2.describe_key_pairs()["KeyPairs"]
            for k in keys:
                region_data["key_pairs"].append({
                    "name": k["KeyName"],
                    "fingerprint": k.get("KeyFingerprint", ""),
                })
                result["totals"]["key_pairs"] += 1

            sgs = ec2.describe_security_groups()["SecurityGroups"]
            for sg in sgs:
                sg_info = {
                    "id": sg["GroupId"],
                    "name": sg["GroupName"],
                    "open_ports": [],
                }
                for perm in sg.get("IpPermissions", []):
                    for ip_range in perm.get("IpRanges", []):
                        if ip_range.get("CidrIp") == "0.0.0.0/0":
                            port = perm.get("FromPort", perm.get("ToPort", "any"))
                            sg_info["open_ports"].append(port)
                            all_open_ports.add(port)
                region_data["security_groups"].append(sg_info)
                result["totals"]["security_groups"] += 1

        except Exception as e:
            region_data["error"] = str(e)

        result["regions"][region] = region_data

    result["totals"]["open_ports"] = sorted(all_open_ports)
    return result


def main():
    """Scan both accounts and print JSON."""
    results = []
    for label in ACCOUNTS:
        results.append(scan_account(label))
    print(json.dumps(results, indent=2, default=str))


if __name__ == "__main__":
    main()
