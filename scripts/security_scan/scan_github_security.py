#!/usr/bin/env python3
"""
Security Dashboard — GitHub Repo Security Scanner

Scans all TrueSightDAO repos for security posture:
  - Visibility (public/private)
  - Branch protection on default branch
  - Secret scanning enabled
  - Dependabot enabled
  - Archived status

Outputs JSON to stdout for consumption by compile_security_report.py.
"""

import json
import os

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

ORG = "TrueSightDAO"
GITHUB_API = "https://api.github.com"


def get_headers():
    """Return headers with optional token."""
    token = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def fetch_json(url):
    """Fetch JSON from GitHub API."""
    if not HAS_REQUESTS:
        return {"error": "requests not installed"}
    try:
        resp = requests.get(url, headers=get_headers(), timeout=15)
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"HTTP {resp.status_code}", "body": resp.text[:200]}
    except Exception as e:
        return {"error": str(e)}


def scan_repo(repo_name):
    """Scan a single repo for security posture."""
    result = {
        "name": repo_name,
        "visibility": None,
        "archived": None,
        "default_branch": None,
        "branch_protection": None,
        "secret_scanning": None,
        "dependabot": None,
        "error": None,
    }

    repo_data = fetch_json(f"{GITHUB_API}/repos/{ORG}/{repo_name}")
    if "error" in repo_data:
        result["error"] = repo_data["error"]
        return result

    result["visibility"] = repo_data.get("visibility", "unknown")
    result["archived"] = repo_data.get("archived", False)
    result["default_branch"] = repo_data.get("default_branch", "main")

    default = result["default_branch"]
    protection = fetch_json(
        f"{GITHUB_API}/repos/{ORG}/{repo_name}/branches/{default}/protection"
    )
    if "error" not in protection:
        result["branch_protection"] = {
            "required_pull_request_reviews": "required_pull_request_reviews" in protection,
            "required_status_checks": "required_status_checks" in protection,
            "enforce_admins": protection.get("enforce_admins", {}).get("enabled", False),
        }
    else:
        result["branch_protection"] = None

    security = fetch_json(f"{GITHUB_API}/repos/{ORG}/{repo_name}/security-and-analysis")
    if "error" not in security:
        result["secret_scanning"] = security.get("secret_scanning", {}).get("status", "unknown")
        result["dependabot"] = security.get("dependabot_security_updates", {}).get("status", "unknown")

    return result


def main():
    """Scan all TrueSightDAO repos and print JSON."""
    repos_data = fetch_json(f"{GITHUB_API}/orgs/{ORG}/repos?per_page=100&sort=full_name")
    if "error" in repos_data:
        print(json.dumps({"error": repos_data["error"]}))
        return

    repo_names = [r["name"] for r in repos_data]

    results = []
    for name in repo_names:
        results.append(scan_repo(name))

    total = len(results)
    public = sum(1 for r in results if r.get("visibility") == "public")
    private = sum(1 for r in results if r.get("visibility") == "private")
    protected = sum(1 for r in results if r.get("branch_protection") and r["branch_protection"].get("required_pull_request_reviews"))

    output = {
        "repos": results,
        "summary": {
            "total": total,
            "public": public,
            "private": private,
            "with_branch_protection": protected,
        },
    }
    print(json.dumps(output, indent=2, default=str))


if __name__ == "__main__":
    main()
