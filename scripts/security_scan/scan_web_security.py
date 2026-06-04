#!/usr/bin/env python3
"""
Security Dashboard — Web Security Scanner

Checks TLS certificate expiry and HTTP security headers for all production
TrueSight DAO domains.

Outputs JSON to stdout for consumption by compile_security_report.py.
"""

import ipaddress
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


# Which hosted zones to audit — comma-separated env override (`DASHBOARD_DNS_ZONES`),
# defaulting to the DAO's domains. This is a scope boundary, NOT a per-subdomain list:
# every subdomain is discovered live from Route53, and the GitHub Pages IP ranges are
# fetched live from api.github.com/meta — neither domains nor IPs are hardcoded.
ROUTE53_ZONES = {
    (z.strip() if z.strip().endswith(".") else z.strip() + ".")
    for z in os.environ.get("DASHBOARD_DNS_ZONES", "truesight.me,agroverse.shop").split(",")
    if z.strip()
}
ROUTE53_SKIP_SUBSTR = ("_domainkey", "domainkey")
WEB_HOSTING_TYPES = {"github-pages", "ec2"}


_GH_PAGES_CIDRS = None


def github_pages_cidrs():
    """GitHub Pages IP ranges, fetched live from api.github.com/meta (.pages). Cached per run."""
    global _GH_PAGES_CIDRS
    if _GH_PAGES_CIDRS is not None:
        return _GH_PAGES_CIDRS
    nets = []
    try:
        if HAS_REQUESTS:
            meta = requests.get("https://api.github.com/meta", timeout=10).json()
        else:
            import urllib.request
            with urllib.request.urlopen("https://api.github.com/meta", timeout=10) as resp:
                meta = json.load(resp)
        for cidr in meta.get("pages", []):
            try:
                nets.append(ipaddress.ip_network(cidr))
            except ValueError:
                pass
    except Exception as e:
        print("github meta fetch failed: %s" % e, file=sys.stderr)
    _GH_PAGES_CIDRS = nets
    return nets


def _ip_in_github_pages(value):
    try:
        addr = ipaddress.ip_address(value)
    except ValueError:
        return False
    return any(addr in net for net in github_pages_cidrs())


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
    if any(_ip_in_github_pages(v) for v in vals):
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
    """All web-facing hostnames discovered from the configured Route53 zones (deduped,
    each tagged with hosting + target). Falls back to the zone apexes if Route53 is
    unavailable — no hardcoded per-domain list."""
    discovered = discover_from_route53()
    if not discovered:
        return [
            {"name": z.rstrip("."), "url": "https://" + z.rstrip("."), "hosting": None, "target": None}
            for z in sorted(ROUTE53_ZONES)
        ]
    return [
        {"name": host, "url": "https://" + host, "hosting": hosting, "target": target}
        for host, (hosting, target) in sorted(discovered.items())
    ]

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
