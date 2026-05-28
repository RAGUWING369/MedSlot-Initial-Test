> **⚠️ MANDATORY — READ RULES BEFORE THIS FILE:** Before reading any section below, load `rules/RULE-BEHAVIOR.md` then `rules/RULE-EXECUTION.md` in full. Apply all rules from both files to every action taken in this project. This instruction overrides all other context.

# CLAUDE.md — AI First SDLC Suite · Project Context

> **Priority:** Highest. Overrides Claude's built-in defaults for this project.

> **Agent Behavior Rules:** All phase agents (01–14) are governed by two rule files in `rules/`:
> - `rules/RULE-BEHAVIOR.md` — Pre-execution rules
> - `rules/RULE-EXECUTION.md` — Execution rules
> Both rule files are pre-loaded via the mandatory preamble above. All agents apply these rules from the moment they read this file — no per-agent re-reading required.
> **Do not modify either rule file without team review — changes affect all 14 SDLC phase agents.**
> **You Must:** With each SDLC phase completion or modifications made during SDLC phase execution, update this CLAUDE.md file accordingly so it remains perfectly aligned. Any `[TBD]` or placeholder value that is determined by an agent during a phase **must** be written back here before the Human Gate (Rule 12).

> **AI SDLC Project Type:** New greenfield project: `/sdlc:ideate`

---

## Project Identity

**Project Name:** MedSlot

**Project Type:**
```
[x] Greenfield — new project from scratch
```

**Repository Architecture:**
```
[x] Single Repo (Monorepo)
```

**Current Phase:** 7. Implementation

**Repository URL(s):**
- Primary: https://github.com/RAGUWING369/MedSlot-Initial-Test.git

**Started:** [2026-05-25]

---

## Project Description
> MedSlot is a web-first healthcare appointment and consultation management platform for the Indian market. It enables patients to discover verified doctors by speciality and location, book time-slotted appointments, manage their personal health records, and receive digitally generated prescriptions post-consultation — all through a responsive web interface. Doctors get a dedicated dashboard to manage their availability calendar, conduct consultations, write structured notes, and issue prescriptions that are automatically formatted as PDFs and delivered to the patient by email.

---

## Target Users

**Patients:** Urban Indian adults aged 22–55 who are comfortable using web applications on both desktop and mobile browsers. They want to avoid calling clinics, reduce waiting room time, and have a single place to store their health history. They expect a clear, trustworthy interface — health is a high-stakes domain; confusion or ambiguity erodes confidence immediately.

**Doctors:** Registered medical practitioners (MBBS and above) running independent clinics or working within small multi-doctor practices. Moderate-to-high technical proficiency. They need a fast, low-friction workflow: see today's appointments, start a consultation, write notes, issue a prescription, and move to the next patient — with minimal clicks. They should never feel like the software slows them down.

**User Scale:** 200–800 active users at launch (mid-market clinic scale)

---

## Technology Stack (if user provides use it or you should figure it out)

### Target Stack (greenfield)

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Frontend Language | TypeScript | 5.x | Strict mode enabled |
| Frontend Framework | Next.js | 14 (App Router) | SSR for doctor discovery + SEO; CSR for appointment flow and dashboards |
| Backend Language | Python | 3.12 | All business logic lives in Django |
| Backend Framework | Django + DRF | 5.x + 3.15 | REST API; Django ORM for all DB access |
| UI Library | Tailwind CSS | 3.x | Utility-first; desktop-first breakpoints (see Important Context) |
| Database | PostgreSQL | 16 | Primary data store; UUID PKs throughout |
| State Management | Zustand | 4.x | Auth state, booking flow, appointment session state |
| Cache | Redis | 7.x | Sessions, slot availability cache (TTL 5 min), rate limiting |
| PDF Generation | WeasyPrint | 60.x | Server-side prescription PDF rendering from HTML templates |
| Email | SendGrid | Latest | Appointment confirmations, prescription delivery, reminders |
| SMS / OTP | MSG91 | Latest | Mobile OTP for patient and doctor authentication (India) |
| Cloud | AWS | — | Primary cloud provider |
| Object Storage | AWS S3 | — | Health record uploads, generated prescription PDFs |
| CDN | AWS CloudFront | — | Static assets and S3-served documents |
| Compute | AWS ECS (Fargate) | — | Containerised deployment — backend and frontend as separate services |
| Subscription Billing | Razorpay Subscriptions | Latest | MedSlot doctor subscription billing only — NOT consultation fee processing; webhook-based lifecycle management (confirmed Phase 2 — 2026-05-25) |

