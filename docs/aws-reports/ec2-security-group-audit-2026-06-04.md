# EC2 Security Group Audit — Findings, Implementation Plan & Execution Roadmap

- **Date:** 2026-06-04
- **Scope:** TrueSight DAO AWS accounts — `nelanco` (767697632458) and `explorya` (440626669078)
- **Method:** read-only `ec2:DescribeInstances` + `ec2:DescribeSecurityGroups` across all active regions (us-east-1, ap-southeast-1, us-west-1). IPv4 `0.0.0.0/0` ingress only — **IPv6 (`::/0`) was not enumerated and must be checked during execution.**
- **Status:** AUDIT COMPLETE. Implementation + execution are **not yet started** — no changes have been made to any security group.

---

## 1. Executive summary

**CRITICAL.** The Amazon-managed **`default` security group in us-east-1 allows ALL inbound traffic from `0.0.0.0/0`** (every port, every protocol), and **16 running production instances** rely on it — across both accounts. That means Redis (6379), Postgres (5432), the dao_protocol API (8010), Rails, and SSH (22) on these boxes are all directly reachable from the public internet, gated only by whatever auth each service happens to enforce. Unauthenticated Redis / database exposure is the worst-case here.

Additional findings: SSH open to the world on a SG-Pore proxy; a 4-port world-open SG on two *stopped* explorya boxes (decommission candidates). One instance — **`Californian proxy` (us-west-1)** — has **no** `0.0.0.0/0` rules and is the reference pattern to copy.

This is the single biggest deduction on the security dashboard score, and remediating it is the highest-impact action available.

---

## 2. Audit findings

### 2.1 Critical exposure — `default` SG = ALL traffic from 0.0.0.0/0

| Account | Region | Instance | Instance ID | State | Inferred role | Exposing SG | World-open |
|---|---|---|---|---|---|---|---|
| nelanco | us-east-1 | GETDATA_REDIS | i-030c1452b197c920a | running | Redis cache (6379) | default (sg-4314630c) | **ALL** |
| nelanco | us-east-1 | GETDATA_CACHE | i-0d63b472d8a8893f8 | running | Redis/cache | default (sg-4314630c) | **ALL** |
| nelanco | us-east-1 | seni_redis_2 | i-09ecc8ecc91d09206 | running | Redis cache | new default (sg-0aac0e825c554da19) | **ALL** |
| nelanco | us-east-1 | seni_sql_2026 | i-08ebe96afbc649a95 | running | Postgres (5432) | default (sg-4314630c) | **ALL** |
| nelanco | us-east-1 | seni_ror_200250915 | i-063dc4a3be90bd630 | running | Edgar Rails (prod) | default (sg-4314630c) | **ALL** |
| nelanco | us-east-1 | dao_protocol_nelanco | i-05f8770a932b76649 | running | dao_protocol API (8010) | default (sg-4314630c) | **ALL** |
| nelanco | us-east-1 | seni_sk_auto | i-09883a010a52509f6 | running | Sidekiq/worker | default (sg-4314630c) | **ALL** |
| nelanco | us-east-1 | seni_sk_auto | i-0dfeb7a93f1f78e8e | running | Sidekiq/worker | default (sg-4314630c) | **ALL** |
| nelanco | us-east-1 | krake_nginx | i-05a041b6956aa7154 | running | nginx (80/443 public) | default (sg-4314630c) | **ALL** |
| nelanco | us-east-1 | krake_ror | i-0df7a9e513dc537a6 | running | Krake Rails | default (sg-4314630c) | **ALL** |
| nelanco | us-east-1 | krake_data | i-07c76510b231d787f | running | data store | default (sg-4314630c) | **ALL** |
| nelanco | us-east-1 | krake_sk | i-0b82138aa45b4029a | running | Sidekiq/worker | default (sg-4314630c) | **ALL** |
| nelanco | us-east-1 | krake_sk_scaler | i-03224db5f5a49709c | running | worker | default (sg-4314630c) | **ALL** |
| nelanco | us-east-1 | krake_sk_webhook | i-02599e3b3a03e38e4 | running | webhook receiver | default (sg-4314630c) | **ALL** |
| nelanco | us-east-1 | krake_sk_crawler | i-06fc0dd44fa9cdbf2 | running | crawler/worker | default (sg-4314630c) | **ALL** |
| explorya | us-east-1 | truesight-autopilot | i-02c699d3d7efbdc82 | running | autopilot / "sophia" (52.200.38.206) | default (sg-e98f788e) | **ALL** |

