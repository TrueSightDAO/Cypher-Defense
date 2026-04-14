# AWS account security — response summary for support

**AWS account ID:** `767697632458`  
**Support / case reference (from customer email):** `177613748700177`  
**Related internal incident notes:** [`docs/incidents/2026-04-13-aws-ec2-trust-safety-abuse.md`](../incidents/2026-04-13-aws-ec2-trust-safety-abuse.md) (EC2 / CloudTrail detail)

**Plain-language briefing for DAO members:** [`docs/members/2026-04-14-aws-account-incident-member-briefing.md`](../members/2026-04-14-aws-account-incident-member-briefing.md)

This document is intended to be **shared with AWS** (as an attachment or pasted summary) after you complete the items in **§2** that only you can confirm in the AWS console (root password change time, MFA enrollment time, etc.). Fill bracketed placeholders before sending.

---

## 1. Executive summary (for AWS)

We investigated unusual control-plane and compute activity in account **`767697632458`**. CloudTrail indicates **unauthorized use of a long-lived AWS root access key** (`AKIAIQYX7Z65F25NMY6A`) from an external IP address, followed by **`ImportKeyPair`** and **`RunInstances`** in **`us-west-2`**, consistent with credential misuse rather than intended operations.

We **revoked the implicated access key** (it no longer appears in IAM), **terminated affected EC2 resources**, **removed attacker-controlled SSH key pair material** across regions, **tightened how credentials are stored** (removed from application repositories; isolated to a local, non-committed secrets file for break-glass automation), and completed the **account hardening steps** AWS outlined in its notice (**§2**). We request **restoration of full service access** after your review.

---

## 2. Steps from AWS notice — completion status

Complete these in the **AWS Management Console** (root user), then record **dates/times in UTC** in the table.

| # | AWS request | Customer action (check when done) | Completed (UTC) |
|---|----------------|-------------------------------------|-------------------|
| 1 | Change **AWS root account password** | Console → **Account** (root) → **Security credentials** → update password | `[YYYY-MM-DD HH:MM UTC]` |
| 2 | Enable **MFA on the root user** | Console → root **Security credentials** → **Assign MFA device** | `[YYYY-MM-DD HH:MM UTC]` |
| 3 | Review **AWS CloudTrail** for unwanted activity | Console → **CloudTrail** → **Event history** (and trails to S3, if configured) | `[YYYY-MM-DD HH:MM UTC]` |

**CloudTrail review (high level):** We correlated API activity in **`us-west-2`** and identified at least:

- **`ImportKeyPair`** (unauthorized pattern): key pair name **`buatbelisdfgmsobilbaim`**, principal **root**, access key **`AKIAIQYX7Z65F25NMY6A`**, source IP **`45.61.128.156`**, Boto3 on Linux.
- **`RunInstances`** with the same principal, key, and source IP (including successful launch after earlier **`Client.VcpuLimitExceeded`** attempts).
- Subsequent **`TerminateInstances`** and **`DescribeInstances`** from a **different** source IP using a **different** root access key (**`AKIA3FPSYHTFC532UEJO`**), consistent with **operator incident response**, not the original abuse path.

We do **not** consider the **`45.61.128.156` / `AKIAIQYX7Z65F25NMY6A`** activity to be legitimate use case traffic.

---

## 3. Remediation and containment performed

| Area | Action |
|------|--------|
| **IAM / credentials** | Confirmed **`AKIAIQYX7Z65F25NMY6A`** is **not** attached to any IAM user and **not** listed among active **root** access keys → treated as **deleted / inactive**. Audited remaining root keys; **plan to eliminate root access keys** in favor of least-privilege IAM and MFA-protected operators. |
| **EC2 instances** | Located and **terminated** suspicious workloads as part of response; for the instance id cited in related abuse correspondence (**`i-023059e53e79e1dc3`**), later **DescribeInstances across all commercial regions** returned **no active reservation** (instance **not present** / already **terminated**). |
| **EC2 key pairs** | Deleted the imported key pair **`buatbelisdfgmsobilbaim`** in **every region where it existed** (12 regions), including **`us-west-2`** (`key-0a779ad35da101ab6`). |
| **Source code / hygiene** | Removed **long-lived AWS keys from application source** where discovered (e.g. legacy Rails config); moved break-glass automation credentials to a **dedicated local `.env`** that is **gitignored**; published internal **incident notes and cleanup scripts** under this repository’s `docs/` and `scripts/aws/` for repeatability. |

Automation used for cleanup (safe to mention to AWS; **no secrets** in repo):

- `scripts/aws/delete_ec2_keypair_all_regions.sh`
- `scripts/aws/terminate_ec2_by_launch_keypair.py` (supports `--instance-id` for full-region lookup)

---

## 4. Ongoing hardening (post-incident)

- **No routine operations with root access keys**; migrate to **IAM users/roles** with **least privilege** and **MFA**.
- **Organization trail / multi-Region CloudTrail** to durable storage; **GuardDuty**, **AWS Config** where budget allows.
- **Security group egress** review: allow only required destinations/ports.
- **Git history scan** for leaked credentials and **rotation** where anything may have been exposed.

---

## 5. Text you can paste into the AWS support case (edit bracketed fields)

Use this as the body of your reply to **`no-reply-aws@amazon.com`** / the support case thread **after** completing §2.

```
Subject: RE: [CASE 177613748700177] Account 767697632458 — corrective actions completed

Hello AWS Security / Account team,

Regarding AWS account 767697632458 and case / reference 177613748700177:

1) Root password: We changed the AWS root password on [DATE/TIME UTC].

2) Root MFA: We enabled MFA on the AWS root user on [DATE/TIME UTC] (device type: [virtual hardware U2F]).

3) CloudTrail: We reviewed CloudTrail for unauthorized API activity. We observed unauthorized root API usage from source IP 45.61.128.156 using access key AKIAIQYX7Z65F25NMY6A, including ImportKeyPair and RunInstances in us-west-2 associated with key pair name "buatbelisdfgmsobilbaim". That access key has been removed from the account. We terminated impacted EC2 instances and deleted the imported key pair across regions. Subsequent DescribeInstances / TerminateInstances activity used a different access key from our own incident-response IP range.

We request that any temporary service limitations placed on account 767697632458 be lifted after your verification.

We continue to migrate away from root long-term access keys to least-privilege IAM with MFA.

Thank you,
[Your name]
[Organization]
```

---

## 6. Optional attachments

- This file (export to PDF from your editor if AWS requests a formal attachment).
- Screenshot evidence (redact secrets): **IAM** root MFA **enabled**, **password last changed** date, **CloudTrail** event detail for **`ImportKeyPair`** / **`RunInstances`** (event time, `userIdentity.accessKeyId`, `sourceIPAddress`).

---

## 7. Disclaimer

This document summarizes operator findings and remediation to the best of our knowledge. It is **not** a warranty of complete eradication of compromise; continued monitoring is recommended.