---

## Repository Structure (Defined Phase 4 — Architecture)

> **Note (updated Phase 7 — 2026-05-27):** All project source code lives under `medslot/` subdirectory. SDLC planning artifacts (docs/, .claude/, CLAUDE.md, memory/) remain at the repo root. `.github/` stays at the repo root (GitHub Actions requirement).

```
(repo root)/
├── .claude/                     ← Agent definitions and rule files
├── .github/
│   └── workflows/
│       ├── ci.yml               ← Lint, test, coverage gate
│       └── deploy.yml           ← Build → ECR push → ECS rolling update
├── docs/                        ← All SDLC phase artifacts
├── memory/                      ← AI memory files
├── .gitignore                   ← Root gitignore
├── CLAUDE.md                    ← Project source of truth
└── medslot/                     ← All project source code lives here
    ├── frontend/                    ← Next.js 14 TypeScript app
    │   ├── app/                     ← App Router pages and layouts
    │   │   ├── (public)/            ← Doctor discovery, landing (SSR/SSG)
    │   │   ├── (patient)/           ← Patient-authenticated routes (CSR)
    │   │   └── (doctor)/            ← Doctor-authenticated routes (CSR)
    │   ├── components/
    │   │   ├── ui/                  ← Shared UI primitives (Tailwind-based)
    │   │   ├── patient/             ← Patient-specific components
    │   │   └── doctor/              ← Doctor-specific components
    │   ├── lib/                     ← Axios API client, Zustand stores, hooks, Zod schemas
    │   ├── public/
    │   └── Dockerfile
    ├── backend/                     ← Django 5 REST API + Celery workers
    │   ├── medslot/                 ← Django project config (settings, urls, wsgi)
    │   ├── accounts/                ← CustomUser, PatientProfile, DoctorProfile, OTP auth, JWT, permissions
    │   ├── appointments/            ← AvailabilityCalendar, AppointmentSlot, Appointment, consultation start
    │   ├── prescriptions/           ← ConsultationNote, Prescription, WeasyPrint PDF task, templates/
    │   ├── records/                 ← HealthRecord, S3 presigned upload/download
    │   ├── notifications/           ← SendGrid email, MSG91 SMS, Celery notification tasks
    │   ├── subscriptions/           ← DoctorSubscription, Razorpay webhook handler
    │   ├── analytics/               ← AnalyticsEvent model + write endpoint
    │   ├── audit/                   ← AuditLog model + Django signal receivers
    │   ├── requirements.txt
    │   └── Dockerfile               ← Shared image for API, worker, and beat (different CMD)
    ├── infra/                       ← AWS CDK v2 (TypeScript) infrastructure stack
    │   ├── lib/
    │   │   ├── vpc-stack.ts
    │   │   ├── ecs-stack.ts
    │   │   ├── rds-stack.ts
    │   │   └── s3-stack.ts
    │   └── package.json
    ├── docker-compose.yml           ← Local development (API + frontend + Redis + PostgreSQL)
    └── .env.example                 ← Environment variable template
```

---

