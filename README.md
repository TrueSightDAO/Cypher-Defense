# Cypher Defense 

## Introduction 
This is a project to help protect DAO members from the prevalent scam, impersonation and phishing attacks that are happening in the Web3 space

This repository is also the **home for AWS account hygiene and incident-response helpers** (shell scripts under `scripts/aws/`, and dated write-ups under `docs/incidents/`). Phishing tooling and cloud abuse are different problems, but both belong under “defense” for the workspace.

---

## AWS account cleanup (scripts)

EC2 SSH **key pairs are regional** (they are not scoped per Availability Zone). Cleanup scripts therefore iterate **AWS Regions**, not individual AZs.

### Prerequisites

- AWS CLI v2 installed and on `PATH`.
- Credentials in **`./.env`** at the repo root (never commit — see **`.gitignore`** and **`.env.example`**). Supported variable names:
  - `AWS_KEY` + `AWS_SECRET`, or
  - `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`
- Prefer **least-privilege IAM** over root keys. Root keys should be an emergency-only path.

### Scripts

| Script | Purpose |
|--------|---------|
| `scripts/aws/delete_ec2_keypair_all_regions.sh` | Deletes a named EC2 key pair in **every region** where it exists. |
| `scripts/aws/terminate_ec2_by_launch_keypair.py` | Lists or terminates EC2 instances by **launch-time key pair name** across regions, or by **`--instance-id`** (scans all regions). Loads repo-root **`.env`**. Requires `boto3` and `python-dotenv`. |

Example:

```bash
cd /path/to/Cypher-Defense
cp .env.example .env   # once, then edit with real values (do not commit)
./scripts/aws/delete_ec2_keypair_all_regions.sh buatbelisdfgmsobilbaim

pip install boto3 python-dotenv
python3 scripts/aws/terminate_ec2_by_launch_keypair.py
python3 scripts/aws/terminate_ec2_by_launch_keypair.py --instance-id i-0123456789abcdef0 --execute
```

### Incident write-ups

See **`docs/incidents/`** for dated analyses (e.g. AWS Trust & Safety reports, CloudTrail findings, corrective actions).

---

## Use cases
Allow members to flag and get warned on any of the following

  - A potentially fradulent DApp
  - A potentially fradulent NFT mint page 
  - A potentially fradulent NFT open sea listing
  - [LinkedIn](https://linkedin.com) Account impersonation
  - [Instagram](https://instagram.com/) Account impersonation
  - [Twitter](https://twitter.com) Account impersonation
  - [Discord](https://discord.com/app) Account impersonation
  - [Telegram](https://web.telegram.org/?legacy=1#/im) Account impersonation


## RoadMap

- 20221104 - receive warning of fradulent DApp


## Sample payload from Blockchain
```
[
  {
    "type": "domain",
    "value": "metaversegold.space",
    "status": "blacklisted"
  },
  {
    "type": "domain",
    "value": "atoplatform.com",
    "status": "blacklisted"
  },  
  {
    "type": "person",
    "network": "linkedin.com",
    "value": "carrie-eldridge-57204516",
    "status": "blacklisted"
  },
  {
    "type": "nft",
    "network": "opensea.io",
    "value": "https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/92576773502308227007783329158296328196738822351079709811986613407507430768641",
    "status": "blacklisted"
  }
]
```

## Pre-requisites
utilizes handlebar

Installing handlbars
```
npm install -g handlebars
```

Precompiles the templates
```
cd js/content/templates

handlebars sidebar.hbs -f sidebar.hbs.precompiled.js
handlebars column.hbs -f column.hbs.precompiled.js
handlebars community_icon.hbs -f community_icon.hbs.precompiled.js
handlebars listing_panel_column.hbs -f listing_panel_column.hbs.precompiled.js
handlebars listing_panel_recommended_column.hbs -f listing_panel_recommended_column.hbs.precompiled.js
handlebars recommended_panel_column.hbs -f recommended_panel_column.hbs.precompiled.js
handlebars introduction_modal.hbs -f introduction_modal.hbs.precompiled.js
handlebars notification_panel.hbs -f notification_panel.hbs.precompiled.js
handlebars notification_save_panel.hbs -f notification_save_panel.hbs.precompiled.js

```