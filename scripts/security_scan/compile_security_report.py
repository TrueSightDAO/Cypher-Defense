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


# Ports normally exposed to the world on a public web server — not penalized.
EXPECTED_PUBLIC_PORTS = {80, 443}


def calculate_score(data):
    """Overall 0-100 score from scan results.

    Design notes:
      - Reads the compiler's actual section keys (aws_inventory / web_security /
        github_security) — earlier this read aws/web/github and so always scored 100.
      - Per-category caps so no single area can tank the whole score.
      - Unknowns are NOT penalized: GitHub repos are only judged when we had admin
        visibility (secret_scanning could be read), so a low-privilege PAT doesn't
        produce a false F.
    """
    score = 100
    deductions = []

    def category(raw, cap):
        total = 0
        for pts, msg in raw:
            total += pts
            deductions.append(msg)
        return min(total, cap)

    # --- AWS: world-open ingress (0.0.0.0/0). 80/443 expected; SSH + app/DB ports flagged.
    aws_raw = []
    for acct in (data.get("aws_inventory") or []):
        if acct.get("error"):
            continue
        name = acct.get("account")
        for port in (acct.get("totals", {}) or {}).get("open_ports", []):
            if isinstance(port, int) and port in EXPECTED_PUBLIC_PORTS:
                continue
            pts = 8 if port == 22 else (15 if not isinstance(port, int) else 10)
            label = "all traffic" if not isinstance(port, int) else f"port {port}"
            aws_raw.append((pts, f"World-open {label} on {name}"))
    score -= category(aws_raw, 30)

    # --- Web: TLS + headers, but ONLY for domains we directly host (GitHub Pages / EC2).
    # CDN/S3/external records aren't held to our web-security bar (avoids penalizing infra
    # subdomains we don't control). hosting=None (legacy / curated) is treated as ours.
    WEB_HOSTED = {"github-pages", "ec2", None}
    tls_raw, hdr_raw = [], []
    for site in (data.get("web_security") or []):
        if site.get("hosting") not in WEB_HOSTED:
            continue
        nm = site.get("name")
        tls = site.get("tls") or {}
        days = tls.get("days_remaining")
        if tls.get("error"):
            tls_raw.append((10, f"TLS error on {nm}: {tls.get('error')}"))
        elif days is not None and days < 7:
            tls_raw.append((20, f"TLS expiring soon: {nm} ({days}d)"))
        elif days is not None and days < 30:
            tls_raw.append((10, f"TLS expiring: {nm} ({days}d)"))
        missing = (site.get("headers", {}) or {}).get("missing", []) or []
        if missing:
            names = ", ".join(str(m if isinstance(m, str) else (m or {}).get("header", "")) for m in missing)
            hdr_raw.append((min(len(missing), 3), f"Missing headers on {nm}: {names}"))  # hygiene
    score -= category(tls_raw, 25)
    score -= category(hdr_raw, 10)

    # --- GitHub: only judge repos where admin read worked (secret_scanning is not None).
    # Collapse to per-category counts so the deductions list stays readable (not 1 line/repo).
    no_bp = ss_off = 0
    for repo in ((data.get("github_security") or {}).get("repos") or []):
        if repo.get("archived") or repo.get("secret_scanning") is None:
            continue  # archived, or no admin visibility — don't penalize unknowns
        if not repo.get("branch_protection"):
            no_bp += 1
        if repo.get("secret_scanning") == "disabled":
            ss_off += 1
    gh_raw = []
    if no_bp:
        gh_raw.append((no_bp, f"{no_bp} repos without branch protection"))
    if ss_off:
        gh_raw.append((ss_off, f"{ss_off} repos with secret scanning disabled"))
    score -= category(gh_raw, 15)

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
