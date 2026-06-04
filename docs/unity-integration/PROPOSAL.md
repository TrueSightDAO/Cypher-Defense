# Unity Risk Indicator — Integration Proposal for TrueSight DAO / Cypher Defense

**Author:** TrueSight DAO Autopilot  
**Date:** 2026-06-04  
**Status:** Draft for Review

---

## Executive Summary

This proposal examines the **Netswitch-Inc/unity** repository (the "Unity Risk Indicator" platform) and evaluates how its cybersecurity framework can be integrated into the **TrueSight DAO digital infrastructure** via the **Cypher-Defense** codebase. Unity is a full-stack compliance, risk assessment, and threat intelligence platform built on Node.js/Express + MongoDB + React. Cypher-Defense is currently a Chrome extension for Web3 phishing protection with AWS incident-response scripts. This document maps Unity's capabilities onto our existing infrastructure and proposes a phased integration plan.

---

## Part 1: What Is the Unity Risk Indicator?

### Architecture Overview

Unity is a **cybersecurity compliance and risk assessment platform** with the following stack:

- **Backend:** Node.js/Express (MVC), MongoDB (Mongoose ODM), JWT auth
- **Frontend:** React (Create React App), Docker Compose orchestration
- **Deployment:** Docker containers, Nginx reverse proxy, Ubuntu 20.04+

### Core Modules (from backend controllers/routes)

| Module | Purpose |
|--------|---------|
| **Frameworks** | Manage security frameworks (NIST, ISO 27001, CIS, etc.) |
| **Controls** | Individual security controls mapped to frameworks |
| **CIS Controls** | CIS-specific control implementation with sub-controls, asset types, security functions |
| **Assessments** | Conduct security assessments against frameworks |
| **Sections** | Assessment sections / categories |
| **Questions** | Assessment questions with ordering |
| **QuestionAnswers** | Answers to assessment questions |
| **AssessmentReports** | Generate PDF reports from assessments |
| **Company** | Multi-tenant company management |
| **CompanyComplianceControls** | Per-company compliance control tracking |
| **CompliancePriorities** | Prioritization of compliance gaps |
| **ConfigurationAssessments** | Configuration baseline assessments |
| **Agents** | Wazuh agent management (endpoint monitoring) |
| **WazuhIndexer** | Wazuh SIEM data ingestion and statistics |
| **OpenVASScanReports** | Vulnerability scan report management |
| **NetSwitchThreatIntels** | Threat intelligence feeds and indicators |
| **NetswitchThreatIntelStats** | Threat intelligence statistics and analytics |
| **CronSchedulers** | Scheduled security tasks |
| **EventLogs** | Security event logging |
| **HelpdeskSupport** | Security helpdesk ticketing |
| **Dashboard** | Widget-based security dashboard |
| **Users/Roles/Permissions** | RBAC with granular permissions |
| **Connections** | External system integrations |
| **AI Prompts** | AI-assisted security description generation |

### Key Integrations (from package.json)

- **Wazuh** — Open-source SIEM/endpoint security
- **OpenVAS** — Vulnerability scanning
- **AWS SDK** — Cloud infrastructure monitoring
- **Azure MSAL** — Microsoft identity integration
- **Twilio** — SMS notifications
- **Nodemailer** — Email notifications
- **Puppeteer** — PDF generation / web scraping
- **JSON Web Tokens** — Authentication

---

## Part 2: Our Current Digital Infrastructure

### AWS Accounts

**Account 1: Explorya (440626669078)**
- `truesight-autopilot` — t3.small (running)
- `seni_sk_2026` — t2.small (stopped)
- `seni_ror_2026` — t2.small (stopped)

