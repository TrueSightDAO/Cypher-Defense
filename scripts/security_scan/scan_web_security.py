#!/usr/bin/env python3
"""
Security Dashboard — Web Security Scanner

Checks TLS certificate expiry and HTTP security headers for all production
TrueSight DAO domains.

Outputs JSON to stdout for consumption by compile_security_report.py.
"""

import json
import os
import socket
import ssl
import sys
from datetime import datetime, timezone

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

try:
    import boto3
    HAS_BOTO = True
except ImportError:
    HAS_BOTO = False


# Curated domains — provide friendly display names. The full list (incl. beta subdomains)
# is discovered from Route53 at scan time and merged in; this is also the fallback when
# Route53 isn't reachable.
DOMAINS = [
    {"name": "TrueSight DAO", "url": "https://truesight.me"},
    {"name": "Agroverse Shop", "url": "https://agroverse.shop"},
    {"name": "DApp", "url": "https://dapp.truesight.me"},
    {"name": "Edgar API", "url": "https://edgar.truesight.me"},
    {"name": "Capoeira", "url": "https://capoeira.agroverse.shop"},
    {"name": "Mirim Bahia", "url": "https://tribomirimbahia.truesight.me"},
    {"name": "Oracle", "url": "https://oracle.truesight.me"},
    {"name": "Beta DApp", "url": "https://beta.dapp.truesight.me"},
]

# Hosted zones whose A/AAAA/CNAME records we enumerate so beta + new subdomains are
# covered automatically. These zones live in the explorya account; the compile step
# passes TRUESIGHT_DAO_AUTOPILOT_AWS_* creds, which can read Route53.
ROUTE53_ZONES = {"truesight.me.", "agroverse.shop."}
ROUTE53_SKIP_SUBSTR = ("_domainkey", "domainkey")

# GitHub Pages anycast IPs (A + AAAA records). https://docs.github.com/pages
GITHUB_PAGES_IPS = {
    "185.199.108.153", "185.199.109.153", "185.199.110.153", "185.199.111.153",
    "2606:50c0:8000::153", "2606:50c0:8001::153", "2606:50c0:8002::153", "2606:50c0:8003::153",
}
# Hosting types we hold to the web-security bar (TLS + headers) in scoring.
WEB_HOSTING_TYPES = {"github-pages", "ec2"}


def _route53_client():
    ak = os.environ.get("TRUESIGHT_DAO_AUTOPILOT_AWS_KEY")
    sk = os.environ.get("TRUESIGHT_DAO_AUTOPILOT_AWS_SECRET")
    if ak and sk:
        return boto3.client("route53", aws_access_key_id=ak, aws_secret_access_key=sk)
    return boto3.client("route53")  # fall back to the default credential chain


def _classify_record(rr):
    """Return (hosting, target) for a Route53 record — what does this domain point to?"""
    alias = rr.get("AliasTarget")
    if alias:
        dn = (alias.get("DNSName") or "").rstrip(".").lower()
        if "cloudfront.net" in dn:
            return ("cloudfront", dn)
        if "elb.amazonaws.com" in dn:
            return ("ec2", dn)  # load balancer in front of EC2
        if "s3" in dn and "amazonaws.com" in dn:
            return ("s3", dn)
        return ("alias", dn)
    vals = [v.get("Value", "") for v in rr.get("ResourceRecords", [])]
    target = ", ".join(vals)
    if rr.get("Type") == "CNAME":
        tv = (vals[0] if vals else "").rstrip(".").lower()
        if tv.endswith(".github.io"):
            return ("github-pages", tv)
        if "cloudfront.net" in tv:
            return ("cloudfront", tv)
        if "amazonaws.com" in tv:
            return ("aws", tv)
        return ("external", tv)
    # A / AAAA
    if any(v in GITHUB_PAGES_IPS for v in vals):
        return ("github-pages", target)
    return ("ec2", target)  # raw IP we point at — our EC2 / self-hosted


