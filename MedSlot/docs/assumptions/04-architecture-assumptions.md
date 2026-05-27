# Architecture — Assumption Log

**Phase:** 04 — System Architecture & Design
**Agent:** 04_architecture_agent.md
**Generated:** 2026-05-25
**Session:** MedSlot Phase 4 — full architecture design; all Phase 1–3 artifacts available and approved

---

## Tier 3 Inferences Made This Phase

| ID | Inference | Basis | Confidence | Must Validate Before Phase |
|----|-----------|-------|------------|---------------------------|
| A-04-001 | Gunicorn is used as the Django WSGI server (not uWSGI or Daphne); default worker count formula: (2 × vCPU) + 1 = 2 workers per 0.5 vCPU task | Gunicorn is the de-facto standard Django production WSGI server; drf-spectacular + simplejwt + Django 5 are all Gunicorn-compatible; WSGI (not ASGI) is appropriate because MedSlot has no WebSocket or async Django views | High | Phase 7 — Dockerfile CMD configuration |
| A-04-002 | AWS CDK v2 (TypeScript) is used as the Infrastructure as Code tool for all AWS resources (VPC, ECS, RDS, ElastiCache, ALB, S3, Secrets Manager, CloudFront, WAF) | CLAUDE.md: frontend language is TypeScript 5; CDK v2 TypeScript is the natural IaC choice for a TypeScript team deploying to AWS-only infrastructure; no IaC tool was specified in CLAUDE.md | Medium | Phase 6 (task breakdown) — confirm IaC tool before Sprint 1 infra tasks |
| A-04-003 | OTP pepper is a fixed 256-bit secret stored in AWS Secrets Manager; used as HMAC key in OTP hash: HMAC-SHA256(otp_plaintext, pepper) | Salting/peppering is industry standard for stored token hashes; prevents rainbow table attacks on leaked Redis data; the pepper as a separate secret from the Django SECRET_KEY provides defense-in-depth | High | Phase 7 — OTP service implementation |
| A-04-004 | Django CONN_MAX_AGE=60 (persistent database connections, 60-second lifetime) is used to reduce connection overhead under load | Django's persistent connections documentation; 60s is the standard recommendation for ECS deployments where tasks may be recycled frequently; avoids a new TCP+TLS connection to RDS on every request | High | Phase 7 — Django settings.py |
| A-04-005 | Celery result backend is NOT configured (results are not stored in Redis); tasks communicate outcomes by writing directly to the Django ORM (Prescription.pdf_status, Notification.status) | Celery result backend adds Redis storage overhead and TTL management complexity; MedSlot tasks write their results to the database directly — the database is the authoritative source of task state | High | Phase 7 — Celery configuration |
| A-04-006 | medslot-beat (Celery Beat) runs as a singleton ECS task (exactly 1 task, no auto-scaling); a Redis-based distributed lock prevents duplicate task scheduling if the singleton is briefly duplicated during ECS rolling update | Celery Beat as a singleton is required to prevent duplicate scheduled job executions; the distributed lock pattern using Redis SET NX with TTL is the standard mitigation for ECS rolling update overlap | High | Phase 7 — Celery Beat configuration + Redis lock implementation |
| A-04-007 | The S3 health record upload flow uses presigned PUT URLs (client-direct upload, bypassing the API for file bytes), not server-side streaming upload; after upload, the client calls a confirm endpoint to activate the record | Direct S3 upload is the standard pattern for meeting NFR-PE-005 (≤ 5s for 10MB) without routing file bytes through the Django API; the confirm endpoint allows the API to validate that the S3 object actually exists before marking the record active | High | Phase 7 — HealthRecordService + S3Adapter implementation |
| A-04-008 | AWS CloudFront is used only for static frontend assets (Next.js build output); S3-served prescription and health record files use direct S3 presigned URLs, not CloudFront signed URLs | Direct S3 presigned URLs provide per-file, per-user expiry control (7 days) that would require CloudFront signed cookies and edge function configuration to replicate; for a 3-person team, direct presigned URLs are simpler and equally secure | High | Phase 7 — S3Adapter presigned URL generation |
| A-04-009 | GitHub is the source control provider; GitHub Actions is the CI/CD pipeline; ECR is the container registry; ECS rolling update strategy with minimum 50% healthy tasks is used for zero-downtime deployments | CLAUDE.md: Conventional Commits + GitHub branch strategy implies GitHub as SCM; GitHub Actions is the natural CI/CD choice for a GitHub-hosted repo; ECR is AWS-native; rolling update with 50% minimum avoids downtime while staying within 2-task minimum | Medium | Phase 6 (CI/CD task setup) — confirm GitHub as SCM |
| A-04-010 | The Django Admin is served at `/admin/` via the same medslot-api ECS service on port 8000; ALB path-based routing forwards `/admin/*` to the API target group; admin access is restricted by Django's `is_staff=True` flag (not by a separate security group) | Django Admin runs in the same Django process; separate service would require code duplication; the simplest and most secure approach is path-based routing with Django's built-in access control | High | Phase 7 — Django Admin configuration |
| A-04-011 | All IST-aware scheduled tasks (midnight slot regeneration, 24h reminder scan) specify timezone using Python's `zoneinfo.ZoneInfo('Asia/Kolkata')` (not a hardcoded UTC offset) — avoiding DST issues (India has no DST but the practice is correct for production code) | Python 3.9+ standard library `zoneinfo` is available in Python 3.12; Celery Beat supports timezone-aware crontab schedules; IST = UTC+5:30, no DST | High | Phase 7 — Celery Beat schedule definitions |
| A-04-012 | The `medslot-worker` Celery worker uses the `prefork` concurrency model (default) with `CELERYD_CONCURRENCY=2`; each WeasyPrint render spawns in a worker subprocess, limiting memory usage to 2 × ~500MB = ~1GB, within the 2GB task RAM | prefork is Celery's default; WeasyPrint is CPU-bound (not I/O-bound) so thread-based concurrency doesn't help; 2 concurrent renders balances throughput with memory constraint | High | Phase 7 — Celery worker startup command; validate WeasyPrint memory usage in POC (OQ-005) |
| A-04-013 | VPC has 2 AZs (ap-south-1a, ap-south-1b); a third AZ is not provisioned in v1 to stay within cost budget (3-AZ NAT Gateway triples NAT cost); 2-AZ provides the NFR-REL-001 (99.9%) availability target | AWS ap-south-1 has 3 AZs; 2-AZ is sufficient for 99.9% target; NAT Gateway costs ~$35/AZ/month; 2 AZs saves ~$35/month vs. 3 AZs | Medium | Phase 6 — confirm 2-AZ is acceptable for availability; upgrade to 3-AZ if SLA increases |
| A-04-014 | Razorpay webhook source IP allowlist is implemented as a WAF custom rule restricting `/api/v1/webhooks/razorpay/` to Razorpay's published IP ranges; the HMAC-SHA256 validation is a secondary defense-in-depth control | Razorpay publishes their webhook IP ranges; IP allowlisting is the first layer; HMAC signature validation is the second; double defense for an endpoint that modifies subscription state | Medium-High | Phase 7 — verify Razorpay's current published IP ranges before WAF rule implementation |

---

## Open Flags (Tier 2 — Confirmed in Phase 4 Pre-Design)

| Flag ID | Suggestion Made | Response | Status |
|---------|----------------|----------|--------|
| F-04-001 | Modular Monolith as architectural pattern (vs. microservices) | Confirmed: YES | ✅ Resolved |
| F-04-002 | All technology stack choices from CLAUDE.md accepted as-is | Confirmed: YES | ✅ Resolved |
| F-04-003 | All prior architectural decisions from CLAUDE.md Architecture Decisions section carried forward | Confirmed: YES | ✅ Resolved |

---

## Resolution Log

| ID | Original Question | Resolution | Resolved By | Date |
|----|------------------|------------|-------------|------|
| A-04-002 | IaC tool not specified in CLAUDE.md | AWS CDK v2 (TypeScript) inferred as Medium confidence; must confirm in Phase 6 task breakdown | Phase 4 inference | 2026-05-25 |
| A-04-009 | SCM not explicitly specified | GitHub + GitHub Actions inferred from CLAUDE.md branch strategy format; must confirm in Phase 6 | Phase 4 inference | 2026-05-25 |