**Account 2: Nelanco (767697632458)**
- `krake_nginx` — t2.micro (running) — Nginx reverse proxy
- `krake_ror` — t2.micro (running) — Krake Rails backend
- `krake_sk` — t2.nano (running) — Sidekiq worker
- `krake_sk_crawler` — t2.small (running)
- `krake_sk_webhook` — t2.small (running)
- `krake_sk_scaler` — t2.micro (running)
- `krake_data` — t3.medium (running)
- `seni_ror_200250915` — t2.small (running) — Edgar (DAO API)
- `seni_sk_auto` — t2.small (running) — Sidekiq
- `seni_sql_2026` — t2.small (running) — PostgreSQL
- `seni_redis_2` — t2.large (running) — Redis
- `GETDATA_REDIS` — t3a.small (running)
- `GETDATA_CACHE` — t2.micro (running)
- `dao_protocol_nelanco` — t3.small (running)

### Security Posture Today

**What we have (Cypher-Defense):**
- Chrome extension for Web3 phishing detection (domain/person/URL blacklists)
- AWS incident-response scripts (key pair cleanup, instance termination)
- Incident documentation (AWS Trust & Safety reports)
- Member briefings

**What we DON'T have:**
- No SIEM integration (Wazuh, OpenVAS)
- No formal compliance framework mapping (CIS, NIST, ISO)
- No vulnerability scanning pipeline
- No security assessment / audit workflow
- No threat intelligence feed management
- No centralized security dashboard
- No RBAC for security operations
- No scheduled security task automation
- No configuration baseline management
- No security event logging system

---

## Part 3: Mapping Unity to Our Infrastructure

### Where Unity Would Fit

```
Unity Risk Indicator (new deployment)
        |
        |--- Wazuh Agent ---> EC2 instances (all hosts)
        |--- OpenVAS Scanner ---> Network vulnerability scanning
        |--- Threat Intel Feeds ---> External + internal IoCs
        |--- Compliance Framework ---> CIS Controls, NIST SP 800-53
        |--- Assessment Engine ---> Security audits & reports
                |
                v
        Cypher-Defense (extension layer)
                |
                |--- Web3 phishing blacklist (existing)
                |--- AWS incident response (existing)
                |--- New: Unity API consumer
```

### Integration Points with Existing Systems

| Existing System | Unity Integration |
|----------------|-------------------|
| **Cypher-Defense Chrome Extension** | Add Unity API consumer — check domains against Unity's threat intel before showing blacklist status |
| **truesight-autopilot** | Add security monitoring playbooks — auto-triage Wazuh alerts, OpenVAS findings |
| **Edgar (sentiment_importer)** | Security event webhook receiver — Unity events -> Edgar -> DAO notification |
| **AWS accounts** | Wazuh agents on all EC2 instances; Unity CIS benchmarks for AWS config assessment |
| **dao_protocol** | Security assessment results on-chain for DAO transparency |
| **GitHub Actions CI** | Unity webhook for security gates on deployments |

---

## Part 4: Proposed Integration Architecture

### Phase 1 — Foundation (Weeks 1-2)

**Deploy Unity backend + database on existing infrastructure:**

```
+---------------------------------------------+
|  Unity Risk Indicator (new t3.small on       |
|  Nelanco account, or co-locate with          |
|  dao_protocol_nelanco)                       |
|                                              |
|  |-- MongoDB (container or existing seni_sql)|
|  |-- Express API (port 3006)                 |
|  |-- React Frontend (port 8081)              |
+------------------------+---------------------+
                         |
                         v
+---------------------------------------------+
|  Wazuh SIEM (new t2.medium)                  |
|                                              |
|  |-- Wazuh Indexer (Elasticsearch fork)      |
|  |-- Wazuh Server (management)               |
|  |-- Wazuh Dashboard (Kibana)                |
+------------------------+---------------------+
                         |
                         v
              Wazuh Agents on all EC2 hosts
```

