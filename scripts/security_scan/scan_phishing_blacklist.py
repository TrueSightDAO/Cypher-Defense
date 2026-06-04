#!/usr/bin/env python3
"""
Security Dashboard — Phishing Blacklist Scanner

Reads the existing Cypher-Defense blacklist files (domains, people, URLs)
and reports counts, recent additions, and trends.

Outputs JSON to stdout for consumption by compile_security_report.py.
"""

import json
import os
import re
from datetime import datetime, timezone


def parse_js_array(filepath):
    """Parse a JavaScript array file (var NAME = [...]) into a Python list."""
    if not os.path.exists(filepath):
        return []
    with open(filepath, "r") as f:
        content = f.read()
    match = re.search(r"\[(.*)\]", content, re.DOTALL)
    if not match:
        return []
    try:
        return json.loads("[" + match.group(1) + "]")
    except json.JSONDecodeError:
        return []


def main():
    """Scan blacklist files and print JSON."""
    base = os.path.join(os.path.dirname(__file__), "..", "..", "blacklist")

    domains = parse_js_array(os.path.join(base, "domains.js"))
    people = parse_js_array(os.path.join(base, "people.js"))
    urls = parse_js_array(os.path.join(base, "urls.js"))

    blacklisted_domains = [d["value"] for d in domains if d.get("status") == "blacklisted"]
    verified_domains = [d["value"] for d in domains if d.get("status") == "verified"]

    output = {
        "summary": {
            "total_entries": len(domains) + len(people) + len(urls),
            "blacklisted_domains": len(blacklisted_domains),
            "verified_domains": len(verified_domains),
            "blacklisted_people": len(people),
            "blacklisted_urls": len(urls),
        },
        "domains": [
            {
                "value": d["value"],
                "status": d.get("status", "unknown"),
                "flagger": d.get("flagger", {}).get("name", "unknown") if isinstance(d.get("flagger"), dict) else "unknown",
            }
            for d in domains
        ],
        "people": [p["value"] if isinstance(p, dict) else p for p in people],
        "urls": [u["value"] if isinstance(u, dict) else u for u in urls],
        "scanned_at": datetime.now(timezone.utc).isoformat(),
    }

    print(json.dumps(output, indent=2, default=str))


if __name__ == "__main__":
    main()