### 2.2 High — SSH (22) open to the world

| Account | Region | Instance | Instance ID | State | Exposing SG | World-open |
|---|---|---|---|---|---|---|
| nelanco | ap-southeast-1 | LATOKENS - exchange proxy | i-0c72b8fdf42a1b347 | running | launch-wizard-1 (sg-001417b2ba3006077) | 22/tcp |

### 2.3 Medium — world-open SG on *stopped* instances (decommission candidates)

| Account | Region | Instance | Instance ID | State | Exposing SG | World-open |
|---|---|---|---|---|---|---|
| explorya | us-east-1 | seni_sk_2026 | i-0bb43299c84c5ccd5 | **stopped** | edgar-2026-05-10 (sg-093be54e48c6478e8) | 80, 22, 3002, 443 |
| explorya | us-east-1 | seni_ror_2026 | i-0ac8462aa6bb54986 | **stopped** | edgar-2026-05-10 (sg-093be54e48c6478e8) | 80, 22, 3002, 443 |

### 2.4 Good — reference pattern (no `0.0.0.0/0`)

| Account | Region | Instance | Instance ID | Exposing SG | World-open |
|---|---|---|---|---|---|
| nelanco | us-west-1 | Californian proxy | i-0b2e0c6f9469ab0f7 | default (sg-c6eeaabd) | none |

---

## 3. Risk assessment

| Severity | Finding | Why it matters |
|---|---|---|
| **Critical** | `default` SG (us-east-1, both accounts) = all-traffic `0.0.0.0/0` on 16 running boxes | Redis (often no auth), Postgres, dao_protocol API, and all internal ports are internet-reachable. A single weak/unauthenticated service = full compromise. |
| **High** | SSH (22) world-open on `default` (all 16 boxes) and `launch-wizard-1` | Constant brute-force surface; should be admin-IP / SSM only. |
| **Medium** | `edgar-2026-05-10` world-open (4 ports) on 2 stopped boxes | No live exposure while stopped, but the boxes + SG are stale — terminate or re-secure before any restart. |
| **Low/Good** | `Californian proxy` has no world-open rules | Use as the template for "locked-down proxy". |

---

## 4. Implementation plan — target security-group architecture

Replace the shared, wide-open `default` SG with **role-scoped SGs that reference each other by SG ID** (not CIDR) for internal traffic, so services are only reachable from the tiers that need them.

| New SG | Inbound rule | Source | Attach to |
|---|---|---|---|
| `tsd-ssh-admin` | 22/tcp | `<ADMIN_CIDR>` (your IP/VPN) — or **0 inbound if SSM Session Manager is enabled** | every instance |
| `tsd-web-public` | 80, 443/tcp | `0.0.0.0/0` (+ `::/0`) | nginx + any public web (`krake_nginx`; confirm others) |
| `tsd-app` | app ports (Rails 3000, dao_protocol 8010, krake webhook port) | `tsd-web-public` (SG ref) | `seni_ror_200250915`, `krake_ror`, `dao_protocol_nelanco`, `krake_sk_webhook` |
| `tsd-redis` | 6379/tcp | `tsd-app` + `tsd-worker` (SG refs) | `GETDATA_REDIS`, `GETDATA_CACHE`, `seni_redis_2` |
| `tsd-db` | 5432 (and/or 3306) | `tsd-app` (SG ref) | `seni_sql_2026`, `krake_data` (confirm engine) |
| `tsd-worker` | none (egress only) | — | `krake_sk`, `krake_sk_scaler`, `krake_sk_crawler`, `seni_sk_auto` ×2 |