**Key decisions:**
- Deploy Unity on Nelanco account (same VPC as existing infra)
- Use Docker Compose (as Unity's existing deployment model)
- MongoDB can be a container or use existing seni_sql PostgreSQL — Unity uses Mongoose, so MongoDB is required
- Wazuh needs its own instance (minimum t2.medium for the indexer)

### Phase 2 — CIS Controls Baseline (Weeks 3-4)

1. **Load CIS Controls** into Unity's framework database
2. **Run CIS benchmarks** against all EC2 instances
3. **Map existing security measures** to CIS controls:
   - SSH key management -> CIS Control 1 (Inventory and Control of Hardware Assets)
   - Security groups -> CIS Control 4 (Controlled Use of Administrative Privileges)
   - Incident response docs -> CIS Control 17 (Incident Response Management)
4. **Generate compliance gap analysis** via Unity's assessment engine

### Phase 3 — Threat Intelligence Pipeline (Weeks 5-6)

1. **Connect Cypher-Defense blacklist** as a threat intel source in Unity
2. **Add external threat feeds** (AlienVault OTX, MISP, etc.)
3. **Unity's NetSwitchThreatIntels** module correlates internal + external IoCs
4. **Cypher-Defense extension** queries Unity API for enriched threat data
5. **Automated IoC ingestion** from DAO member reports (Telegram, Discord)

### Phase 4 — Continuous Monitoring (Weeks 7-8)

1. **Wazuh agents** on all production EC2 hosts
2. **OpenVAS scheduled scans** of network perimeter
3. **Unity cron schedulers** for periodic assessments
4. **Dashboard widgets** for real-time security posture
5. **Alerting pipeline** — Unity -> Edgar -> DAO notifications

---

## Part 5: Code-Level Changes to Cypher-Defense

### 5.1 New Directory Structure

```
Cypher-Defense/
|-- unity-integration/          # NEW
|   |-- docker-compose.yml      # Unity + Wazuh deployment
|   |-- .env.example
|   |-- README.md
|   |-- scripts/
|   |   |-- deploy_unity.sh
|   |   |-- seed_cis_controls.py
|   |   |-- sync_blacklist_to_unity.py
|   |-- config/
|       |-- unity_api_config.js
|-- js/
|   |-- background/controllers/
|   |   |-- cypher_controller.js  # MODIFY — add Unity API calls
|   |   |-- unity_controller.js   # NEW — Unity integration
|   |-- config/
|       |-- config.js             # MODIFY — add Unity API host
|-- scripts/aws/
|   |-- ... (existing)
|   |-- deploy_wazuh_agents.sh    # NEW
|-- docs/
    |-- incidents/ (existing)
    |-- aws-reports/ (existing)
    |-- unity-integration/        # NEW
        |-- ARCHITECTURE.md
        |-- DEPLOYMENT.md
        |-- OPERATIONS.md
```

### 5.2 Cypher-Defense Extension Changes

**Current flow (simplified):**
```
User visits URL -> CypherController checks local blacklist -> returns status
```

**Proposed flow:**
```
User visits URL -> CypherController checks local blacklist (fast path)
                -> ALSO queries Unity API (async) for enriched threat intel
                -> Unity returns: risk score, related IoCs, assessment findings
                -> Extension shows enriched warning UI
```

**New `unity_controller.js` would:**
- Authenticate with Unity API (JWT)
- Submit domains/URLs for threat analysis
- Retrieve risk scores and assessment data
- Cache results locally for offline use

### 5.3 AWS Scripts Enhancement

**New `deploy_wazuh_agents.sh`:**
- Install Wazuh agent on all EC2 instances
- Register with Wazuh server
- Apply CIS benchmark scanning profiles
- Report results to Unity

**Modify `terminate_ec2_by_launch_keypair.py`:**
- Log termination events to Unity EventLogs
- Trigger Unity assessment re-evaluation after infrastructure changes

---

## Part 6: Infrastructure Requirements

### Compute

| Component | Spec | Est. Monthly Cost |
|-----------|------|-------------------|
| Unity Backend + Frontend | t3.small (2 vCPU, 2 GB) | ~$20 |
| Wazuh Indexer + Server | t3.medium (2 vCPU, 4 GB) | ~$35 |
| Wazuh Dashboard | t3.small (2 vCPU, 2 GB) | ~$20 |
| OpenVAS Scanner | t3.small (2 vCPU, 2 GB) | ~$20 |
| **Total new** | | **~$95/mo** |

### Storage

- MongoDB: 20 GB gp3 (~$5/mo)
- Wazuh indices: 50 GB gp3 (~$12/mo)
- OpenVAS results: 10 GB gp3 (~$3/mo)

### Network

- All within existing VPC (Nelanco account, us-east-1)
- No additional NAT gateway needed
- Security group rules for inter-service communication

---

## Part 7: Risk Assessment

### Benefits

1. **Compliance readiness** — CIS/NIST framework mapping for FDA FSVP, SOC 2, etc.
2. **Threat detection** — Wazuh SIEM on all hosts
3. **Vulnerability management** — OpenVAS scheduled scanning
4. **Audit trail** — Unity EventLogs + TrueChain blockchain notarization
5. **DAO transparency** — Security posture visible to members via dashboard
6. **Automated incident response** — Unity cron schedulers + autopilot playbooks

### Risks

1. **Operational overhead** — Maintaining Wazuh + OpenVAS + Unity requires dedicated SRE time
2. **False positives** — SIEM tuning needed to avoid alert fatigue
3. **Credential management** — Wazuh agents need registration keys; Unity needs API tokens
4. **MongoDB expertise** — Current stack uses PostgreSQL; team needs MongoDB ops knowledge
5. **Cost** — ~$135/mo total for new infrastructure

### Mitigations

1. Start with Phase 1 only (Unity core, no Wazuh) for 30-day evaluation
2. Use existing seni_sql PostgreSQL for Unity (requires Mongoose -> Sequelize migration or sidecar MongoDB)
3. Deploy Wazuh agents incrementally — start with production hosts only
4. Automate credential rotation via Unity's cron scheduler

---

## Part 8: Recommendation

### Phased Rollout

| Phase | Timeline | Investment | Value |
|-------|----------|------------|-------|
| **1: Unity Core** | Week 1-2 | ~$20/mo + 8 hrs setup | Compliance framework, assessments, RBAC |
| **2: CIS Baseline** | Week 3-4 | 4 hrs | Gap analysis, prioritized remediation |
| **3: Threat Intel** | Week 5-6 | 4 hrs + extension changes | Enriched phishing detection |
| **4: Continuous Monitoring** | Week 7-8 | ~$95/mo + 8 hrs | SIEM, vulnerability scanning, dashboards |

### Immediate Next Steps

1. **Clone Unity repo** into TrueSightDAO organization (or fork)
2. **Deploy Unity** on a t3.small in Nelanco account alongside dao_protocol
3. **Load CIS Controls** (v8) into Unity's framework database
4. **Connect Cypher-Defense** extension to Unity API for enriched threat data
5. **Document** in Cypher-Defense repo under `docs/unity-integration/`

### Go/No-Go Decision Point

After Phase 1 (2 weeks), evaluate:
- Is the Unity UI useful for our ops team?
- Does the assessment engine produce actionable results?
- Is the MongoDB overhead manageable?
- Should we proceed to Wazuh/OpenVAS (Phase 4)?

---

## Appendix A: Unity API Endpoints Relevant to Cypher-Defense

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/netswitch-threat-intels` | GET/POST | Query/submit threat intelligence |
| `/api/netswitch-threat-intels-stats` | GET | Threat intel statistics |
| `/api/assessments` | GET/POST | Security assessments |
| `/api/assessment-reports` | GET/POST | Generate assessment reports |
| `/api/company-compliance-controls` | GET/POST | Track compliance status |
| `/api/cis-controls` | GET | CIS control definitions |
| `/api/event-logs` | POST | Log security events |
| `/api/dashboard-widgets-order` | GET | Dashboard configuration |

## Appendix B: Key Files to Modify in Cypher-Defense

1. `js/config/config.js` — Add `unity_host` and `unity_api_key`
2. `js/background/controllers/cypher_controller.js` — Add Unity API call in `info()` method
3. `js/background/application.js` — Register Unity controller
4. `manifest.json` — Add Unity host to permissions
5. `scripts/aws/terminate_ec2_by_launch_keypair.py` — Add Unity event logging
6. `README.md` — Document Unity integration

---

*Proposal generated by TrueSight DAO Autopilot on 2026-06-04*
