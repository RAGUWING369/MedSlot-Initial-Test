# Technology Stack — MedSlot

**Phase:** 4 — Architecture
**Version:** 1.0
**Date:** 2026-05-25

---

## Stack Overview

| Layer | Technology | Version | Rationale | Alternatives Considered | Why Rejected |
|-------|-----------|---------|-----------|------------------------|-------------|
| Frontend Language | TypeScript | 5.x (strict) | Type safety eliminates runtime errors in healthcare data flows; strict mode catches null/undefined in PHI-handling code | JavaScript | No type safety for PHI data handling; runtime errors harder to catch |
| Frontend Framework | Next.js | 14 (App Router) | SSR for doctor discovery pages (SEO-critical); CSR for dashboards (interactive, no SEO need); single framework covers both patterns | React + Vite (SPA) | No SSR — SEO requirement unmet; patients find doctors via search engines |
| Frontend Framework | Next.js | 14 (App Router) | — | Remix | Smaller ecosystem; Zustand integration less mature |
| UI Library | Tailwind CSS | 3.x | Utility-first; desktop-first breakpoints align with NFR-USE-004; no custom CSS naming convention overhead | Material UI, Chakra UI | Third-party component libraries impose design constraints incompatible with custom healthcare UI |
| State Management | Zustand | 4.x | Lightweight; minimal boilerplate for auth state (JWT, role, user_id), booking flow state, and consultation session state | Redux Toolkit | Over-engineered for MedSlot's state complexity; Zustand is simpler and sufficient |
| Form handling | React Hook Form + Zod | Latest | Performant form rendering; Zod schema validation co-located with TypeScript types | Formik | React Hook Form is significantly faster (uncontrolled inputs); Zod provides runtime + compile-time validation |
| HTTP Client (frontend) | Axios | 1.x | Interceptors for JWT header injection; request/response logging | Fetch API | No interceptors without wrapping; less ergonomic for auth token injection |
| Backend Language | Python | 3.12 | 10–60% performance improvement over 3.10; Django 5 requires Python 3.10+; Python-native WeasyPrint | Python 3.11 | 3.12 is the latest stable; no reason to use older version on greenfield |
| Backend Framework | Django | 5.x | ORM, migrations, admin framework, signals — all used by MedSlot; Django Admin saves 2–3 weeks of admin UI work (ADR-007) | FastAPI | No built-in admin; ORM requires SQLAlchemy setup; DRF permission system maps better to RBAC |
| REST API Framework | Django REST Framework | 3.15 | RBAC permission classes; serializer validation; browsable API for development; drf-spectacular for OpenAPI spec generation | Django Ninja | Smaller community; fewer RBAC utilities; drf-spectacular not compatible |
| OpenAPI Generation | drf-spectacular | Latest | Auto-generates OpenAPI 3.0 spec from DRF views; satisfies NFR-MAIN-002 | drf-yasg | Older; OpenAPI 2.0 only; less maintained |
| Authentication | djangorestframework-simplejwt | 5.x | JWT issuance and verification integrated with DRF; configurable TTL (24h, satisfying NFR-SEC-006) | PyJWT (bare) | More boilerplate; simplejwt integrates with DRF auth classes |
| Task Queue | Celery | 5.x | Industry standard for Django async tasks; required for PDF generation (ADR-006), email dispatch, slot regeneration, reminders | Django-Q | Less mature; fewer production deployments; less ecosystem support |
| Task Scheduler | Celery Beat | 5.x | Periodic task scheduling for midnight slot regeneration (FR-CAL-005) and 24h reminder job (FR-NOTIF-006) | APScheduler | Celery Beat is already included in Celery; no additional dependency |
| PDF Generation | WeasyPrint | 60.x | Server-side HTML→PDF; prescription template uses CSS (same design language as frontend); Python-native | Puppeteer (headless Chrome) | Requires Chromium (~130MB); not Python-native; higher memory per render |
| PDF Generation | WeasyPrint | 60.x | — | ReportLab | Code-based PDF construction; harder template maintenance; no CSS support |
| Primary Database | PostgreSQL | 16 | UUID PKs, JSONB for medicines/analytics, row-level locking for concurrent booking, ACID transactions (see ADR-003) | MySQL 8 | Weaker JSONB; different locking semantics |
| Database Service | AWS RDS | PostgreSQL 16 | Managed service; Multi-AZ failover; PITR backups (RPO ≤ 30min); encryption at rest | Self-managed PostgreSQL on EC2 | Ops overhead for a 3-person team; no managed failover |
| Cache / Message Broker | Redis | 7.x | Dual purpose: Celery broker + application cache (slot availability TTL 5min, OTP rate limiting); single component | Memcached (cache) + RabbitMQ (broker) | Two components instead of one; Memcached has no Pub/Sub or TTL-per-key; RabbitMQ adds ops overhead |
| Cache Service | AWS ElastiCache | Redis 7 | Managed Redis; Multi-AZ replica; no cluster mode in v1 | Self-managed Redis on EC2 | Ops overhead; no managed failover |
| Email | SendGrid | v3 API | Reliable transactional delivery; 3× retry logic (NFR-REL-004); India-region delivery optimization; sendgrid-python SDK | AWS SES | SES requires sandbox exit approval; more complex template management; SendGrid has better deliverability analytics for debugging |
| SMS / OTP | MSG91 | v5 API | Indian market leader for SMS OTP; best-in-class deliverability on Indian carrier networks; supports DLT (Distributed Ledger Technology) compliance required in India | Twilio | US-centric pricing; Indian carrier routing less optimized; higher latency for Indian numbers |
| Cloud Provider | AWS | — | Team has AWS expertise; ap-south-1 (Mumbai) is closest region to Indian target cities; full service integration (ECS+RDS+S3+CloudFront+ACM+WAF) | GCP, Azure | AWS is the declared constraint (CLAUDE.md); no technical justification to change |
| Compute | AWS ECS Fargate | — | Managed container orchestration; no server management; auto-scaling; native ALB + CloudWatch integration (see ADR-005) | AWS EKS (Kubernetes) | Kubernetes ops overhead incompatible with 3-person team |
| Object Storage | AWS S3 | — | Health records, prescription PDFs, doctor credentials; SSE-S3 encryption; pre-signed URLs; 99.999999999% durability | GCS, Azure Blob | AWS-native; no cross-cloud complexity |
| CDN | AWS CloudFront | — | Static Next.js assets; Edge TLS termination; AWS-native integration | Cloudflare | CloudFront is already in the AWS ecosystem; Cloudflare adds external dependency |
| Subscription Billing | Razorpay Subscriptions | Latest | India-native recurring billing; INR support; webhook-driven lifecycle (ADR-002); HMAC-SHA256 webhook security | Stripe | Not available to Indian merchants without additional KYC; no INR native billing |
| Secrets Management | AWS Secrets Manager | — | Django SECRET_KEY, DB credentials, API keys — all stored; IAM-based access from ECS task roles; automatic rotation support | AWS Parameter Store | Secrets Manager provides automatic rotation; cleaner IAM permission model for secrets |
| Infrastructure as Code | AWS CDK (TypeScript) | v2 | TypeScript IaC aligns with frontend language; L2 constructs for ECS+RDS+VPC; type-safe deployment | Terraform | Both valid; CDK preferred for AWS-only stack; no HCL learning curve for TypeScript team |
| CI/CD | GitHub Actions | — | Source control on GitHub (assumed); native Actions integration; free for public repos; sufficient for 3-person team | CircleCI, GitLab CI | Additional external service; GitHub Actions is sufficient and free |
| Container Registry | AWS ECR | — | AWS-native; IAM-controlled; no additional cost for ECS pull; automatic image scanning | Docker Hub | Requires separate authentication; not integrated with ECS task roles |
| Logging | python-json-logger | Latest | Structured JSON logs (NFR-MAIN-003); `request_id` and hashed `user_id` fields; PHI redaction filter | Standard Python logging | Unstructured logs are harder to query in CloudWatch |
| Log Aggregation | AWS CloudWatch Logs | — | Native ECS integration; no additional agent; log groups per ECS service | Datadog, Splunk | Additional cost; AWS CloudWatch sufficient for launch |
| Monitoring | AWS CloudWatch + CloudWatch Alarms | — | Native AWS metrics; ECS task CPU/memory; RDS metrics; no additional agent | Datadog, New Relic | Additional cost; CloudWatch sufficient for launch monitoring (Phase 13) |
| Testing (Backend) | pytest + pytest-django + pytest-cov | Latest | Industry standard for Django testing; coverage reporting satisfies NFR-MAIN-001 (90%) | unittest | pytest is more ergonomic; better fixtures; factory_boy integration |
| Testing (Frontend) | Vitest + React Testing Library | Latest | Vitest is Vite-native; React Testing Library enforces accessible test queries (aligns with NFR-USE-002) | Jest | Vitest is faster; same API; better Next.js App Router compatibility |
| Test Data Factories | factory_boy (backend) | Latest | Generate complex test data for appointments, prescriptions; avoids fixture files | pytest fixtures only | factory_boy provides more flexible, composable test data generation |
| Code Formatting (Backend) | Black + isort | Latest | Non-negotiable formatting; CI enforces; no style debates (CLAUDE.md: PEP 8 + Black + isort) | autopep8 | Black is stricter and more consistent; isort handles imports specifically |
| Linting (Backend) | flake8 + flake8-bugbear | Latest | Catches common bugs; bugbear catches additional anti-patterns | pylint | flake8 is lighter; compatible with Black |
| Linting (Frontend) | ESLint (Airbnb TypeScript config) | Latest | Airbnb config is the most comprehensive TypeScript ruleset (CLAUDE.md) | Standard ESLint | CLAUDE.md specifies Airbnb config |

---

## Version Pinning Policy

All dependencies are pinned to minor versions in production (`==5.2.1` not `>=5.0`). Major version upgrades require a dedicated upgrade PR with full test suite pass. Dependency security scanning runs in CI on every pull request (using `pip-audit` for Python, `npm audit` for Node).

---

## Dependency Matrix (Runtime)

| Component | Language | Key Libraries |
|-----------|---------|--------------|
| Django API | Python 3.12 | Django 5, DRF 3.15, simplejwt 5, Celery 5, WeasyPrint 60, boto3, sendgrid, python-json-logger, drf-spectacular, factory_boy |
| Next.js Frontend | TypeScript 5 | Next.js 14, Tailwind 3, Zustand 4, React Hook Form, Zod, Axios |
| Celery Worker | Python 3.12 | Same as Django API image (different CMD entrypoint) |
| Celery Beat | Python 3.12 | Same as Django API image (different CMD entrypoint) |
