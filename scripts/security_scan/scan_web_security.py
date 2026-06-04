#!/usr/bin/env python3
"""
Security Dashboard — Web Security Scanner

Checks TLS certificate expiry and HTTP security headers for all production
TrueSight DAO domains.

Outputs JSON to stdout for consumption by compile_security_report.py.
"""

import json
import socket
import ssl
from datetime import datetime, timezone

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False


DOMAINS = [
    {"name": "TrueSight DAO", "url": "https://truesight.me"},
    {"name": "Agroverse Shop", "url": "https://agroverse.shop"},
    {"name": "DApp", "url": "https://dapp.truesight.me"},
    {"name": "Edgar API", "url": "https://edgar.truesight.me"},
    {"name": "Capoeira", "url": "https://capoeira.agroverse.shop"},
    {"name": "Mirim Bahia", "url": "https://mirim-bahia.truesight.me"},
    {"name": "Oracle", "url": "https://oracle.truesight.me"},
    {"name": "Beta DApp", "url": "https://beta.dapp.truesight.me"},
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
    for domain in DOMAINS:
        hostname = domain["url"].replace("https://", "").replace("http://", "").split("/")[0]
        entry = {
            "name": domain["name"],
            "url": domain["url"],
            "tls": check_tls(hostname),
            "headers": check_headers(domain["url"]),
        }
        results.append(entry)
    print(json.dumps(results, indent=2, default=str))


if __name__ == "__main__":
    main()