## Key Commands
```
# ── Frontend (cd medslot/frontend/) ─────────────────────────
# Install dependencies
npm install

# Start dev server
npm run dev

# Run unit tests
npm run test

# Run linter
npm run lint

# Type check
npm run type-check

# Build for production
npm run build

# ── Backend (cd medslot/backend/) ───────────────────────────
# Install dependencies
pip install -r requirements.txt

# Run dev server (Gunicorn equivalent for dev)
python manage.py runserver

# Run migrations
python manage.py migrate

# Create new migration
python manage.py makemigrations <app_name>

# Create superuser (admin panel access)
python manage.py createsuperuser

# Run tests
pytest

# Run tests with coverage
pytest --cov=. --cov-report=term-missing --cov-fail-under=90

# Run Celery worker (local dev)
celery -A medslot worker --loglevel=info --concurrency=2

# Run Celery Beat scheduler (local dev)
celery -A medslot beat --loglevel=info

# ── Docker (full stack local — cd medslot/) ─────────
docker-compose up --build

# ── Infra (cd medslot/infra/) ───────────────────────
# Deploy AWS CDK stack to staging
npx cdk deploy MedSlotStack --profile medslot-staging

# ── Deploy to production (via GitHub Actions) ────────
# Triggered automatically on merge to main branch
# Manual: gh workflow run deploy.yml
```

---

## Coding Standards

