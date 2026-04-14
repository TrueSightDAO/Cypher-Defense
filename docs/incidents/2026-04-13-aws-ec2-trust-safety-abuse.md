# AWS Trust & Safety — EC2 outbound abuse (April 2026)

**Account:** `767697632458`  
**Primary region in report:** `us-west-2`  
**Instance cited:** `i-023059e53e79e1dc3`  
**AWS case (example):** `11760736376-1`  

This note records what we observed, what we infer, and what we changed. It is **not** legal advice and **not** an exhaustive forensics report.

---

## 1. What AWS reported

AWS indicated that an EC2 instance in `us-west-2` was associated with **outbound activity resembling unauthorized access attempts** to remote hosts. The sample log referenced **outgoing TCP to port 3389 (RDP)** toward a specific remote IP, and AWS applied a **mitigating block** on that path.

Port **3389** is commonly associated with **Windows Remote Desktop**. Unexpected RDP scanning or lateral movement patterns from cloud VMs are a frequent abuse signal.

---

## 2. What CloudTrail showed (management events)

Using CloudTrail in `us-west-2` (and corroborating where available):

### 2.1 Suspicious control-plane pattern

A sequence of API calls was performed from **source IP `45.61.128.156`**, with a **Python Boto3 / Botocore** user agent on **Linux**, using **root IAM credentials** (`arn:aws:iam::767697632458:root`) and access key **`AKIAIQYX7Z65F25NMY6A`**.

Notable events included:

- **`ImportKeyPair`** for key pair name **`buatbelisdfgmsobilbaim`** (imported public key material; not an AWS-generated “download PEM” flow).
- Multiple **`RunInstances`** attempts with the same AMI / key / security group context; some attempts failed with **`Client.VcpuLimitExceeded`**, followed by a successful **`RunInstances`** (response payload sometimes omitted in console lookup due to size limits).

### 2.2 Cleanup / inspection pattern (separate key)

Later activity from a **different** source IP consistent with **operator cleanup** (e.g. **`DescribeInstances`**, **`TerminateInstances`**) was associated with access key **`AKIA3FPSYHTFC532UEJO`** (still a **root** key in this account at the time of inspection).

### 2.3 Interpretation

The **`45.61.128.156` / AKIAIQYX7Z65F25NMY6A`** activity is consistent with **a leaked root access key** being used from an external host to **import an SSH key** and **launch EC2** in `us-west-2`.

That is **not** the same as “the SSH key pair alone proves compromise,” but the **root long-lived key + imports + launches** is a high-severity control-plane indicator.

---

## 3. IAM state after review

At the time of follow-up IAM inspection:

- **`AKIAIQYX7Z65F25NMY6A`** was **not** present on any scanned IAM user and **not** listed among the account’s remaining **root access keys** → treated as **removed/inactive** (still rotate anything that could have been exposed and assume past misuse).
- The account retained a **separate active root access key** used for legitimate operations — **root access keys should be eliminated** where possible in favor of **least-privilege IAM** with **MFA**.

---

## 4. Corrective actions (operator checklist)

These are the actions we recommend documenting in replies to AWS Trust & Safety:

1. **Disable and delete** unauthorized root access keys; **rotate** any credentials that may have appeared in repos, backups, or email.
2. **Terminate** unknown instances; **delete** imported key pairs tied to the incident naming (`buatbelisdfgmsobilbaim`) across **all regions** (key pairs are regional).
3. **Tighten security groups / NACLs**: default-deny egress where feasible; allow only required ports and destinations.
4. **Turn on organization-wide or multi-region CloudTrail** with immutable storage where appropriate; enable **GuardDuty** and **AWS Config** for drift detection.
5. **Remove secrets from source control** (search git history); use **SSM Parameter Store / Secrets Manager** and **IAM roles**, not root keys.
6. **Review** `krake_ror` and any other repos for **hard-coded AWS keys** (separate finding during this incident response).

---

## 5. Repository hygiene (this monorepo)

Going forward, **AWS incident-response credentials and cleanup scripts** should live under **`Cypher-Defense/`**:

- Local secrets: **`Cypher-Defense/.env`** (gitignored).
- Scripts: **`Cypher-Defense/scripts/aws/`** (safe to commit).

**`market_research/.env`** should remain for marketing / research automation keys only, not long-lived cloud admin credentials.

---

## 6. References

- [AWS Acceptable Use Policy](https://aws.amazon.com/aup/)
- [EC2 security groups](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html)
- [AWS Security best practices](https://docs.aws.amazon.com/security/)
