# Member briefing: AWS cloud account security (April 2026)

**Audience:** TrueSight DAO members — including people who do not manage our cloud systems day to day.  
**Purpose:** Explain, in plain language, what happened with one of our **Amazon Web Services (AWS)** accounts, what we did about it, and what it means for you.

---

## In one minute

Amazon hosts “virtual computers” and other services we sometimes use for projects and automation. In mid‑April 2026, **Amazon warned us** that **someone outside our team** may have used **stolen login material** to access **our AWS account** (`767697632458`) and run **unwanted activity** (for example, spinning up computers we did not intend).

That is **serious**, but it is **not** a breach of the DAO’s blockchain wallets or Google Sheets by default — it is specifically about **this cloud vendor account**. We **treated it as a real incident**, **locked things down**, **cleaned up** what the attacker could touch, and **replied to Amazon** with what we fixed.

If you have questions after reading this, ask in your usual DAO channel or contact the people who steward infrastructure.

---

## What happened (plain language)

1. **AWS sent us security emails.** They said our account might have been accessed inappropriately and asked us to **secure the account** (change passwords, turn on extra verification, review logs).

2. **Our investigation found a likely cause:** a **long‑lived “root” access key** (think: a spare house key taped under the mat) had probably **leaked** and was used from **somewhere on the internet** to **create SSH keys** and **start virtual servers** in Amazon’s **US West (Oregon)** region.

3. **We do not use that pattern for normal DAO work.** Normal practice is **short‑lived access**, **least privilege**, and **no routine use of the “root” account keys**. So this activity was treated as **unauthorized**.

4. **We cleaned up:** removed the bad key material, **shut down** related servers where applicable, **deleted** the rogue **SSH key pair name** across regions, and **moved** remaining break‑glass credentials so they are **not stored inside unrelated app repos**.

5. **Amazon may temporarily limit some services** until they are satisfied we secured the account. That is **their protective measure**, not a punishment of the DAO’s mission.

---

## What we did (outcomes you can trust)

| What you care about | What we did |
|---------------------|-------------|
| **Stop the bleeding** | Revoked / confirmed gone the **access key** tied to the suspicious activity; **removed** imported SSH key pairs used in the incident across **multiple regions**. |
| **Evidence for Amazon** | Prepared a **formal written response** with timelines and technical detail (see link below). |
| **Stronger account hygiene** | **Change root password**, **enable MFA (multi‑factor authentication)** on the AWS root login, and **review CloudTrail logs** — these are the steps Amazon asked for; operators complete them in the AWS console and record times for the reply. |
| **Less risk next time** | Credentials for incident response live in a **dedicated local file** that is **never committed to GitHub**; automation scripts for cleanup live in this repo under `scripts/aws/`. |

---

## Documents you can open

| Document | Who it is for | Link |
|----------|----------------|------|
| **Formal reply for AWS support** (technical + paste‑ready email) | Operators replying to Amazon | [AWS account security response (case 177613748700177)](../aws-reports/2026-04-14-case-177613748700177-account-security-response.md) |
| **Technical incident notes** (CloudTrail, API names) | Operators / auditors | [EC2 / Trust & Safety incident notes](../incidents/2026-04-13-aws-ec2-trust-safety-abuse.md) |
| **Downloaded copy of the AWS email** (PDF) | Members who want the original notice | [attachments/aws_complain.pdf](../aws-reports/attachments/aws_complain.pdf) |

On GitHub’s website, use the “Download” or “Raw” view for the PDF if your browser does not show it inline.

---

## What this does **not** mean (avoiding confusion)

- **This is not automatically “the DAO was hacked end‑to‑end.”** It means **one AWS account** showed signs of **misuse** and we responded **as if** it were compromised until proven otherwise.
- **It does not replace legal, insurance, or regulatory advice** if those ever apply to a specific partner or jurisdiction.
- **Members are not expected to read CloudTrail.** This briefing exists so **everyone** can understand the **gist** and **trust** that **operators took it seriously**.

---

## How we will work going forward

- **Cypher‑Defense** (this repository) is the home for **phishing / scam awareness** *and* **AWS “clean‑up and lessons learned”** materials (`docs/`, `scripts/aws/`).
- **Do not put cloud “root” keys into random app repositories.** If you ever see an AWS key in a repo, treat it as an **emergency** and tell an operator **privately** (do not paste keys in public chat).

---

## Thank you

Incidents like this are stressful. Thank you to everyone who helped triage, document, and secure the account. If you want a **walkthrough** of this briefing on a call, ask in DAO operations channels.
