# Security Dashboard Scanner

This directory contains scripts that scan TrueSight DAO's digital infrastructure and compile a security report.

## Scanners

| Script | What it scans |
|--------|---------------|
| `scan_aws_inventory.py` | EC2 instances, security groups, key pairs across both AWS accounts |
| `scan_web_security.py` | TLS cert expiry, HTTP security headers for all production domains |
| `scan_github_security.py` | Repo visibility, branch protection, secret scanning for TrueSightDAO org |
| `scan_phishing_blacklist.py` | Existing Cypher-Defense blacklist (domains, people, URLs) |
| `compile_security_report.py` | Runs all scanners and merges into a single JSON report |

## Usage

```bash
# Run all scanners and print report to stdout
python3 scripts/security_scan/compile_security_report.py

# Run and publish to treasury-cache (relative path)
python3 scripts/security_scan/compile_security_report.py --publish

# Run and publish to custom path
OUTPUT_DIR=/path/to/output python3 scripts/security_scan/compile_security_report.py
```

## CI

A GitHub Actions workflow (`.github/workflows/security-dashboard-daily.yml`) runs daily at 06:00 UTC and publishes the report to `TrueSightDAO/treasury-cache/managed-ledgers/security-dashboard.json`.

## Output

The compiled report is a JSON file consumed by the security dashboard at `truesight.me/security-dashboard/`.