def discover_from_route53():
    """Web-facing records from the DAO hosted zones → {host: (hosting, target)}.
    {} if unavailable. Skips ACM/DKIM validation (`_`-prefixed, `domainkey`) + wildcards."""
    if not HAS_BOTO:
        return {}
    try:
        r = _route53_client()
        found = {}
        for z in r.list_hosted_zones().get("HostedZones", []):
            if z.get("Name") not in ROUTE53_ZONES:
                continue
            zid = z["Id"].split("/")[-1]
            for page in r.get_paginator("list_resource_record_sets").paginate(HostedZoneId=zid):
                for rr in page.get("ResourceRecordSets", []):
                    if rr.get("Type") not in ("A", "AAAA", "CNAME"):
                        continue
                    name = rr["Name"].rstrip(".")
                    if not name or name[0] in "*_" or "\\" in name:
                        continue
                    if any(s in name for s in ROUTE53_SKIP_SUBSTR):
                        continue
                    found[name] = _classify_record(rr)
        return found
    except Exception as e:
        print("route53 discovery failed: %s" % e, file=sys.stderr)
        return {}


def build_domains():
    """Curated domains (friendly names) + Route53-discovered ones, deduped by hostname,
    each tagged with its hosting type + target."""
    by_host = {}
    for d in DOMAINS:
        host = d["url"].split("://", 1)[-1].split("/")[0]
        by_host[host] = {"name": d["name"], "url": d["url"], "hosting": None, "target": None}
    for host, (hosting, target) in discover_from_route53().items():
        entry = by_host.get(host) or {"name": host, "url": "https://" + host}
        entry["hosting"] = hosting
        entry["target"] = target
        by_host[host] = entry
    return [by_host[h] for h in sorted(by_host)]

SECURITY_HEADERS = {
    "Content-Security-Policy": "CSP",
    "Strict-Transport-Security": "HSTS",
    "X-Frame-Options": "XFO",
    "X-Content-Type-Options": "XCTO",
    "Referrer-Policy": "Referrer-Policy",
    "Permissions-Policy": "Permissions-Policy",
}


def check_tls(hostname, port=443):
    """Check TLS certificate for a hostname."""
    result = {
        "valid": False,
        "issuer": None,
        "subject": None,
        "expiry": None,
        "days_remaining": None,
        "error": None,
    }
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((hostname, port), timeout=10) as sock:
            with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                result["valid"] = True
                # getpeercert() returns issuer/subject as a tuple of RDNs, each RDN being a
                # tuple of (key, value) pairs (usually one). dict(cert["issuer"]) raises
                # "dictionary update sequence element #0 has length 1; 2 is required" because
                # each top-level element is itself a 1-tuple — flatten one level first.
                result["issuer"] = dict(item for rdn in cert.get("issuer", ()) for item in rdn)
                result["subject"] = dict(item for rdn in cert.get("subject", ()) for item in rdn)
                not_after = cert.get("notAfter")
                if not_after:
                    expiry = datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z")
                    expiry = expiry.replace(tzinfo=timezone.utc)
                    result["expiry"] = expiry.isoformat()
                    result["days_remaining"] = (expiry - datetime.now(timezone.utc)).days
    except Exception as e:
        result["error"] = str(e)
    return result


def check_headers(url):
    """Check HTTP security headers for a URL."""
    result = {
        "status_code": None,
        "headers": {},
        "present": [],
        "missing": [],
        "error": None,
    }
    if not HAS_REQUESTS:
        result["error"] = "requests not installed"
        return result

    try:
        resp = requests.get(url, timeout=15, allow_redirects=True)
        result["status_code"] = resp.status_code
        for header, label in SECURITY_HEADERS.items():
            value = resp.headers.get(header)
            if value:
                result["present"].append({"header": label, "value": value[:100]})
            else:
                result["missing"].append(label)
            result["headers"][label] = value
    except Exception as e:
        result["error"] = str(e)
    return result


def main():
    """Scan all domains and print JSON."""
    results = []
    for domain in build_domains():
        hostname = domain["url"].replace("https://", "").replace("http://", "").split("/")[0]
        entry = {
            "name": domain["name"],
            "url": domain["url"],
            "hosting": domain.get("hosting"),
            "target": domain.get("target"),
            "tls": check_tls(hostname),
            "headers": check_headers(domain["url"]),
        }
        results.append(entry)
    print(json.dumps(results, indent=2, default=str))


if __name__ == "__main__":
    main()