- **Style Guide (Frontend):** Airbnb TypeScript ESLint config
- **Style Guide (Backend):** PEP 8 + Black formatter + isort
- **Commit Convention:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`)
- **Branch Strategy:** `feature/xxx` → `develop` → `main`
- **PR Requirements:** 1 peer approval + CI pipeline green + no open review comments
- **Test Coverage Minimum:** 90% for all new code (both frontend and backend)
- **Code Review:** Mandatory before any merge to `develop` or `main`
- **API Style:** RESTful, versioned (`/api/v1/`), `snake_case` JSON fields
- **Role Separation:** Patient-facing and Doctor-facing API endpoints must be protected by distinct permission classes — never use a single generic `IsAuthenticated` check where a role-specific check is required
- **Data Privacy:** Any model or serializer field containing personally identifiable health information (diagnosis, prescription content, health record metadata) must be explicitly marked in code comments. No health data is ever logged to application logs in plaintext.

---

## Architecture Decisions

[docs/design/ARCHITECTURE.md](docs/design/ARCHITECTURE.md)
[docs/design/adrs/](docs/design/adrs/) — ADR-001 through ADR-008

Key decisions (Phase 1–3, carried forward):
- Two distinct user roles (Patient, Doctor) managed under a single `CustomUser` model with a `role` field — not separate Django auth models
- Prescription PDFs are generated server-side on demand using WeasyPrint from an HTML template; they are stored in S3 and a pre-signed URL is emailed to the patient — PDFs are never streamed directly from the application server
- MedSlot does NOT process consultation fees or any financial transactions — no payment gateway integration for patient-doctor fees; fee arrangements are entirely between doctor and patient outside the platform (confirmed Phase 1 — 2026-05-25)
- Doctor subscription is the sole revenue model — monthly/annual per-seat fee; no per-booking transaction fee (confirmed Phase 1 — 2026-05-25)
- Doctor accounts require self-registration + manual admin approval before going live — credentials verified against MCI/state council registration (confirmed Phase 1 — 2026-05-25)
- Razorpay Subscriptions API is used exclusively for MedSlot's own doctor subscription billing (MedSlot ← doctor payment); this is distinct from consultation fee processing which remains entirely out of scope (confirmed Phase 2 — 2026-05-25)
- Appointment outcome states: Completed (via prescription issuance), No-Show (doctor marks), Cancelled (patient ≥2h before OR doctor at any time before start) — three terminal states, all immutable (confirmed Phase 2 — 2026-05-25)
- Doctor specialty taxonomy is a fixed list of 13 specialties managed as a database seed — no free-text specialty entry permitted (confirmed Phase 2 — 2026-05-25)
- Patient appointment cancellation window: > 2 hours before appointment start time (confirmed Phase 2 — 2026-05-25)
- Prescription PDF download links (S3 pre-signed URLs) expire after 7 days; on-demand regeneration available via patient My Appointments view (confirmed Phase 2 — 2026-05-25)

Key decisions (Phase 4 — Architecture):
- **Modular Monolith** pattern adopted — single Django 5 backend with 8 internal apps; single Next.js 14 frontend; 4 ECS Fargate task definitions (API, frontend, Celery worker, Celery Beat) — ADR-001
- **AWS ECS Fargate** (ap-south-1, 2-AZ) — 2 min / 8 max API tasks; auto-scale at 60% CPU; db.t3.medium RDS Multi-AZ; cache.t3.micro ElastiCache Multi-AZ — ADR-005
- **Celery async PDF generation** — prescription PDFs queued to medslot-worker; 202 Accepted returned immediately; appointment marked Completed after S3 confirmation — ADR-006
- **Django Admin** as admin panel — not a custom React frontend; saves 2–3 weeks of frontend time — ADR-007
- **PostgreSQL analytics_events table** (analytics schema) — no third-party analytics SDK; PHI never leaves MedSlot infrastructure — ADR-008
- **OTP hashed with SHA-256 + PEPPER** in Redis; JWT HS256 24h; DRF permission classes (IsPatient, IsApprovedDoctor, IsAdmin) enforced at view layer — ADR-004
- **Client-direct S3 presigned PUT** for health record uploads — file bytes never routed through Django API; meets NFR-PE-005 (≤5s P95)
- **VPC isolation**: ALB in public subnet; ECS tasks + Redis in private subnet; RDS in isolated subnet (no inbound from internet)

---

## Non-Functional Requirements

| Requirement | Target | Current |
|-------------|--------|---------|
| API Response Time (P95) | < 200ms at 500 concurrent users | Defined — NFR-PE-001 |
| Page Load — LCP (doctor discovery) | < 2.5s | Defined — NFR-PE-002 |
| Page Load — LCP (dashboard views) | < 3.0s | Defined — NFR-PE-003 |
| Uptime SLA | ≥ 99.9% monthly (≤ 43.8 min downtime) | Defined — NFR-REL-001 |
| Prescription PDF Generation | < 4s end-to-end (P95) | Defined — NFR-PE-004 |
| Concurrent Users | 500 without degradation | Defined — NFR-PE-006 |
| Appointment Booking Flow Completion | ≤ 2 minutes end-to-end (P50, new patient) | Defined — NFR-USE-001 |
| Health Record Upload (per file, ≤ 10MB) | < 5s (P95) | Defined — NFR-PE-005 |
| Data Retention | ≥ 10 years (medical records — BR-022) | Defined — BR-022 |
| OTP Delivery (SMS) | < 10s under normal network conditions | Defined — NFR-REL via FR-NOTIF-001 |
| RTO (Recovery Time Objective) | ≤ 1 hour | Defined — NFR-REL-002 |
| RPO (Recovery Point Objective) | ≤ 30 minutes | Defined — NFR-REL-003 |
| OTP delivery success rate | ≥ 98% | Defined — SUCCESS-METRICS |
| Patient cancellation window | > 2 hours before appointment start | Defined — BR-010 |
| Prescription PDF URL validity | 7-day pre-signed URL (on-demand regeneration) | Defined — FR-RX-005, FR-RX-007 |

---

## Constraints
- Budget: $2,000/month AWS cloud budget
- Timeline: by 2026-10-31 — core patient booking flow + doctor consultation + prescription generation only
- Compliance: Patient data must be encrypted at rest (AWS RDS encryption, S3 SSE) and in transit (TLS 1.2+). No full HIPAA or DISHA compliance required, but foundational data protection practices are mandatory from day one — these cannot be retrofitted. PCI-DSS is not applicable; MedSlot does not process any payments.
- Team Size: 3 developers (1 full-stack lead, 1 frontend, 1 backend)
- Payment: NOT applicable — MedSlot does not process consultation fees. Fee arrangements between doctor and patient are handled entirely outside the platform. Razorpay is NOT part of the v1 stack. (Clarified Phase 1 — 2026-05-25)
- Authentication: SMS OTP via MSG91 for both patients and doctors — no social login (Google/Facebook)
- Parallel operation required: No — greenfield, no existing system
- Rollback window: Not applicable — no legacy system

---

## Phase Artifacts Index

| Phase | Status | Primary Artifact | Last Updated |
|-------|--------|-----------------|--------------|
| 1. Ideation | ✅ Complete | `docs/ideation/PROJECT-CONCEPT.md` | 2026-05-25 |
| 2. Requirements | ✅ Complete | `docs/requirements/REQUIREMENTS.md` | 2026-05-25 |
| 3. PRD | ✅ Complete | `docs/prd/PRD.md` | 2026-05-25 |
| 4. Architecture | ✅ Complete | `docs/design/ARCHITECTURE.md` | 2026-05-25 |
| 5. UX Design | ✅ Complete | `docs/ux/USER-JOURNEYS.md` | 2026-05-27 |
| 6. Task Breakdown | ✅ Complete | `docs/planning/TASKS.md` | 2026-05-27 |
| 7. Implementation | 🟡 In Progress — Sprint 2 in progress (13/113 tasks done, 35 SP) | `medslot/` | 2026-05-28 |
| 8. Code Review | [TO BE UPDATED] | PRs in GitHub/GitLab | TO BE UPDATED |
| 9. Testing | [TO BE UPDATED] | `docs/qa/TEST-RESULTS.md` | TO BE UPDATED |
| 10. Security | [TO BE UPDATED] | `docs/security/SECURITY-REVIEW.md` | TO BE UPDATED |
| 11. CI/CD | [TO BE UPDATED] | `.github/workflows/` | TO BE UPDATED |
| 12. Deployment | [TO BE UPDATED] | `docs/releases/` | TO BE UPDATED |
| 13. Monitoring | [TO BE UPDATED] | `docs/ops/MONITORING-SETUP.md` | TO BE UPDATED |
| 14. Retrospective | [TO BE UPDATED] | `docs/retros/` | TO BE UPDATED |

---

## Open Questions

| Question | Owner | Status |
|----------|-------|--------|
| Doctor onboarding — self-registration with manual admin approval, or invite-only? | Product Owner | ✅ Closed — Self-registration + manual admin approval confirmed (Phase 1) |
| Video consultation in scope or post-launch only? | Product Owner | ✅ Closed — Explicitly out of scope for v1 (Phase 1) |
| Should patients be able to book without registration (guest flow) or is mandatory sign-up acceptable? | Product Owner | ✅ Closed — Mandatory OTP registration required for all patients (Phase 1) |
| Consultation fee collection — mandatory per booking or optional (some doctors consult free)? | Team Lead | ✅ Closed — MedSlot does NOT process fees; doctor manages consultation fees directly with patient outside the platform (Phase 1) |
| Multi-doctor practice support (one clinic, many doctors) or single-doctor only? | Product Owner | ✅ Closed — Single-doctor accounts only; multi-doctor clinic is out of scope for v1 (Phase 1) |
| OQ-001: GTM launch cities — Bengaluru, Hyderabad, Pune, or different selection? | Product Owner | Open — Confirm before soft launch planning (pre-Phase 7 marketing content) |
| OQ-002: Razorpay Subscriptions plan configuration — monthly-only, annual option, or both? | Tech Lead | Open — Must be decided before Phase 7 Razorpay integration (impacts FR-SUB-002) |
| OQ-003: Doctor subscription pricing — validated willingness-to-pay at ₹1,000/month? | Product Owner | Open — Pricing interview with ≥5 target doctors required before Phase 7 |
| OQ-004: Soft launch city count — 1 city or 2–3 simultaneously? | Product Owner | Open — Informs Phase 5 UX localisation requirements |
| OQ-005: WeasyPrint performance — POC required to validate ≤4s P95 under 50 concurrent requests? | Tech Lead | ✅ Closed — Spike PASSED: P95 ~680ms << 4000ms. WeasyPrint 60.2 confirmed viable. See docs/assumptions/06-task-breakdown-assumptions.md (2026-05-28) |

---

## Human Gates Log

- The human is monitoring you in an IDE. They can see everything. They will catch your mistakes. Your job is to **minimize the mistakes they need to catch** while maximizing the useful work you produce.

- You have unlimited stamina. The human does not. Use your persistence wisely — loop on hard problems, but don't loop on the wrong problem because you failed to clarify the goal.

> Every phase requires explicit human approval (reply: `APPROVED`) before the next phase begins.
> Agents write approval here automatically after receiving APPROVED. Do not edit manually.

| Phase | Status | Approved By | Date | Conditions |
|-------|--------|-------------|------|------------|
| Phase 1 — Ideation | ✅ Approved | Stakeholder | 2026-05-25 | None |
| Phase 2 — Requirements Engineering | ✅ Approved | Stakeholder | 2026-05-25 | None |
| Phase 3 — PRD | ✅ Approved | Stakeholder | 2026-05-25 | None |
| Phase 4 — Architecture & Design | ✅ Approved | Stakeholder | 2026-05-25 | None |
| Phase 5 — UX Design | ✅ Approved | Stakeholder | 2026-05-27 | None |
| Phase 6 — Task Breakdown & Sprint Planning | ✅ Approved | Stakeholder | 2026-05-27 | None |
| Phase 7 — Implementation Sprint 1 | ✅ Approved | Stakeholder | 2026-05-28 | 11 tasks / 24 SP delivered; WeasyPrint spike passed; TASK-113 (Next.js 15) tracked in Sprint 10 |
| Phase 7 — TASK-006 (AWS CDK Infrastructure Stack) | ✅ Approved | Stakeholder | 2026-05-28 | 102/102 CDK tests; cdk synth clean; cross-stack cycle fixed; TASK-005 unblocked |
| Phase 7 — TASK-005 (GitHub Actions CD Pipeline) | ✅ Approved | Stakeholder | 2026-05-28 | SHA-only ECR tagging approved (IMMUTABLE repo constraint); deploy.yml committed |

---

## Important Context for Agents

### Platform & Layout Philosophy
This is a **web-first application**. The primary experience is designed for desktop and laptop browsers at 1280px and above. All screens must also work correctly on mobile browsers (375px minimum) — but this is a responsive adaptation, not a mobile-first design. Agents must not default to mobile-first CSS patterns, bottom navigation bars, hamburger-only menus, or interaction metaphors that assume touch as the primary input. Design and implement for web first; then verify and adapt for mobile. When Tailwind breakpoints are used, the base (unprefixed) styles are desktop styles, with `sm:` and `md:` used to adapt downward — not the reverse.


### Application Scope
Covers exactly these flows and nothing beyond them:
- **Patient flow:** Register/login via OTP → Search and discover doctors by speciality/location → View doctor profile → Book an appointment slot → Receive confirmation → View My Appointments → Upload a health record → View a received prescription
- **Doctor flow:** Register/login via OTP → Set availability calendar (working days, hours, slot duration) → View today's and upcoming appointments → Open a consultation → Write structured notes → Issue a prescription → Mark appointment complete

**Explicitly out of scope:** Video consultation, in-app messaging/chat, pharmacy integration, insurance billing, multi-clinic support, patient-to-patient reviews (ratings only), referral system, lab test ordering, push notifications (email and SMS only), native mobile app.



---

*This file is the source of truth for the project. Update it whenever architectural decisions change, new decisions are made, or phase completions occur.*
*It is a living document — accuracy matters more than completeness.*