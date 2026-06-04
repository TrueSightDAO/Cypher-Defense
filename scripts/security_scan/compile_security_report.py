#!/usr/bin/env python3
"""
Security Dashboard — Report Compiler

Runs all individual scanners and merges their output into a single
security-dashboard.json with an overall security score (0-100).

Usage:
  python3 scripts/security_scan/compile_security_report.py
  python3 scripts/security_scan/compile_security_report.py --publish

With --publish, writes the output to:
  ../treasury-cache/managed-ledgers/security-dashboard.json

Or set OUTPUT_DIR env var to a custom path.
"""

import json
import os
import subprocess
import sys
from datetime import datetime, timezone

SCANNERS = [
    "scan_aws_inventory.py",
    "scan_web_security.py",
    "scan_github_security.py",
    "scan_phishing_blacklist.py",
]


def run_scanner(name):
    """Run a scanner script and return its parsed JSON output."""
    script_path = os.path.join(os.path.dirname(__file__), name)
    if not os.path.exists(script_path):
        return {"error": f"Scanner not found: {name}"}
    try:
        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode != 0:
            return {"error": f"Exit code {result.returncode}", "stderr": result.stderr[:500]}
        return json.loads(result.stdout)
    except json.JSONDecodeError as e:
        return {"error": f"JSON parse error: {e}", "stdout": result.stdout[:500]}
    except subprocess.TimeoutExpired:
        return {"error": "Scanner timed out"}
    except Exception as e:
        return {"error": str(e)}


def calculate_score(data):
    """Calculate an overall security score 0-100 based on scan results."""
    score = 100
    deductions = []

    aws = data.get("aws", [])
    for account in aws if isinstance(aws, list) else []:
        open_ports = account.get("totals", {}).get("open_ports", [])
        if open_ports:
            score -= len(open_ports) * 5
            deductions.append(f"Open ports on {account.get('account')}: {open_ports}")

    web = data.get("web", [])
    for site in web if isinstance(web, list) else []:
        tls = site.get("tls", {})
        days = tls.get("days_remaining")
        if days is not None:
            if days < 7:
                score -= 20
                deductions.append(f"TLS expiring soon: {site['name']} ({days} days)")
            elif days < 30:
                score -= 10
                deductions.append(f"TLS expiring: {site['name']} ({days} days)")
        if tls.get("error"):
            score -= 15
            deductions.append(f"TLS error on {site['name']}: {tls['error']}")

        missing = site.get("headers", {}).get("missing", [])
        if missing:
            score -= len(missing) * 3
            deductions.append(f"Missing headers on {site['name']}: {missing}")

    gh = data.get("github", {})
    repos = gh.get("repos", [])
    for repo in repos if isinstance(repos, list) else []:
        bp = repo.get("branch_protection")
        if bp is None:
            score -= 2
            deductions.append(f"No branch protection: {repo['name']}")

    score = max(0, min(100, score))

    return {
        "score": score,
        "deductions": deductions,
        "grade": "A" if score >= 90 else "B" if score >= 75 else "C" if score >= 50 else "D" if score >= 25 else "F",
    }


def main():
    """Run all scanners and compile the report."""
    print("Running security scanners...", file=sys.stderr)

    data = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
    }

    for scanner in SCANNERS:
        name = scanner.replace("scan_", "").replace(".py", "")
        print(f"  Running {scanner}...", file=sys.stderr)
        data[name] = run_scanner(scanner)

    data["score"] = calculate_score(data)

    output = json.dumps(data, indent=2, default=str)

    publish = "--publish" in sys.argv
    output_dir = os.getenv("OUTPUT_DIR")

    if publish or output_dir:
        if output_dir:
            out_path = os.path.join(output_dir, "security-dashboard.json")
        else:
            repo_root = os.path.join(os.path.dirname(__file__), "..", "..")
            out_path = os.path.join(repo_root, "..", "treasury-cache", "managed-ledgers", "security-dashboard.json")
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, "w") as f:
            f.write(output)
        print(f"Published to {out_path}", file=sys.stderr)
    else:
        print(output)


if __name__ == "__main__":
    main()