**Must-confirm before finalizing the map (Phase 2):** run `ss -tlnp` (or `netstat -tlnp`) on each instance to capture the actual listening ports + which are bound to `0.0.0.0` vs `127.0.0.1`. Several services may already bind to localhost only (in which case the SG can be fully closed). Also confirm inter-instance dependencies (e.g. which app boxes talk to which Redis/DB) so the SG-ref sources are correct.

---

## 5. Execution roadmap (incremental, reversible)

> Guiding rule: **never remove access before the replacement is verified.** Add new SGs alongside `default`, prove connectivity, then remove `default` per instance — one at a time, with a recorded rollback command for each step.

- [ ] **Phase 0 — Break-glass & prerequisites**
  - [ ] Confirm **SSM Session Manager** works on each box (`aws ssm start-session`) so SSH-via-SG is never the only way in. If not, set `ADMIN_CIDR` and keep an out-of-band console path.
  - [ ] Obtain a **write-scoped** IAM key (the scanner keys are read-only): `ec2:CreateSecurityGroup`, `ec2:AuthorizeSecurityGroupIngress/Egress`, `ec2:RevokeSecurityGroupIngress`, `ec2:ModifyInstanceAttribute`, `ec2:ModifyNetworkInterfaceAttribute`.
  - [ ] Save this audit JSON as the pre-change snapshot (rollback reference).
- [ ] **Phase 1 — Create the new SGs** (additive; zero runtime impact). Per region/account.
- [ ] **Phase 2 — Confirm actual listening ports** (`ss -tlnp` per instance) → finalize the per-instance SG map in §4.
- [ ] **Phase 3 — Pilot on ONE low-risk box** (e.g. a `krake_sk*` worker): attach the new SG(s) **alongside** `default`, verify SSH (via SSM/admin) + the service, monitor ~30 min.
- [ ] **Phase 4 — Attach new SGs across all instances** alongside `default`, by tier: workers → caches → db → app → web. Verify after each.
- [ ] **Phase 5 — Remove the `default` SG association** per instance once its replacement is verified — one at a time, lowest-risk first. Record the exact re-attach command before each removal.
- [ ] **Phase 6 — Tighten the now-unused SGs:** revoke the `0.0.0.0/0` ALL rule on `default` (sg-4314630c) + `new default` (sg-0aac0e825c554da19) + `default` (sg-e98f788e); drop world-22 on `launch-wizard-1`; **terminate** the stopped `seni_sk_2026` / `seni_ror_2026` (or re-secure `edgar-2026-05-10`).
- [ ] **Phase 7 — Re-scan** (Cypher-Defense dashboard) to confirm world-open ports → 0 and the score recovers.

**Per-step verification checklist:** (1) SSH/SSM reachable; (2) service health endpoint responds; (3) dependent services still connect (app→redis/db); (4) no new errors in app/CloudWatch logs.

**Rollback:** every Phase 5/6 step is a single inverse API call — re-attach the SG (`modify-instance-attribute --groups …`) or re-add the rule (`authorize-security-group-ingress …`). Keep them in a runbook as you go.

---

## 6. Notes for whoever executes this

- **Owner:** unclaimed. Needs the write-scoped IAM key (Phase 0) — Gary to provision.
- **IPv6 gap:** this audit only enumerated IPv4 `0.0.0.0/0`. Re-check `::/0` ingress during Phase 2.
- **`default` SG caveat:** you cannot delete the Amazon `default` SG, but you can (a) move every instance off it and (b) strip its rules. Both are covered above.
- Raw audit data + the generator live alongside the scanners; re-run the read-only describe calls anytime to refresh this snapshot.
