# Task Backlog — MedSlot
**Total Tasks:** 112
**Total Story Points:** 247
**Last Updated:** 2026-05-27

## Status Legend
- 🔴 Blocked
- 🟡 In Progress
- 🟢 Done
- ⬜ Pending

## Sprint Capacity Baseline

### Team Composition
| Role | Count | Daily Capacity (hours) | Sprint Days | Available Hours |
|------|-------|----------------------|-------------|----------------|
| Full-stack Lead | 1 | 6 | 10 | 60 |
| Frontend Dev | 1 | 6 | 10 | 60 |
| Backend Dev | 1 | 6 | 10 | 60 |
| **Total Raw Capacity** | | | | **180** |

### Capacity Adjustments
- Sprint 1 new-project ramp-up discount: −20% = −36h
- Meetings & standups: −10h/sprint (30 min/day × 10 days × 2 relevant devs avg)
- Code review cycles: −15h/sprint (est. 30 min per task reviewed × 30 tasks/sprint ÷ 2)
- **Net Available Capacity (Sprint 1):** ~119h
- **Net Available Capacity (Sprint 2+):** ~155h

### Story Point Calibration
1 story point = 4 developer-hours
- 1 SP = ~4h (S task, ~1 day)
- 2 SP = ~8h (M task, ~1 day full + overlap)
- 3 SP = ~12h (L task, ~1.5 days)
- 5 SP = ~20h (XL task, ~2.5 days)
- 8 SP = ~32h (cap — split if larger)

### Sprint Velocity
- Sprint 1 (conservative, ramp-up): ~24 SP committable (80% of ~30 SP gross)
- Sprint 2+ (steady-state): ~30 SP committable per sprint
- Total project SP: 247 SP across ~11 sprints (sprints 1–10 delivery, sprint 11 buffer/hardening)

---

## Critical Path Tasks (flagged with *)

The minimum sequential chain from project start to MVP:
TASK-001 → TASK-002 → TASK-003 → TASK-004 → TASK-010 → TASK-011 → TASK-012 → TASK-013 → TASK-020 → TASK-021 → TASK-030 → TASK-031 → TASK-040 → TASK-050 → TASK-060 → TASK-070 → TASK-080

---

## Epics

### EPIC-001: Project Foundation & Infrastructure
**Description:** Monorepo scaffold, Docker local dev environment, CI/CD pipelines, and AWS CDK infrastructure stacks. Enables all subsequent development work.
**User Stories:** (foundational — no direct user story mapping)
**Estimated Size:** XL
**Business Value:** Zero development can proceed without a working local environment and CI pipeline. This epic is the prerequisite for every other epic.

### EPIC-002: Authentication & User Identity
**Description:** OTP-based login and registration for patients and doctors; JWT issuance; RBAC permission classes. Patients and doctors can create verified accounts and log in.
**User Stories:** US-001, US-002, US-012, US-013
**Estimated Size:** L
**Business Value:** No user action is possible without authentication. This is the entry gate for the entire platform.

### EPIC-003: Doctor Registration & Admin Verification
**Description:** Doctor self-registration form, credential document upload, admin approval queue in Django admin. Only verified doctors appear on the platform.
**User Stories:** US-012, US-022, US-023, US-024
**Estimated Size:** M
**Business Value:** The platform's trust model depends entirely on verified doctors. Admin approval is the trust gate.

### EPIC-004: Doctor Search & Discovery
**Description:** Public SSR search page (specialty + city filters), search results listing, doctor profile with 7-day slot view. Patients can find the right doctor.
**User Stories:** US-003, US-004, US-005
**Estimated Size:** L
**Business Value:** Doctor discovery is the top-of-funnel patient acquisition mechanism. SSR ensures SEO indexability.

### EPIC-005: Availability Calendar & Slot Generation
**Description:** Doctor configures working days/hours/duration, system generates rolling 30-day slot window via Celery Beat, blocked dates management.
**User Stories:** US-014
**Estimated Size:** M
**Business Value:** No slots = no bookings. Calendar management is the prerequisite for the booking flow.

### EPIC-006: Appointment Booking Flow
**Description:** Patient selects a slot, views booking summary, confirms with row-level lock, receives email confirmation. Race-condition protection.
**User Stories:** US-006
**Estimated Size:** M
**Business Value:** The core patient value proposition — book in under 2 minutes with certainty.

### EPIC-007: Appointment Management
**Description:** Patient views all appointments, cancels within 2h window; doctor views today/upcoming, cancels any time, marks No-Show/Completed.
**User Stories:** US-007, US-008, US-015, US-016, US-020, US-021
**Estimated Size:** M
**Business Value:** Appointment lifecycle management keeps both sides informed and records accurate.

### EPIC-008: Consultation Workflow
**Description:** Doctor opens consultation session, writes structured notes (5 fields), saves drafts, notes locked post-completion.
**User Stories:** US-017, US-018
**Estimated Size:** M
**Business Value:** Structured note-taking is the clinical workflow differentiator vs. paper/WhatsApp.

### EPIC-009: Prescription Generation & Delivery
**Description:** Doctor issues prescription, Celery generates WeasyPrint PDF, stores in S3, emails patient 7-day pre-signed URL. Patient views and downloads.
**User Stories:** US-019, US-010, US-011
**Estimated Size:** L
**Business Value:** PDF prescription delivery is the primary consultation outcome — the feature that differentiates MedSlot from every aggregator.

### EPIC-010: Patient Health Records
**Description:** Patient uploads health documents (PDF/JPEG/PNG ≤10MB) via S3 presigned PUT, views list, downloads, soft-deletes.
**User Stories:** US-009, US-027
**Estimated Size:** M
**Business Value:** Health record continuity is a key patient retention driver.

### EPIC-011: Notifications
**Description:** SendGrid email tasks (booking confirmation, cancellation, prescription, reminder); MSG91 OTP SMS; Celery retry logic; audit Notification records.
**User Stories:** US-026 (reminder)
**Estimated Size:** M
**Business Value:** Notifications keep patients and doctors informed without platform visits. OTP is the authentication mechanism.

### EPIC-012: Subscription Management
**Description:** 30-day trial, Razorpay Subscriptions integration, webhook lifecycle management, payment failure grace period, dashboard access enforcement.
**User Stories:** US-025
**Estimated Size:** M
**Business Value:** Doctor subscription is the sole revenue model. This epic is the business model.

### EPIC-013: Analytics & Audit
**Description:** AnalyticsEvent write endpoint, AuditLog Django signals, structured JSON logging, PHI log filter.
**User Stories:** (cross-cutting — no direct user story)
**Estimated Size:** S
**Business Value:** Analytics drive product decisions; audit logs provide compliance evidence.

### EPIC-014: Testing & Quality Gates
**Description:** Backend pytest suite (90% coverage), frontend Vitest suite (90% coverage), E2E Cypress tests for critical paths.
**User Stories:** (cross-cutting)
**Estimated Size:** L
**Business Value:** 90% coverage is a hard contractual requirement. E2E tests protect the critical booking and prescription flows.

---

## EPIC-001: Project Foundation & Infrastructure

### TASK-001 — Monorepo Directory Scaffold * (Critical Path)
- **Type:** infrastructure
- **Story Points:** 2
- **Parent Story:** (foundational)
- **Sprint:** Sprint 1
- **Status:** 🟡 In Progress
- **Assignee:** Full-stack Lead
- **Blocks:** TASK-002, TASK-003, TASK-004, TASK-005, TASK-006
- **Blocked By:** —
- **Acceptance Criteria:**
  - [ ] `medslot/` root directory created with `frontend/`, `backend/`, `infra/`, `.github/workflows/` directories
  - [ ] `frontend/` initialized as Next.js 14 TypeScript project (`npx create-next-app@latest` with App Router, TypeScript, Tailwind CSS)
  - [ ] `backend/` initialized as Django 5 project (`django-admin startproject medslot .`) with 8 app stubs: accounts, appointments, prescriptions, records, notifications, subscriptions, analytics, audit
  - [ ] `infra/` initialized as AWS CDK TypeScript project
  - [ ] Root `.gitignore` covers Node, Python, CDK, Docker artifacts
  - [ ] `README.md` at root with setup instructions
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-002 — Docker Compose Local Development Environment * (Critical Path)
- **Type:** infrastructure
- **Story Points:** 3
- **Parent Story:** (foundational)
- **Sprint:** Sprint 1
- **Status:** ⬜ Pending
- **Assignee:** Full-stack Lead
- **Blocks:** TASK-007, TASK-008
- **Blocked By:** TASK-001
- **Acceptance Criteria:**
  - [ ] `docker-compose.yml` at root defines services: `api` (Django), `frontend` (Next.js), `redis` (Redis 7), `db` (PostgreSQL 16)
  - [ ] `backend/Dockerfile` builds Django app; runs `gunicorn medslot.wsgi` in prod mode, `python manage.py runserver` in dev override
  - [ ] `frontend/Dockerfile` builds Next.js app; runs `node server.js`
  - [ ] `docker-compose up --build` starts all 4 services with health checks
  - [ ] PostgreSQL data volume persists between restarts
  - [ ] Environment variables loaded from `.env.local` (template `.env.example` committed)
  - [ ] `docker-compose up` runs `python manage.py migrate` on first start via entrypoint
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-003 — Environment Configuration & Secrets Structure * (Critical Path)
- **Type:** infrastructure
- **Story Points:** 1
- **Parent Story:** (foundational)
- **Sprint:** Sprint 1
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-010, TASK-011
- **Blocked By:** TASK-001
- **Acceptance Criteria:**
  - [ ] `.env.example` documents all required env vars: `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, `JWT_SECRET`, `MSG91_API_KEY`, `SENDGRID_API_KEY`, `AWS_REGION`, `S3_RECORDS_BUCKET`, `S3_PRESCRIPTIONS_BUCKET`, `S3_CREDENTIALS_BUCKET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
  - [ ] Django settings module reads all secrets from environment (no hardcoded values)
  - [ ] `settings/base.py`, `settings/local.py`, `settings/production.py` split established
  - [ ] `python-decouple` or `django-environ` used for env var loading
  - [ ] `DJANGO_SETTINGS_MODULE` defaults to `medslot.settings.local` in Docker Compose
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-004 — GitHub Actions CI Pipeline * (Critical Path)
- **Type:** devops
- **Story Points:** 3
- **Parent Story:** (foundational)
- **Sprint:** Sprint 1
- **Status:** ⬜ Pending
- **Assignee:** Full-stack Lead
- **Blocks:** TASK-009
- **Blocked By:** TASK-001
- **Acceptance Criteria:**
  - [ ] `.github/workflows/ci.yml` triggers on push to `feature/*` and `develop` branches
  - [ ] Backend job: `pip install -r requirements.txt` → `black --check` → `isort --check` → `flake8` → `pytest --cov=. --cov-fail-under=90`
  - [ ] Frontend job: `npm ci` → `npm run lint` → `npm run type-check` → `npm run test -- --coverage --coverageThreshold='{"global":{"lines":90}}'`
  - [ ] CI fails if coverage < 90% on either backend or frontend
  - [ ] Jobs run in parallel (backend and frontend are independent)
  - [ ] CI completes in < 10 minutes on a standard GitHub Actions runner
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-005 — GitHub Actions CD Pipeline
- **Type:** devops
- **Story Points:** 3
- **Parent Story:** (foundational)
- **Sprint:** Sprint 2
- **Status:** ⬜ Pending
- **Assignee:** Full-stack Lead
- **Blocks:** —
- **Blocked By:** TASK-004, TASK-006
- **Acceptance Criteria:**
  - [ ] `.github/workflows/deploy.yml` triggers on merge to `main`
  - [ ] Builds Docker images for `backend` and `frontend`
  - [ ] Pushes images to AWS ECR (ap-south-1) with commit SHA tag + `latest` tag
  - [ ] Triggers ECS rolling update for `medslot-api`, `medslot-frontend`, `medslot-worker`, `medslot-beat` services
  - [ ] Deployment waits for ECS service stability before marking success
  - [ ] AWS credentials via GitHub OIDC (no static secrets)
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-006 — AWS CDK Infrastructure Stack (VPC + ECS + RDS + S3 + ElastiCache)
- **Type:** infrastructure
- **Story Points:** 8
- **Parent Story:** (foundational)
- **Sprint:** Sprint 2
- **Status:** ⬜ Pending
- **Assignee:** Full-stack Lead
- **Blocks:** TASK-005
- **Blocked By:** TASK-001
- **Acceptance Criteria:**
  - [ ] `infra/lib/vpc-stack.ts`: VPC 10.0.0.0/16; public subnets (1a/1b), private subnets (1a/1b), isolated subnets (1a/1b); NAT Gateway in each AZ; all security groups as per ARCHITECTURE.md spec
  - [ ] `infra/lib/rds-stack.ts`: PostgreSQL 16 db.t3.medium, Multi-AZ, 50GB gp3, AES-256 KMS encryption, automated PITR, in isolated subnet
  - [ ] `infra/lib/ecs-stack.ts`: ECS cluster; 4 Fargate services (api, frontend, worker, beat) with task definitions matching ARCHITECTURE.md spec; ALB with path routing; ACM certificate placeholder; auto-scaling policies
  - [ ] `infra/lib/s3-stack.ts`: 3 S3 buckets (records, prescriptions, credentials); SSE-S3 default encryption; Block Public Access enabled on all; CORS policy for presigned PUT on records bucket
  - [ ] ElastiCache Redis 7 cache.t3.micro with Multi-AZ replica in private subnet
  - [ ] AWS Secrets Manager entries for all application secrets
  - [ ] `npx cdk synth` produces valid CloudFormation with no errors
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-007 — Backend Requirements & Base Django Configuration * (Critical Path)
- **Type:** backend
- **Story Points:** 2
- **Parent Story:** (foundational)
- **Sprint:** Sprint 1
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-010, TASK-011, TASK-012
- **Blocked By:** TASK-002, TASK-003
- **Acceptance Criteria:**
  - [ ] `backend/requirements.txt` includes: `django==5.*`, `djangorestframework==3.15.*`, `djangorestframework-simplejwt`, `django-redis`, `celery[redis]`, `boto3`, `sendgrid`, `razorpay`, `WeasyPrint==60.*`, `python-json-logger`, `drf-spectacular`, `psycopg2-binary`, `pytest-django`, `pytest-cov`, `black`, `isort`, `flake8`
  - [ ] `medslot/settings/base.py` configures: INSTALLED_APPS (all 8 apps + DRF + simplejwt + drf_spectacular + django_redis), DATABASES (PostgreSQL via env), CACHES (Redis via env), CELERY_BROKER_URL, REST_FRAMEWORK defaults, SIMPLE_JWT settings (24h access token), CONN_MAX_AGE=60
  - [ ] Custom JSON log formatter configured in settings
  - [ ] `python manage.py check` passes with no errors
  - [ ] `pytest` runs without import errors (0 tests collected is acceptable at this stage)
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-008 — Frontend Base Configuration & Shared Libraries * (Critical Path)
- **Type:** frontend
- **Story Points:** 2
- **Parent Story:** (foundational)
- **Sprint:** Sprint 1
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** TASK-040, TASK-041, TASK-042
- **Blocked By:** TASK-002
- **Acceptance Criteria:**
  - [ ] `frontend/package.json` includes: `next@14`, `typescript@5`, `tailwindcss@3`, `zustand@4`, `axios`, `react-hook-form`, `zod`, `@hookform/resolvers`, `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `eslint-config-airbnb-typescript`
  - [ ] `tsconfig.json` with strict mode enabled
  - [ ] `tailwind.config.ts` with desktop-first breakpoints (base = 1280px+, sm: 768px, mobile implied at 375px)
  - [ ] `frontend/lib/api.ts`: Axios instance with base URL from env, JWT Bearer token interceptor, 401 redirect to login
  - [ ] `frontend/lib/stores/authStore.ts`: Zustand store for `user`, `token`, `role`, `setAuth`, `clearAuth`
  - [ ] ESLint config (Airbnb TypeScript) passing `npm run lint` with 0 errors on empty project
  - [ ] Vitest config with coverage threshold 90%
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-009 — WeasyPrint Spike: PDF Generation Performance Validation
- **Type:** backend
- **Story Points:** 2
- **Parent Story:** (foundational — addresses OQ-005 / risk A-02-009)
- **Sprint:** Sprint 1
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-075
- **Blocked By:** TASK-007
- **Acceptance Criteria:**
  - [ ] Simple WeasyPrint HTML template rendered to PDF in a Celery task
  - [ ] 10 concurrent PDF generation requests measured; P95 time recorded
  - [ ] If P95 < 4s: document result in spike notes; proceed with WeasyPrint approach
  - [ ] If P95 >= 4s: escalate as Tier 1 gap before TASK-075 is scheduled
  - [ ] Spike result documented in `docs/assumptions/06-task-breakdown-assumptions.md`
- **Definition of Done:** Spike is timeboxed at 1 day; decision documented regardless of outcome
- **Wireframe Ref:** —
- **API Ref:** —

---

## EPIC-002: Authentication & User Identity

### TASK-010 — CustomUser Model & Database Migration * (Critical Path)
- **Type:** database
- **Story Points:** 2
- **Parent Story:** US-001, US-002, US-012, US-013
- **Sprint:** Sprint 1
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-011, TASK-012, TASK-013
- **Blocked By:** TASK-007
- **Acceptance Criteria:**
  - [ ] `accounts/models.py`: `CustomUser(AbstractBaseUser)` with fields: `id` (UUID PK), `phone` (unique, indexed), `role` (choices: patient/doctor/admin), `is_active`, `created_at`; no password field
  - [ ] `PatientProfile` model: FK to CustomUser (1:1), `full_name` (# PHI), `date_of_birth` (# PHI), `gender`, `email` (# PHI), `created_at`
  - [ ] `DoctorProfile` model: FK to CustomUser (1:1), `full_name`, `specialty` (FK to Specialty), `mci_number` (indexed), `clinic_name`, `clinic_area`, `clinic_city`, `credential_document_s3_key`, `account_status` (choices: pending/approved/rejected/suspended), `approved_at`, `created_at`; PHI fields annotated `# PHI`
  - [ ] `Specialty` model: `id`, `name` (unique), `slug`; 13-row seed data migration
  - [ ] `AUTH_USER_MODEL = 'accounts.CustomUser'` in settings
  - [ ] Migration runs without errors; `python manage.py migrate` completes
  - [ ] All PHI fields annotated with `# PHI` comment
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-011 — OTP Service: Redis Rate-Limiting & OTP Generation * (Critical Path)
- **Type:** backend
- **Story Points:** 3
- **Parent Story:** US-001, US-002, US-012, US-013
- **Sprint:** Sprint 1
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-013
- **Blocked By:** TASK-007, TASK-010
- **Acceptance Criteria:**
  - [ ] `accounts/services.py` → `OTPService`: `generate_otp(phone)` generates 6-digit numeric OTP; stores SHA-256+PEPPER hash in Redis key `otp:{phone}` with 5-min TTL
  - [ ] `verify_otp(phone, code)` checks hash; increments failure counter `otp_fail:{phone}`; returns OTPResult enum (valid/invalid/expired/locked)
  - [ ] After 3 failures within 10 min: sets `otp_lock:{phone}` with 15-min TTL; returns locked
  - [ ] Rate limit: `otp_rate:{phone}` counter with 60-min TTL; max 5 requests; returns 429 on excess
  - [ ] `MSG91Adapter.send_otp(phone, otp_code)` makes POST to MSG91 OTP API v5; retries once on 5xx
  - [ ] Unit tests cover: successful OTP, expired OTP, 3-failure lockout, rate limit, MSG91 retry
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** POST /api/v1/auth/otp/request/, POST /api/v1/auth/otp/verify/

### TASK-012 — JWT Auth Service & DRF Permission Classes * (Critical Path)
- **Type:** backend
- **Story Points:** 2
- **Parent Story:** US-001, US-002, US-013
- **Sprint:** Sprint 1
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-013, TASK-020, TASK-030, TASK-050, TASK-060, TASK-070, TASK-080
- **Blocked By:** TASK-010, TASK-011
- **Acceptance Criteria:**
  - [ ] `AuthService.issue_jwt(user)` returns HS256 JWT with payload: `user_id`, `role`, `exp` (24h)
  - [ ] `accounts/permissions.py`: `IsPatient`, `IsApprovedDoctor`, `IsAdmin`, `IsApprovedOrTrialDoctor` DRF permission classes; each checks `request.user.role` and doctor `account_status`
  - [ ] `IsApprovedOrTrialDoctor` allows access if status=Approved AND (subscription Active OR trial not expired)
  - [ ] Cross-role tests: Patient JWT on doctor endpoint returns 403; Doctor JWT on patient endpoint returns 403; missing JWT on protected endpoint returns 401
  - [ ] simplejwt configured: `ACCESS_TOKEN_LIFETIME = timedelta(hours=24)`, no refresh tokens in v1
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-013 — Auth API Endpoints (OTP Request, OTP Verify, Patient Profile Create) * (Critical Path)
- **Type:** backend
- **Story Points:** 3
- **Parent Story:** US-001, US-002, US-013
- **Sprint:** Sprint 1
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-040, TASK-041
- **Blocked By:** TASK-011, TASK-012
- **Acceptance Criteria:**
  - [ ] `POST /api/v1/auth/otp/request/`: accepts `{phone, role}`; validates Indian phone format; calls OTPService; returns 200 or 429
  - [ ] `POST /api/v1/auth/otp/verify/`: accepts `{phone, otp_code}`; verifies OTP; if new patient → returns `{token, is_new_user: true}`; if existing → `{token, is_new_user: false}`; if pending doctor → 403 with message
  - [ ] `POST /api/v1/patient/profile/`: creates PatientProfile (authenticated patient); validates name, DOB, gender, email (RFC 5322); returns 201
  - [ ] `GET /api/v1/patient/profile/`: returns patient profile; IsPatient permission
  - [ ] All endpoints return DRF serializer field-level validation errors on invalid input
  - [ ] Integration tests cover all acceptance criteria from US-001 and US-002
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** POST /api/v1/auth/otp/request/, POST /api/v1/auth/otp/verify/, POST /api/v1/patient/profile/

### TASK-014 — Patient OTP Auth Screen (SCR-006) * (Critical Path)
- **Type:** frontend
- **Story Points:** 3
- **Parent Story:** US-001, US-002
- **Sprint:** Sprint 2
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** TASK-043
- **Blocked By:** TASK-008, TASK-013
- **Acceptance Criteria:**
  - [ ] 3-step wizard: Step 1 phone entry (+91 prefix, 10-digit validation), Step 2 OTP entry (6 individual boxes), Step 3 profile form (new users only)
  - [ ] All 4 wireframe states implemented: default, loading (spinner on buttons), error (inline messages per spec), success (redirect)
  - [ ] OTP input: 6 individual digit boxes; auto-advance focus on digit entry; paste support
  - [ ] Resend OTP timer: 30-second countdown before "Resend OTP" becomes clickable
  - [ ] Lockout state: "Too many failed attempts. Try again in 15 minutes." — no retry button shown
  - [ ] On successful login (returning user): redirect to `/dashboard`; on new user: show step 3
  - [ ] On profile creation success: redirect to `/dashboard` or pending booking URL
  - [ ] React Hook Form + Zod validation on all fields per spec in WIREFRAMES.md SCR-006
  - [ ] Zustand `authStore.setAuth(token, user, role)` called on successful OTP verify
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** docs/visuals/ux/SCR-006-patient-otp-auth/
- **API Ref:** POST /api/v1/auth/otp/request/, POST /api/v1/auth/otp/verify/, POST /api/v1/patient/profile/

### TASK-015 — Doctor OTP Auth Screen (SCR-010)
- **Type:** frontend
- **Story Points:** 3
- **Parent Story:** US-012, US-013
- **Sprint:** Sprint 2
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** TASK-044
- **Blocked By:** TASK-008, TASK-013, TASK-016
- **Acceptance Criteria:**
  - [ ] Two tabs: Login (OTP flow identical to SCR-006) and Register (multi-field registration form)
  - [ ] Registration form: all 8 required fields per WIREFRAMES.md SCR-010 spec; inline validation per field
  - [ ] Credential document upload: file type validation (PDF/JPG/PNG), size validation (≤10MB) client-side before submit
  - [ ] Pending account login: "Your application is under review." message shown on 403 response
  - [ ] All 4 wireframe states: default, loading, error, success
  - [ ] Registration success: "Application submitted successfully! We'll notify you within 48 hours." message shown
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** docs/visuals/ux/SCR-010-doctor-otp-auth/
- **API Ref:** POST /api/v1/auth/otp/request/, POST /api/v1/auth/otp/verify/, POST /api/v1/doctor/register/

### TASK-016 — Doctor Registration API Endpoint
- **Type:** backend
- **Story Points:** 3
- **Parent Story:** US-012
- **Sprint:** Sprint 2
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-015
- **Blocked By:** TASK-010, TASK-012
- **Acceptance Criteria:**
  - [ ] `POST /api/v1/doctor/register/`: accepts multipart form with all registration fields + credential document file
  - [ ] Validates all required fields; returns field-level errors per DRF serializer
  - [ ] Credential document: validates file type (PDF/JPEG/PNG) and size (≤10MB); uploads to S3 `credentials/{doctor_id}/{uuid}.{ext}` via S3Adapter
  - [ ] Creates CustomUser (role=doctor) + DoctorProfile (status=pending_verification)
  - [ ] Triggers `send_registration_notification_email` Celery task (admin notification)
  - [ ] Returns 201 with `{message: "Application submitted. We will notify you within 48 hours."}`
  - [ ] Duplicate phone number returns 409
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** POST /api/v1/doctor/register/

### TASK-017 — Auth Unit & Integration Tests
- **Type:** test
- **Story Points:** 3
- **Parent Story:** US-001, US-002, US-012, US-013
- **Sprint:** Sprint 2
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** —
- **Blocked By:** TASK-011, TASK-012, TASK-013, TASK-016
- **Acceptance Criteria:**
  - [ ] `pytest` coverage ≥ 90% for `accounts/` app
  - [ ] Tests cover: OTP generation, hash verification, expiry, 3-failure lockout, rate limit (5 req/60min), JWT issuance, JWT expiry, all permission classes (IsPatient, IsApprovedDoctor, IsAdmin), patient profile CRUD, doctor registration with valid/invalid inputs, credential document S3 upload mock
  - [ ] All tests pass in CI pipeline
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

---

## EPIC-003: Doctor Registration & Admin Verification

### TASK-018 — Django Admin Configuration for Doctor Approval
- **Type:** backend
- **Story Points:** 2
- **Parent Story:** US-022, US-023, US-024
- **Sprint:** Sprint 2
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-019
- **Blocked By:** TASK-010
- **Acceptance Criteria:**
  - [ ] `accounts/admin.py`: `DoctorProfileAdmin` registered with list display: name, specialty, MCI number, city, submission date, account_status
  - [ ] Filter by status (pending/approved/rejected/suspended); search by name, MCI number
  - [ ] `DoctorProfileAdmin.approve_doctor(request, queryset)` custom action: sets status=approved, records `approved_at`, triggers `send_doctor_status_email` Celery task (approval email)
  - [ ] `reject_doctor` custom action: requires admin to enter rejection reason; sets status=rejected; triggers rejection email with reason
  - [ ] `suspend_doctor` custom action: sets status=suspended; triggers suspension notification
  - [ ] `reactivate_doctor` custom action: sets status=approved; restores dashboard access
  - [ ] Credential document S3 presigned URL shown in detail view (admin-only, 1-hour expiry)
  - [ ] All actions protected by `IsAdmin` — non-admin users see Django admin 403
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** docs/visuals/ux/SCR-016-admin-doctor-approval/
- **API Ref:** —

### TASK-019 — Admin Approval Notification Emails
- **Type:** backend
- **Story Points:** 2
- **Parent Story:** US-022, US-023, US-024
- **Sprint:** Sprint 2
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** —
- **Blocked By:** TASK-018
- **Acceptance Criteria:**
  - [ ] `notifications/tasks.py`: `send_doctor_status_email(doctor_id, new_status, rejection_reason=None)` Celery task
  - [ ] Approval email: subject "Your MedSlot account is approved!"; body includes doctor name, login URL, trial period start date
  - [ ] Rejection email: subject "MedSlot application update"; body includes rejection reason from admin
  - [ ] Admin new-application email: sent within 60s of registration submission; includes doctor name, specialty, link to admin panel
  - [ ] SendGrid adapter with 3-retry exponential backoff on 5xx
  - [ ] `Notification` model record created for every dispatched email (audit trail)
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

---

## EPIC-004: Doctor Search & Discovery

### TASK-020 — Doctor Search API Endpoint (SSR-compatible) * (Critical Path)
- **Type:** backend
- **Story Points:** 3
- **Parent Story:** US-003, US-004
- **Sprint:** Sprint 2
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-042
- **Blocked By:** TASK-010, TASK-012
- **Acceptance Criteria:**
  - [ ] `GET /api/v1/doctors/search/?specialty={slug}&city={city}`: public endpoint (no auth required)
  - [ ] Returns only doctors with `account_status=approved`
  - [ ] Filters: `specialty` (slug match on Specialty model), `city` (case-insensitive match on `clinic_city`)
  - [ ] Response per doctor: `id`, `slug`, `full_name`, `specialty`, `clinic_name`, `clinic_area`, `clinic_city`, `next_available_date`
  - [ ] `next_available_date`: queries AppointmentSlot for earliest unbooked slot ≥ today; returns null if none
  - [ ] Ordering: exact specialty match first, then alphabetical by last name (FR-SEARCH-004)
  - [ ] No results: returns empty array (200) not 404
  - [ ] Composite DB index on `(clinic_city, account_status, specialty_id)` created in migration
  - [ ] `GET /api/v1/specialties/`: returns all 13 specialties (name + slug); public; cached in Redis 1h
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** GET /api/v1/doctors/search/, GET /api/v1/specialties/

### TASK-021 — Doctor Profile API Endpoint (Public)
- **Type:** backend
- **Story Points:** 2
- **Parent Story:** US-005
- **Sprint:** Sprint 2
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-043
- **Blocked By:** TASK-010, TASK-020
- **Acceptance Criteria:**
  - [ ] `GET /api/v1/doctors/{slug}/`: public endpoint; returns doctor profile + next 7 days of available slots
  - [ ] Profile fields: `full_name`, `specialty`, `mci_verified` (always true for approved), `clinic_name`, `clinic_area`, `clinic_city`
  - [ ] Slots: grouped by date; only available (unbooked, non-blocked) slots; covers next 7 calendar days from today (IST)
  - [ ] 404 if doctor not found or not approved
  - [ ] Redis cache: slot availability cached with 5-min TTL per doctor; cache invalidated on booking
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** GET /api/v1/doctors/{slug}/

### TASK-022 — Landing / Doctor Search Screen (SCR-001, SSR)
- **Type:** frontend
- **Story Points:** 3
- **Parent Story:** US-003, US-004
- **Sprint:** Sprint 3
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** TASK-043
- **Blocked By:** TASK-008, TASK-020
- **Acceptance Criteria:**
  - [ ] Next.js App Router SSR page at `/` (public, `(public)` route group)
  - [ ] Hero section with specialty dropdown (13 options loaded server-side) and city text input
  - [ ] Search submit navigates to `/search?specialty={slug}&city={city}` with query params
  - [ ] Specialty dropdown: if API fails, falls back to static 13-specialty list
  - [ ] All wireframe states from SCR-001 implemented: default, loading (slim top progress bar + button spinner), error (static fallback)
  - [ ] Tailwind desktop-first styling; fully responsive at 768px and 375px
  - [ ] Trust section (3 cards) and How It Works section rendered as static HTML
  - [ ] Page passes Lighthouse accessibility audit (WCAG 2.1 AA target)
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** docs/visuals/ux/SCR-001-landing-search/
- **API Ref:** GET /api/v1/specialties/

### TASK-023 — Search Results Screen (SCR-002, SSR)
- **Type:** frontend
- **Story Points:** 3
- **Parent Story:** US-003, US-004
- **Sprint:** Sprint 3
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** TASK-043
- **Blocked By:** TASK-008, TASK-020
- **Acceptance Criteria:**
  - [ ] Next.js SSR page at `/search`; reads query params `specialty` and `city` and fetches server-side
  - [ ] Doctor cards display: name, specialty, "MCI Verified" badge, clinic name, area, city, next available date
  - [ ] All 4 wireframe states: default (results list), loading (skeleton cards — 3 rows), empty ("No doctors found..."), error (retry button)
  - [ ] Inline search bar for filter modification and re-search
  - [ ] Each doctor card links to `/doctors/{slug}`
  - [ ] "Next Available: No slots available" shown when `next_available_date` is null
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** docs/visuals/ux/SCR-002-search-results/
- **API Ref:** GET /api/v1/doctors/search/

### TASK-024 — Doctor Profile Screen (SCR-003, SSR)
- **Type:** frontend
- **Story Points:** 3
- **Parent Story:** US-005, US-006
- **Sprint:** Sprint 3
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** TASK-045
- **Blocked By:** TASK-008, TASK-021
- **Acceptance Criteria:**
  - [ ] Next.js SSR page at `/doctors/{slug}`; fetches profile + slots server-side
  - [ ] Left panel: doctor info (name, specialty, MCI Verified badge, MCI reg number, clinic); right panel: 7-day slot calendar with date tabs and slot chips
  - [ ] Slot chips: available slots as teal chips; clicking a chip → if unauthenticated redirect to `/auth/patient?return_url=/book/{slot_id}`; if authenticated navigate to `/book/{slot_id}`
  - [ ] All 4 wireframe states: default, loading (skeletons), empty (no slots message), error
  - [ ] "Book Appointment" CTA scrolls to slot grid
  - [ ] Date tabs: 7 tabs for next 7 days; selected tab highlights
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** docs/visuals/ux/SCR-003-doctor-profile/
- **API Ref:** GET /api/v1/doctors/{slug}/

### TASK-025 — Search & Discovery Integration Tests
- **Type:** test
- **Story Points:** 2
- **Parent Story:** US-003, US-004, US-005
- **Sprint:** Sprint 3
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** —
- **Blocked By:** TASK-020, TASK-021
- **Acceptance Criteria:**
  - [ ] `pytest` coverage ≥ 90% for search-related views and services
  - [ ] Tests: search with specialty only, city only, both; non-approved doctor excluded; empty result; doctor profile with slots; doctor profile no slots; cache invalidation on booking
  - [ ] Ordering test: exact specialty match precedes partial; alphabetical within group
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

---

## EPIC-005: Availability Calendar & Slot Generation

### TASK-026 — Availability Calendar & Slot Models
- **Type:** database
- **Story Points:** 2
- **Parent Story:** US-014
- **Sprint:** Sprint 2
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-027, TASK-028
- **Blocked By:** TASK-010
- **Acceptance Criteria:**
  - [ ] `AvailabilityCalendar` model: FK DoctorProfile (1:1), `working_days` (ArrayField or JSON), `slot_duration_minutes` (choices: 15/30/45/60), `created_at`, `updated_at`
  - [ ] `WorkingHours` model: FK AvailabilityCalendar, `day_of_week` (0=Mon–6=Sun), `start_time`, `end_time`
  - [ ] `BlockedDate` model: FK DoctorProfile, `date`, `reason` (optional)
  - [ ] `AppointmentSlot` model: FK DoctorProfile, `slot_datetime` (TIMESTAMPTZ UTC), `is_booked` (bool, default False), `is_blocked` (bool, default False); composite index on `(doctor_profile_id, slot_datetime, is_booked)`
  - [ ] Migrations run cleanly; `python manage.py migrate` passes
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-027 — Slot Generation Service & Celery Beat Task
- **Type:** backend
- **Story Points:** 3
- **Parent Story:** US-014
- **Sprint:** Sprint 2
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-020, TASK-028
- **Blocked By:** TASK-026
- **Acceptance Criteria:**
  - [ ] `SlotGenerationService.generate_slots_for_doctor(doctor_id)`: reads AvailabilityCalendar + WorkingHours + BlockedDates; generates AppointmentSlot rows for rolling 30 days from today (IST); skips blocked dates; skips already-booked slots; idempotent (upsert, not duplicate insert)
  - [ ] `regenerate_all_slots` Celery Beat task: runs daily at midnight IST (`crontab(hour=18, minute=30)` UTC); calls `generate_slots_for_doctor` for all approved doctors with configured calendars
  - [ ] Slot generation on calendar save: `generate_slots_for_doctor` triggered immediately on `PUT /api/v1/doctor/availability/`
  - [ ] Existing Scheduled appointments NOT deleted when calendar changes (FR-CAL-004)
  - [ ] Performance: generating 30 days × 8 slots/day = 240 slots for 1 doctor completes in < 2s
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-028 — Availability Calendar API Endpoints
- **Type:** backend
- **Story Points:** 2
- **Parent Story:** US-014
- **Sprint:** Sprint 3
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-046
- **Blocked By:** TASK-026, TASK-027
- **Acceptance Criteria:**
  - [ ] `GET /api/v1/doctor/availability/`: returns current calendar config; IsApprovedDoctor permission
  - [ ] `PUT /api/v1/doctor/availability/`: saves working days, hours, slot duration; validates end_time > start_time (FR-CAL-006); triggers slot regeneration; IsApprovedDoctor permission
  - [ ] `POST /api/v1/doctor/availability/blocked-dates/`: adds blocked date; IsApprovedDoctor
  - [ ] `DELETE /api/v1/doctor/availability/blocked-dates/{id}/`: removes blocked date; IsApprovedDoctor
  - [ ] Invalid time range (end ≤ start): returns 400 with field error "End time must be after start time."
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** GET/PUT /api/v1/doctor/availability/, POST/DELETE /api/v1/doctor/availability/blocked-dates/

### TASK-029 — Availability Calendar Management Screen (SCR-012)
- **Type:** frontend
- **Story Points:** 3
- **Parent Story:** US-014
- **Sprint:** Sprint 4
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** —
- **Blocked By:** TASK-008, TASK-028
- **Acceptance Criteria:**
  - [ ] Working days table: 7 rows (Mon–Sun); checkbox per row; when checked shows start/end time inputs and calculated "Slots/Day" count
  - [ ] Slot duration radio group: 15/30/45/60 min options
  - [ ] Blocked dates section: date picker input + "Add" button; blocked dates listed with remove action
  - [ ] Slot preview: "This generates X slots this week" — calculated live from form state
  - [ ] All 5 wireframe states: default, loading, empty (no config yet), error (save fail), success (saved)
  - [ ] Validation: end time ≤ start time → inline error; no working days selected → inline error
  - [ ] On save success: "Availability updated." inline success banner
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** docs/visuals/ux/SCR-012-availability-calendar/
- **API Ref:** GET/PUT /api/v1/doctor/availability/

---

## EPIC-006: Appointment Booking Flow

### TASK-030 — Appointment & Booking Models * (Critical Path)
- **Type:** database
- **Story Points:** 2
- **Parent Story:** US-006
- **Sprint:** Sprint 2
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-031
- **Blocked By:** TASK-010, TASK-026
- **Acceptance Criteria:**
  - [ ] `Appointment` model: `id` (UUID PK), FK PatientProfile, FK DoctorProfile, FK AppointmentSlot (1:1), `status` (scheduled/in_consultation/completed/no_show/cancelled), `scheduled_at` (TIMESTAMPTZ), `created_at`; composite index on `(patient_profile_id, status)` and `(doctor_profile_id, scheduled_at)`
  - [ ] `AppointmentSlot.is_booked` updated atomically on booking (row-level lock)
  - [ ] Migration runs cleanly
  - [ ] PHI note: appointment links patient to doctor — FK relationships are PII but no PHI fields in this model
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-031 — Appointment Booking API Endpoint (with Row-Level Lock) * (Critical Path)
- **Type:** backend
- **Story Points:** 3
- **Parent Story:** US-006
- **Sprint:** Sprint 3
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-045
- **Blocked By:** TASK-030, TASK-012
- **Acceptance Criteria:**
  - [ ] `POST /api/v1/appointments/`: IsPatient permission; accepts `{slot_id}`
  - [ ] Uses `select_for_update()` row-level lock on AppointmentSlot within `atomic()` transaction
  - [ ] Concurrent booking: one succeeds (201), other gets 409 "slot no longer available"
  - [ ] One patient / one doctor / one date check (FR-BOOK-004): returns 409 with message
  - [ ] On success: creates Appointment (status=scheduled), sets `slot.is_booked=True`, invalidates Redis slot cache for doctor
  - [ ] Triggers `send_booking_confirmation_email` and `send_booking_notification_to_doctor` Celery tasks
  - [ ] Returns 201 with appointment details including doctor info, date, time, clinic
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** POST /api/v1/appointments/

### TASK-032 — Booking Flow Screen (SCR-004)
- **Type:** frontend
- **Story Points:** 2
- **Parent Story:** US-006
- **Sprint:** Sprint 4
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** TASK-047
- **Blocked By:** TASK-008, TASK-031, TASK-024
- **Acceptance Criteria:**
  - [ ] CSR page at `/book/{slot_id}`; requires authentication (redirect to `/auth/patient?return_url=...` if not)
  - [ ] Booking summary card: doctor name, specialty, MCI Verified badge, clinic, full address, date, time
  - [ ] "Confirm Appointment" button: calls POST /api/v1/appointments/; shows spinner + "Processing your booking..." during request
  - [ ] "← Back" button navigates back to doctor profile
  - [ ] All 4 wireframe states: default, loading, error (slot taken → message + back link), success (redirect to SCR-005)
  - [ ] Error handling: 409 slot conflict → "This slot was just taken by another patient."; 409 duplicate → "You already have an appointment with this doctor on this date."
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** docs/visuals/ux/SCR-004-booking-flow/
- **API Ref:** POST /api/v1/appointments/

### TASK-033 — Booking Confirmation Screen (SCR-005)
- **Type:** frontend
- **Story Points:** 1
- **Parent Story:** US-006
- **Sprint:** Sprint 4
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** —
- **Blocked By:** TASK-032
- **Acceptance Criteria:**
  - [ ] CSR page at `/book/confirmed`; reads appointment ID from URL or session state
  - [ ] Large green checkmark icon; "Appointment Confirmed!" heading
  - [ ] Appointment details card with all booking info
  - [ ] "A confirmation email has been sent to {patient_email}" message
  - [ ] Two CTAs: "View My Appointments" (→ /dashboard) and "Book Another Doctor" (→ /)
  - [ ] All 3 wireframe states: default, loading, error (with fallback link to /dashboard)
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** docs/visuals/ux/SCR-005-booking-confirmation/
- **API Ref:** GET /api/v1/appointments/{id}/

### TASK-034 — Booking Integration Tests
- **Type:** test
- **Story Points:** 2
- **Parent Story:** US-006
- **Sprint:** Sprint 4
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** —
- **Blocked By:** TASK-031
- **Acceptance Criteria:**
  - [ ] Coverage ≥ 90% for `appointments/` booking-related code
  - [ ] Tests: successful booking, concurrent double-booking (row-lock), duplicate same-doctor same-date (409), doctor JWT on booking endpoint (403), slot cache invalidated after booking
  - [ ] Concurrent booking test uses `threading.Thread` to simulate race condition
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

---

## EPIC-007: Appointment Management

### TASK-035 — Patient Appointment List & Cancellation API
- **Type:** backend
- **Story Points:** 3
- **Parent Story:** US-007, US-008
- **Sprint:** Sprint 3
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-048
- **Blocked By:** TASK-030, TASK-012
- **Acceptance Criteria:**
  - [ ] `GET /api/v1/patient/appointments/`: returns all appointments for authenticated patient; sorted by `scheduled_at` descending; includes doctor name, specialty, clinic, date, time, status; IsPatient
  - [ ] `DELETE /api/v1/appointments/{id}/cancel/`: IsPatient; validates appointment is Scheduled; validates current time > appointment start − 2 hours (IST); sets status=cancelled; triggers cancellation email to doctor; frees slot (`is_booked=False`)
  - [ ] Cancel within 2h window: 409 "Cancellations are not allowed within 2 hours of the appointment."
  - [ ] Cancel already-cancelled: 409 "This appointment has already been cancelled."
  - [ ] All time calculations in IST (UTC+5:30)
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** GET /api/v1/patient/appointments/, DELETE /api/v1/appointments/{id}/cancel/

### TASK-036 — Doctor Appointment Management API (Today, Upcoming, Cancel, No-Show)
- **Type:** backend
- **Story Points:** 3
- **Parent Story:** US-015, US-016, US-020, US-021
- **Sprint:** Sprint 3
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-049
- **Blocked By:** TASK-030, TASK-012
- **Acceptance Criteria:**
  - [ ] `GET /api/v1/doctor/appointments/today/`: returns today's appointments (IST) for doctor; sorted time ascending; includes patient name, time, status; IsApprovedDoctor
  - [ ] `GET /api/v1/doctor/appointments/upcoming/`: returns next 30 days appointments; date-time ascending; IsApprovedDoctor
  - [ ] `DELETE /api/v1/appointments/{id}/cancel/` (doctor): IsApprovedDoctor; validates appointment is Scheduled AND before start time; sets status=cancelled; triggers cancellation email to patient
  - [ ] `PATCH /api/v1/appointments/{id}/no-show/`: IsApprovedDoctor; validates appointment start time has passed; sets status=no_show
  - [ ] Terminal status protection: any state change on completed/no_show/cancelled returns 409
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** GET /api/v1/doctor/appointments/today/, GET /api/v1/doctor/appointments/upcoming/, PATCH /api/v1/appointments/{id}/no-show/

### TASK-037 — Patient Dashboard Screen (SCR-007)
- **Type:** frontend
- **Story Points:** 3
- **Parent Story:** US-007, US-008, US-010, US-011
- **Sprint:** Sprint 4
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** —
- **Blocked By:** TASK-008, TASK-035
- **Acceptance Criteria:**
  - [ ] CSR page at `/dashboard`; IsPatient route guard
  - [ ] Tabs: Upcoming / Past; appointments sorted date descending
  - [ ] Each card: doctor name, specialty, clinic, date/time, status badge (teal=Scheduled, green=Completed, red=Cancelled)
  - [ ] Cancel button: visible on Scheduled cards; disabled with tooltip "Cancellation not allowed within 2 hours" if < 2h before start; calls DELETE /api/v1/appointments/{id}/cancel/ with confirmation modal
  - [ ] Completed cards: "View Prescription" link (→ /prescriptions/{id}) and "Download PDF" button
  - [ ] All 4 wireframe states: default, loading (skeleton cards), empty (CTA to find doctors), error
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** docs/visuals/ux/SCR-007-patient-dashboard/
- **API Ref:** GET /api/v1/patient/appointments/, DELETE /api/v1/appointments/{id}/cancel/

### TASK-038 — Doctor Dashboard Screen (SCR-011)
- **Type:** frontend
- **Story Points:** 3
- **Parent Story:** US-015, US-016, US-020, US-021
- **Sprint:** Sprint 5
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** TASK-051, TASK-052
- **Blocked By:** TASK-008, TASK-036
- **Acceptance Criteria:**
  - [ ] CSR page at `/doctor/dashboard`; IsApprovedDoctor route guard
  - [ ] Trial banner: conditional; shows days remaining if trial active; hidden if subscription Active
  - [ ] Left section (2/3): today's appointments sorted by time; each row: time, patient name, status badge, action buttons
  - [ ] Action buttons per status: Scheduled → "Start Consultation" + "Cancel"; past start time Scheduled → "Mark No-Show" + "Cancel"; In Consultation → "Continue Consultation"; Completed/Cancelled → no actions
  - [ ] Right section (1/3): next 5 upcoming appointments (mini list) + "View All Upcoming" link
  - [ ] All 4 wireframe states: default, loading (skeleton rows), empty (no appointments today + CTA if no calendar), error
  - [ ] Cancel confirmation modal; No-Show confirmation modal
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** docs/visuals/ux/SCR-011-doctor-dashboard/
- **API Ref:** GET /api/v1/doctor/appointments/today/, GET /api/v1/doctor/appointments/upcoming/, PATCH /api/v1/appointments/{id}/no-show/

### TASK-039 — Appointment Management Tests
- **Type:** test
- **Story Points:** 2
- **Parent Story:** US-007, US-008, US-015, US-016, US-020, US-021
- **Sprint:** Sprint 4
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** —
- **Blocked By:** TASK-035, TASK-036
- **Acceptance Criteria:**
  - [ ] Coverage ≥ 90% for appointment list and cancellation code
  - [ ] Tests: patient appointment list sorting, patient cancel within window, patient cancel outside window (409), terminal status immutability, doctor today/upcoming lists, doctor cancel, no-show before/after start time, IST timezone boundary tests
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

---

## EPIC-008: Consultation Workflow

### TASK-040 — Consultation Note Model
- **Type:** database
- **Story Points:** 1
- **Parent Story:** US-017, US-018
- **Sprint:** Sprint 3
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-050
- **Blocked By:** TASK-030
- **Acceptance Criteria:**
  - [ ] `ConsultationNote` model: `id` (UUID), FK Appointment (1:1), `chief_complaint` (# PHI), `history` (# PHI, nullable), `examination_findings` (# PHI, nullable), `diagnosis` (# PHI), `plan` (# PHI, nullable), `created_at`, `updated_at`
  - [ ] All text fields annotated `# PHI`
  - [ ] Migration runs cleanly
  - [ ] AuditLog signal receiver on `post_save` for ConsultationNote (NFR-MAIN-004)
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-050 — Consultation API Endpoints (Open, Save Notes) * (Critical Path)
- **Type:** backend
- **Story Points:** 3
- **Parent Story:** US-017, US-018
- **Sprint:** Sprint 4
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-060, TASK-051
- **Blocked By:** TASK-040, TASK-012
- **Acceptance Criteria:**
  - [ ] `POST /api/v1/appointments/{id}/consultation/start/`: IsApprovedDoctor; validates appointment is Scheduled AND date = today (IST); transitions status → in_consultation; creates empty ConsultationNote; returns 201
  - [ ] `GET /api/v1/appointments/{id}/consultation/`: IsApprovedDoctor (assigned doctor only); returns note fields; 403 for other roles/doctors
  - [ ] `PATCH /api/v1/appointments/{id}/consultation/`: saves note draft; validates chief_complaint and diagnosis non-empty on prescription issue attempt; 403 if appointment is Completed
  - [ ] Future-date consultation attempt: 400 "Consultation can only be started on the day of the appointment."
  - [ ] PHI fields: no PHI logged; model fields annotated `# PHI`
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** POST /api/v1/appointments/{id}/consultation/start/, GET/PATCH /api/v1/appointments/{id}/consultation/

### TASK-051 — Consultation View Screen (SCR-013) * (Critical Path)
- **Type:** frontend
- **Story Points:** 3
- **Parent Story:** US-017, US-018
- **Sprint:** Sprint 5
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** TASK-052
- **Blocked By:** TASK-008, TASK-050, TASK-038
- **Acceptance Criteria:**
  - [ ] CSR page at `/doctor/consultation/{appointment_id}`; IsApprovedDoctor route guard
  - [ ] Left sidebar: patient info (name, DOB, age, gender, email) + appointment date/time + status badge
  - [ ] Consultation notes form: 5 fields (Chief Complaint required, History optional, Examination optional, Diagnosis required, Plan optional); textareas with placeholder text per WIREFRAMES.md
  - [ ] "Save Draft" button: calls PATCH; shows "Notes saved." inline confirmation without page redirect
  - [ ] "Issue Prescription →" button: validates Chief Complaint + Diagnosis non-empty; navigates to `/doctor/prescription/{appointment_id}`
  - [ ] All 4 wireframe states: default (empty form or draft-loaded), loading, error (inline required field errors), success (draft saved confirmation)
  - [ ] If appointment is Completed: all fields shown read-only; no Save/Issue buttons
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** docs/visuals/ux/SCR-013-consultation-view/
- **API Ref:** GET/PATCH /api/v1/appointments/{id}/consultation/, POST /api/v1/appointments/{id}/consultation/start/

### TASK-053 — Consultation Tests
- **Type:** test
- **Story Points:** 2
- **Parent Story:** US-017, US-018
- **Sprint:** Sprint 5
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** —
- **Blocked By:** TASK-050
- **Acceptance Criteria:**
  - [ ] Coverage ≥ 90% for consultation views and services
  - [ ] Tests: open consultation on today's date, open on future date (400), open by non-assigned doctor (403), save draft, edit after completed (403), role isolation (patient JWT returns 403)
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

---

## EPIC-009: Prescription Generation & Delivery

### TASK-060 — Prescription Model & WeasyPrint Template * (Critical Path)
- **Type:** database
- **Story Points:** 2
- **Parent Story:** US-019, US-010, US-011
- **Sprint:** Sprint 4
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-070
- **Blocked By:** TASK-040
- **Acceptance Criteria:**
  - [ ] `Prescription` model: `id` (UUID), FK Appointment (1:1), FK ConsultationNote (1:1), `medicines` (JSONField — array of {name, dosage, frequency, duration}), `instructions` (# PHI, nullable), `follow_up_date` (nullable), `pdf_s3_key` (nullable), `pdf_status` (choices: pending/generating/ready/failed), `created_at`; all clinical fields `# PHI`
  - [ ] `prescriptions/templates/prescription_template.html`: WeasyPrint HTML template with all required fields per FR-RX-003; MedSlot header, doctor/patient info, medicines table, instructions, follow-up, generation timestamp; CSS for print-quality formatting
  - [ ] Migration runs cleanly
  - [ ] AuditLog signal on Prescription `post_save`
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-070 — Prescription Create API & Celery PDF Generation Task * (Critical Path)
- **Type:** backend
- **Story Points:** 5
- **Parent Story:** US-019
- **Sprint:** Sprint 5
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-052, TASK-080
- **Blocked By:** TASK-060, TASK-050, TASK-009
- **Acceptance Criteria:**
  - [ ] `POST /api/v1/prescriptions/`: IsApprovedDoctor (assigned); validates appointment status = in_consultation; validates ≥ 1 medicine with all required fields; creates Prescription record (pdf_status=pending); transitions appointment → completed; returns 202 Accepted
  - [ ] `generate_prescription_pdf(prescription_id)` Celery task: renders HTML template with prescription data; generates PDF via WeasyPrint; uploads to S3 `prescriptions/{patient_id}/{appointment_id}.pdf` with SSE-S3; updates `pdf_s3_key` and `pdf_status=ready`; triggers `send_prescription_email` task; max_retries=1 on failure; on final failure: `pdf_status=failed`, CRITICAL log
  - [ ] `send_prescription_email` Celery task: generates 7-day presigned S3 URL; sends SendGrid email to patient with URL; retry 3× exponential backoff
  - [ ] `GET /api/v1/prescriptions/{id}/download/`: IsPatient (own prescription only); generates fresh 7-day presigned S3 URL; returns `{download_url}`
  - [ ] Prescription immutability: PUT/PATCH returns 405; DELETE returns 405
  - [ ] PHI: all clinical fields annotated; no PHI in Celery task logs
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** POST /api/v1/prescriptions/, GET /api/v1/prescriptions/{id}/download/

### TASK-052 — Prescription Issuance Screen (SCR-014) * (Critical Path)
- **Type:** frontend
- **Story Points:** 3
- **Parent Story:** US-019
- **Sprint:** Sprint 5
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** —
- **Blocked By:** TASK-008, TASK-070, TASK-051
- **Acceptance Criteria:**
  - [ ] CSR page at `/doctor/prescription/{appointment_id}`; IsApprovedDoctor route guard
  - [ ] Left sidebar: patient summary (same as SCR-013)
  - [ ] Consultation summary section (read-only): Chief Complaint + Diagnosis from saved notes
  - [ ] Medicine table: dynamic rows; each row has Medicine Name, Dosage, Frequency, Duration inputs + remove (✕) button; "Add Medicine Row" button appends new empty row
  - [ ] Additional Instructions textarea (optional) and Follow-up Date picker (optional)
  - [ ] "Issue Prescription" button: validates ≥ 1 complete medicine row; calls POST /api/v1/prescriptions/; shows full-button loading state "Generating your prescription..."
  - [ ] All 4 wireframe states: default (1 empty row), loading, error (inline validation + PDF failure message), success ("Prescription issued! Patient will receive the PDF by email." → redirect to /doctor/dashboard)
  - [ ] Per-row validation: inline errors on each required field when issue is clicked
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** docs/visuals/ux/SCR-014-prescription-issuance/
- **API Ref:** POST /api/v1/prescriptions/

### TASK-054 — Prescription View Screen (SCR-009)
- **Type:** frontend
- **Story Points:** 2
- **Parent Story:** US-010, US-011
- **Sprint:** Sprint 5
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** —
- **Blocked By:** TASK-008, TASK-070
- **Acceptance Criteria:**
  - [ ] CSR page at `/prescriptions/{id}`; IsPatient route guard
  - [ ] Renders prescription card: MedSlot header, doctor name/specialty/clinic, MCI reg, patient name, date, Chief Complaint, Diagnosis, medicines table (name/dosage/frequency/duration), instructions, follow-up date, generation timestamp
  - [ ] "Download PDF" button: calls GET /api/v1/prescriptions/{id}/download/; opens presigned URL in new tab or triggers browser download
  - [ ] Expired URL handled transparently: fresh URL generated server-side on each GET /download/
  - [ ] All 3 wireframe states: default, loading (content skeleton), error
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** docs/visuals/ux/SCR-009-prescription-view/
- **API Ref:** GET /api/v1/prescriptions/{id}/, GET /api/v1/prescriptions/{id}/download/

### TASK-055 — Prescription & PDF Generation Tests
- **Type:** test
- **Story Points:** 3
- **Parent Story:** US-019, US-010, US-011
- **Sprint:** Sprint 6
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** —
- **Blocked By:** TASK-070
- **Acceptance Criteria:**
  - [ ] Coverage ≥ 90% for `prescriptions/` app
  - [ ] Tests: create prescription with valid data, missing medicine fields (400), prescription on non-in_consultation appointment (400), PDF generation task (mocked WeasyPrint + S3), PDF failure retry + CRITICAL log, presigned URL generation, URL refresh on download endpoint, prescription immutability (PUT/DELETE → 405), PHI isolation (patient can only access own prescriptions)
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

---

## EPIC-010: Patient Health Records

### TASK-080 — Health Record Model & S3 Presigned Upload
- **Type:** database
- **Story Points:** 2
- **Parent Story:** US-009, US-027
- **Sprint:** Sprint 4
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-081, TASK-082
- **Blocked By:** TASK-010
- **Acceptance Criteria:**
  - [ ] `HealthRecord` model: `id` (UUID), FK PatientProfile, `original_filename` (# PHI), `s3_key`, `file_type` (pdf/jpeg/png), `file_size_bytes`, `is_deleted` (bool, default False), `created_at`; PHI fields annotated
  - [ ] Migration runs cleanly
  - [ ] AuditLog signal on HealthRecord `post_save` and soft-delete (NFR-MAIN-004)
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-081 — Health Records API Endpoints
- **Type:** backend
- **Story Points:** 3
- **Parent Story:** US-009, US-027
- **Sprint:** Sprint 5
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-082
- **Blocked By:** TASK-080, TASK-012
- **Acceptance Criteria:**
  - [ ] `GET /api/v1/patient/records/presigned-upload/`: IsPatient; accepts `{filename, file_type, file_size}`; validates type (pdf/jpeg/png) and size (≤10MB); generates S3 presigned PUT URL for `records/{patient_id}/{uuid}.{ext}`; returns `{upload_url, s3_key}`
  - [ ] `POST /api/v1/patient/records/`: IsPatient; called after client-direct S3 upload completes; accepts `{s3_key, original_filename, file_type, file_size}`; creates HealthRecord; returns 201
  - [ ] `GET /api/v1/patient/records/`: IsPatient; returns own records sorted by `created_at` desc; excludes `is_deleted=True`
  - [ ] `GET /api/v1/patient/records/{id}/download/`: IsPatient (own records only); generates 7-day presigned GET URL
  - [ ] `DELETE /api/v1/patient/records/{id}/`: IsPatient; soft-delete (`is_deleted=True`); S3 object retained; record absent from list after deletion
  - [ ] Invalid type/size: 400 with field error
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** GET /api/v1/patient/records/presigned-upload/, POST/GET /api/v1/patient/records/, GET /api/v1/patient/records/{id}/download/, DELETE /api/v1/patient/records/{id}/

### TASK-082 — Health Records Screen (SCR-008)
- **Type:** frontend
- **Story Points:** 3
- **Parent Story:** US-009, US-027
- **Sprint:** Sprint 6
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** —
- **Blocked By:** TASK-008, TASK-081
- **Acceptance Criteria:**
  - [ ] CSR page at `/records`; IsPatient route guard
  - [ ] "+ Upload Record" button reveals collapsible upload panel with drag-and-drop zone and "Browse Files" button
  - [ ] Client-side validation before upload: file type (PDF/JPEG/PNG), file size (≤10MB); inline errors per spec
  - [ ] Upload flow: GET presigned URL → PUT to S3 directly → POST metadata to API; progress bar with percentage during S3 PUT
  - [ ] Records table: File Name, Type, Uploaded date, Actions (Download, Delete)
  - [ ] Delete: confirmation modal → soft delete → record disappears from table
  - [ ] All 5 wireframe states: default, loading (skeleton rows), empty (CTA to upload first), error (upload fail inline), success (success toast on upload)
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** docs/visuals/ux/SCR-008-health-records/
- **API Ref:** GET /api/v1/patient/records/presigned-upload/, POST/GET /api/v1/patient/records/, DELETE /api/v1/patient/records/{id}/

### TASK-083 — Health Records Tests
- **Type:** test
- **Story Points:** 2
- **Parent Story:** US-009, US-027
- **Sprint:** Sprint 6
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** —
- **Blocked By:** TASK-081
- **Acceptance Criteria:**
  - [ ] Coverage ≥ 90% for `records/` app
  - [ ] Tests: presigned URL generation, metadata save after upload, list sorted desc, soft delete (DB record deleted flag + S3 object retained mock), file type validation (400), file size validation (400), patient can only access own records (403 for others)
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

---

## EPIC-011: Notifications

### TASK-041 — Booking Confirmation & Cancellation Email Tasks
- **Type:** backend
- **Story Points:** 3
- **Parent Story:** US-006, US-008, US-021
- **Sprint:** Sprint 3
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** —
- **Blocked By:** TASK-030, TASK-007
- **Acceptance Criteria:**
  - [ ] `send_booking_confirmation_email(appointment_id)` Celery task: SendGrid email to patient within 60s; contains doctor name, specialty, clinic address, date, time; retry 3× exponential backoff
  - [ ] `send_booking_notification_to_doctor(appointment_id)` Celery task: SendGrid email to doctor within 60s; contains patient name, date, time
  - [ ] `send_cancellation_email(appointment_id, cancelled_by)` Celery task: sends to non-cancelling party; contains date, time, who cancelled
  - [ ] `Notification` model record created for every dispatch (audit trail: recipient, type, status, created_at)
  - [ ] SendGridAdapter with retry 3× (1m/5m/30m backoff); alert log on all retries exhausted
  - [ ] All email templates: plain HTML; no PHI beyond what is operationally required (patient name, doctor name, date/time)
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-042 — Appointment Reminder Email (Celery Beat, 24h Before)
- **Type:** backend
- **Story Points:** 2
- **Parent Story:** US-026
- **Sprint:** Sprint 6
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** —
- **Blocked By:** TASK-041, TASK-035
- **Acceptance Criteria:**
  - [ ] `send_appointment_reminders()` Celery Beat task: runs hourly; queries Scheduled appointments where start_time is between (now+23h45m) and (now+24h15m) IST; sends reminder email to patient
  - [ ] Reminder email: doctor name, date, time, clinic address
  - [ ] No reminder sent for cancelled appointments (check status at send time)
  - [ ] Deduplication: check `Notification` table — if reminder already sent for this appointment_id, skip
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-043 — Notification Tests
- **Type:** test
- **Story Points:** 2
- **Parent Story:** US-006, US-008, US-026
- **Sprint:** Sprint 6
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** —
- **Blocked By:** TASK-041, TASK-042
- **Acceptance Criteria:**
  - [ ] Coverage ≥ 90% for `notifications/` app
  - [ ] Tests: booking confirmation sent (mocked SendGrid), cancellation to correct party, retry on 5xx (mock 3 failures), reminder timing boundary (±15 min), reminder not sent for cancelled appointments, reminder deduplication, Notification record created on dispatch
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

---

## EPIC-012: Subscription Management

### TASK-044 — DoctorSubscription Model & Trial Logic
- **Type:** database
- **Story Points:** 2
- **Parent Story:** US-025
- **Sprint:** Sprint 6
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-045, TASK-046
- **Blocked By:** TASK-010
- **Acceptance Criteria:**
  - [ ] `DoctorSubscription` model: FK DoctorProfile (1:1), `status` (choices: trial/active/payment_failed/suspended), `trial_start_date`, `trial_end_date` (trial_start + 30 days), `razorpay_subscription_id` (nullable, indexed), `payment_failed_at` (nullable), `created_at`
  - [ ] On DoctorProfile approval (signal): auto-create DoctorSubscription with status=trial, trial_start_date=now
  - [ ] `IsApprovedOrTrialDoctor` permission: allows if (status=active) OR (status=trial AND today ≤ trial_end_date)
  - [ ] Migration runs cleanly
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-045 — Razorpay Subscription API Integration & Webhook Handler
- **Type:** backend
- **Story Points:** 5
- **Parent Story:** US-025
- **Sprint:** Sprint 7
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-046
- **Blocked By:** TASK-044, TASK-012
- **Acceptance Criteria:**
  - [ ] `POST /api/v1/subscriptions/create/`: IsApprovedOrTrialDoctor; calls Razorpay Subscriptions API to create subscription; stores `razorpay_subscription_id`; returns Razorpay checkout URL
  - [ ] `POST /api/v1/webhooks/razorpay/`: public endpoint; validates HMAC-SHA256 signature (`X-Razorpay-Signature` header) before any state change; invalid signature → 400 + CRITICAL log; valid → idempotent event processing
  - [ ] `subscription.activated` webhook: sets status=active; removes trial banner (subscription active)
  - [ ] `payment_failed` webhook: sets status=payment_failed; records `payment_failed_at`; triggers payment failure email to doctor
  - [ ] Payment Failed > 7 days check: `IsApprovedOrTrialDoctor` returns 402 if payment_failed AND (now - payment_failed_at) > 7 days
  - [ ] Processed webhook deduplication: `ProcessedWebhookEvent` model stores Razorpay event ID; duplicate events skipped
  - [ ] FR-SUB-006: webhook HMAC test with invalid signature returns 400 and no state change
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** POST /api/v1/subscriptions/create/, POST /api/v1/webhooks/razorpay/

### TASK-046 — Doctor Profile / Settings Screen (SCR-015)
- **Type:** frontend
- **Story Points:** 3
- **Parent Story:** US-025
- **Sprint:** Sprint 7
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** —
- **Blocked By:** TASK-008, TASK-016, TASK-044
- **Acceptance Criteria:**
  - [ ] CSR page at `/doctor/profile`; IsApprovedDoctor route guard
  - [ ] Left column (1/3): public profile preview card (read-only, shows how patients see the profile)
  - [ ] Right column (2/3): Public Profile section (full name, specialty, MCI number — all read-only with lock icon); Clinic Details section (editable: clinic name, area, city); Subscription section (status badge + trial days remaining or "Active ✓" + "Manage Subscription via Razorpay" button)
  - [ ] Clinic details form: calls PATCH /api/v1/doctor/profile/; "Save Changes" button
  - [ ] "Manage Subscription" button: links to Razorpay checkout or subscription management URL
  - [ ] Trial expiry banner shown if trial active (synced with SCR-011 banner)
  - [ ] All 4 wireframe states: default, loading (save spinner), error, success ("Your profile has been updated." banner)
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** docs/visuals/ux/SCR-015-doctor-profile-settings/
- **API Ref:** GET/PATCH /api/v1/doctor/profile/, POST /api/v1/subscriptions/create/

### TASK-047 — Doctor Profile Update API Endpoint
- **Type:** backend
- **Story Points:** 2
- **Parent Story:** US-025
- **Sprint:** Sprint 6
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-046
- **Blocked By:** TASK-010, TASK-012
- **Acceptance Criteria:**
  - [ ] `GET /api/v1/doctor/profile/`: IsApprovedDoctor; returns doctor profile + subscription status + trial info
  - [ ] `PATCH /api/v1/doctor/profile/`: IsApprovedDoctor; allows updating clinic_name, clinic_area, clinic_city only; MCI number field returns 403 if attempted
  - [ ] Updated profile reflects immediately on public search results and profile page
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** GET/PATCH /api/v1/doctor/profile/

### TASK-048 — Subscription Tests
- **Type:** test
- **Story Points:** 2
- **Parent Story:** US-025
- **Sprint:** Sprint 7
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** —
- **Blocked By:** TASK-045
- **Acceptance Criteria:**
  - [ ] Coverage ≥ 90% for `subscriptions/` app
  - [ ] Tests: trial period access (day 1, day 29, day 31 — blocked), Razorpay webhook activated → status=active, payment_failed webhook → status=payment_failed + email, 7-day grace period (day 7 = allowed, day 8 = 402), webhook HMAC validation (invalid signature → 400 + no state change), webhook deduplication
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

---

## EPIC-013: Analytics & Audit

### TASK-090 — Analytics Event Model & Write Endpoint
- **Type:** backend
- **Story Points:** 2
- **Parent Story:** (cross-cutting)
- **Sprint:** Sprint 6
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** —
- **Blocked By:** TASK-010
- **Acceptance Criteria:**
  - [ ] `AnalyticsEvent` model (in `analytics` schema): `id` (UUID), `user_id_hash` (SHA-256 of user_id — NOT the raw user_id), `event_type` (indexed), `properties` (JSONField), `created_at`; no PHI in properties
  - [ ] `POST /api/v1/analytics/events/`: accepts `{event_type, properties}`; requires authentication; hashes user_id before storing; PHI fields must not appear in properties — DRF validator enforces denied-field list
  - [ ] Core events instrumented across relevant API views: `patient_registered`, `doctor_search_performed`, `doctor_profile_viewed`, `appointment_booked`, `appointment_cancelled`, `consultation_opened`, `prescription_issued`, `prescription_pdf_downloaded`, `health_record_uploaded`, `doctor_approved`, `doctor_subscription_activated`
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** POST /api/v1/analytics/events/

### TASK-091 — AuditLog Model & Django Signals
- **Type:** backend
- **Story Points:** 2
- **Parent Story:** (cross-cutting)
- **Sprint:** Sprint 3
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** —
- **Blocked By:** TASK-010
- **Acceptance Criteria:**
  - [ ] `AuditLog` model: `id` (UUID), `actor_user_id`, `action` (choices: prescription_issued/record_uploaded/record_deleted/doctor_approved/doctor_rejected/doctor_suspended), `target_model`, `target_id`, `metadata` (JSONField — no PHI), `created_at`
  - [ ] Django `post_save` signals registered for: Prescription, HealthRecord, DoctorProfile status changes; each signal writes AuditLog entry
  - [ ] PHI log filter: custom `LogFilter` that redacts any key matching `# PHI`-annotated field names before JSON log output
  - [ ] `python-json-logger` configured in settings; all log output in JSON format with `timestamp`, `level`, `service`, `request_id`, `user_id_hashed`, `message`
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-092 — OpenAPI Schema & drf-spectacular Setup
- **Type:** backend
- **Story Points:** 1
- **Parent Story:** (cross-cutting)
- **Sprint:** Sprint 4
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** —
- **Blocked By:** TASK-013
- **Acceptance Criteria:**
  - [ ] `drf-spectacular` installed and configured in settings
  - [ ] `GET /api/schema/` returns valid OpenAPI 3.0 YAML spec
  - [ ] All DRF views have schema annotations (operation IDs, response schemas)
  - [ ] CI test: `python manage.py spectacular --validate` passes with 0 errors
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** GET /api/schema/

---

## EPIC-014: Testing & Quality Gates

### TASK-095 — E2E Test Suite: Patient Booking Flow (Cypress/Playwright)
- **Type:** test
- **Story Points:** 5
- **Parent Story:** US-001, US-003, US-005, US-006, US-007
- **Sprint:** Sprint 8
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** —
- **Blocked By:** TASK-014, TASK-022, TASK-023, TASK-024, TASK-032, TASK-033, TASK-037
- **Acceptance Criteria:**
  - [ ] E2E test: new patient OTP registration → specialty search → doctor profile → slot selection → booking confirmation → email confirmation
  - [ ] E2E test: returning patient login → view My Appointments → cancel appointment (within window)
  - [ ] E2E test: slot conflict (two users, same slot) → one succeeds, one sees error
  - [ ] Tests run against staging environment with seeded test data
  - [ ] Tests integrated in CI (run on PRs to `develop` branch)
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-096 — E2E Test Suite: Doctor Consultation & Prescription Flow
- **Type:** test
- **Story Points:** 5
- **Parent Story:** US-013, US-017, US-018, US-019
- **Sprint:** Sprint 8
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** —
- **Blocked By:** TASK-015, TASK-038, TASK-051, TASK-052, TASK-054
- **Acceptance Criteria:**
  - [ ] E2E test: doctor OTP login → dashboard → start consultation → write notes (all 5 fields) → issue prescription → appointment = Completed
  - [ ] E2E test: patient receives prescription email (SendGrid sandbox) → opens prescription view → downloads PDF
  - [ ] E2E test: PDF contains all required fields per FR-RX-003
  - [ ] Tests run against staging with real WeasyPrint (validates NFR-PE-004)
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-097 — Frontend Component Test Suite (Vitest, 90% Coverage)
- **Type:** test
- **Story Points:** 5
- **Parent Story:** (cross-cutting)
- **Sprint:** Sprint 8
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** —
- **Blocked By:** TASK-014, TASK-015, TASK-022, TASK-023, TASK-024, TASK-032, TASK-033, TASK-037, TASK-038, TASK-051, TASK-052, TASK-054, TASK-082
- **Acceptance Criteria:**
  - [ ] Vitest unit tests for all screen components: OTP input component (6-box, focus management), booking flow validation, consultation form validation, prescription medicine row add/remove, file upload validation
  - [ ] Zustand authStore tests: setAuth, clearAuth, role checks
  - [ ] Axios interceptor tests: 401 redirect, Bearer token injection
  - [ ] Coverage ≥ 90% measured by `@vitest/coverage-v8`
  - [ ] `npm run test` passes in CI
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-098 — Performance Load Test (k6 / Locust — 500 CCU, P95 ≤ 200ms)
- **Type:** test
- **Story Points:** 3
- **Parent Story:** (NFR-PE-001, NFR-PE-006)
- **Sprint:** Sprint 9
- **Status:** ⬜ Pending
- **Assignee:** Full-stack Lead
- **Blocks:** —
- **Blocked By:** TASK-006, TASK-031, TASK-070
- **Acceptance Criteria:**
  - [ ] k6 or Locust load test script targeting staging ECS environment
  - [ ] Test scenarios: doctor search (most frequent), appointment booking, slot list view
  - [ ] 500 concurrent users sustained for 5 minutes
  - [ ] P95 API response time ≤ 200ms confirmed and documented
  - [ ] If P95 > 200ms: document bottleneck and escalate before production deployment
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-099 — Security Review: PHI Log Audit & OWASP Scan
- **Type:** test
- **Story Points:** 3
- **Parent Story:** (NFR-SEC-011, NFR-SEC-010)
- **Sprint:** Sprint 9
- **Status:** ⬜ Pending
- **Assignee:** Full-stack Lead
- **Blocks:** —
- **Blocked By:** TASK-091, TASK-070, TASK-081
- **Acceptance Criteria:**
  - [ ] Automated PHI scan: CI script greps application logs for known PHI field names (chief_complaint, diagnosis, full_name, date_of_birth, email); test fails if any match found in log output
  - [ ] OWASP ZAP baseline scan run against staging API (`/api/v1/`)
  - [ ] ZAP medium/high severity findings reviewed; critical findings resolved before production
  - [ ] SSL Labs scan on staging domain: Grade A minimum confirmed
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-100 — Accessibility Audit (WCAG 2.1 AA, axe-core)
- **Type:** test
- **Story Points:** 2
- **Parent Story:** (NFR-USE-002)
- **Sprint:** Sprint 9
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** —
- **Blocked By:** TASK-022, TASK-023, TASK-024, TASK-037
- **Acceptance Criteria:**
  - [ ] axe-core automated scan integrated in CI (Vitest or Playwright accessibility checks)
  - [ ] All public pages (SCR-001, SCR-002, SCR-003) pass WCAG 2.1 AA with zero critical violations
  - [ ] Auth pages (SCR-006, SCR-010) pass with zero critical violations
  - [ ] Manual keyboard navigation tested on booking flow (Tab, Enter, Escape)
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

---

## Additional Backend Tasks

### TASK-101 — Structured Logging Middleware & RequestId
- **Type:** backend
- **Story Points:** 1
- **Parent Story:** (NFR-MAIN-003)
- **Sprint:** Sprint 3
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** TASK-099
- **Blocked By:** TASK-007
- **Acceptance Criteria:**
  - [ ] `RequestIdMiddleware`: injects `X-Request-ID` header (UUID) into every request; adds to logging context
  - [ ] All Django log output in JSON format via `python-json-logger`: fields `timestamp`, `level`, `service`, `request_id`, `user_id_hashed`, `message`
  - [ ] `user_id_hashed`: SHA-256 of raw user_id before logging; never log raw user_id
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-102 — Shared UI Component Library (Navigation, Buttons, Cards, Badges)
- **Type:** frontend
- **Story Points:** 3
- **Parent Story:** (foundational frontend)
- **Sprint:** Sprint 2
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** TASK-014, TASK-022, TASK-023, TASK-024, TASK-037, TASK-038
- **Blocked By:** TASK-008
- **Acceptance Criteria:**
  - [ ] `frontend/components/ui/`: Button (primary/secondary/danger variants, loading state), Card, Badge (color variants: teal/green/red/gray), Input (text, with error state), Textarea, Select, Modal (confirmation), Toast notification
  - [ ] `frontend/components/ui/Navbar.tsx`: Public nav (logo, Find Doctors, For Doctors, Login); Patient nav (Find Doctors, My Appointments, My Records, Avatar); Doctor nav (Dashboard, Availability, Profile, Avatar)
  - [ ] All components: TypeScript props, desktop-first Tailwind styling, responsive at 768px and 375px
  - [ ] All components covered by Vitest snapshot/unit tests
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-103 — Route Guards & Auth Layout Wrappers
- **Type:** frontend
- **Story Points:** 2
- **Parent Story:** (foundational frontend)
- **Sprint:** Sprint 2
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** TASK-037, TASK-038, TASK-051, TASK-052, TASK-054, TASK-082
- **Blocked By:** TASK-008
- **Acceptance Criteria:**
  - [ ] `PatientLayout`: wraps `(patient)` route group; checks `authStore.role === 'patient'`; redirects to `/auth/patient` if not authenticated
  - [ ] `DoctorLayout`: wraps `(doctor)` route group; checks `authStore.role === 'doctor'` and doctor account is approved/trial; redirects to `/auth/doctor` if not; redirects to subscription page if payment suspended (402)
  - [ ] Public layout: no auth check; renders public nav
  - [ ] `return_url` parameter preserved through auth redirect and restored after successful login
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-104 — Zod API Schemas & TypeScript Types
- **Type:** frontend
- **Story Points:** 2
- **Parent Story:** (foundational frontend)
- **Sprint:** Sprint 3
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** TASK-014, TASK-015, TASK-022, TASK-024
- **Blocked By:** TASK-008
- **Acceptance Criteria:**
  - [ ] `frontend/lib/schemas/`: Zod schemas for: `OTPRequestSchema`, `OTPVerifySchema`, `PatientProfileSchema`, `DoctorRegistrationSchema`, `BookingSchema`, `ConsultationNoteSchema`, `PrescriptionSchema`
  - [ ] TypeScript types inferred from all Zod schemas (`z.infer<>`)
  - [ ] API response types defined: `DoctorSearchResult`, `AppointmentDetail`, `ConsultationNote`, `Prescription`, `HealthRecord`
  - [ ] All schemas used in React Hook Form + `@hookform/resolvers/zod` integrations
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** —
- **API Ref:** —

### TASK-105 — Admin Approval Queue Frontend (SCR-016 — Django Admin)
- **Type:** backend
- **Story Points:** 2
- **Parent Story:** US-022, US-023, US-024
- **Sprint:** Sprint 3
- **Status:** ⬜ Pending
- **Assignee:** Backend Dev
- **Blocks:** —
- **Blocked By:** TASK-018
- **Acceptance Criteria:**
  - [ ] Django admin panel accessible at `/admin/` (Django default)
  - [ ] `DoctorProfile` admin list view matches SCR-016 layout: table with Name, Specialty, MCI Number, City, Submitted date, Status
  - [ ] Custom admin actions functional: Approve, Reject (modal for reason), Suspend, Reactivate
  - [ ] Credential document shown as clickable pre-signed URL in detail view (1-hour expiry)
  - [ ] Filter by status; search by name and MCI number
  - [ ] All 4 wireframe states covered by Django admin default behavior (loading, empty queue message, error via Django messages framework)
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** docs/visuals/ux/SCR-016-admin-doctor-approval/
- **API Ref:** —

### TASK-106 — Doctor Appointment Reminder Banner & Subscription Trial Logic (Frontend)
- **Type:** frontend
- **Story Points:** 2
- **Parent Story:** US-025
- **Sprint:** Sprint 7
- **Status:** ⬜ Pending
- **Assignee:** Frontend Dev
- **Blocks:** —
- **Blocked By:** TASK-044, TASK-038
- **Acceptance Criteria:**
  - [ ] Trial banner component: shown on SCR-011 (doctor dashboard) when subscription status = trial AND days_remaining ≤ 25; "Free trial: X days remaining. Subscribe to continue." with "Subscribe" CTA
  - [ ] Banner hidden when status = active
  - [ ] 402 response handling: `DoctorLayout` catches 402 → redirects to subscription page with "Your subscription is inactive. Please update your payment." message
  - [ ] Subscription page shows "Manage Subscription via Razorpay" button that opens Razorpay checkout
- **Definition of Done:** All DoD items checked (refs DEFINITION-OF-DONE.md)
- **Wireframe Ref:** docs/visuals/ux/SCR-015-doctor-profile-settings/
- **API Ref:** GET /api/v1/doctor/profile/

---

## Sprint Summary Table

| Sprint | Goal | Tasks | SP Committed | Capacity |
|--------|------|-------|-------------|---------|
| Sprint 1 | Foundation: monorepo, Docker, CI, auth models | TASK-001,002,003,004,007,008,009,010,011,012,013 | 24 SP | 24 SP |
| Sprint 2 | Auth screens + doctor registration + CDK + search backend | TASK-005,006,014,015,016,017,018,019,020,021,026,027,030,091,102,103 | 45 SP → split across sprints | 30 SP |
| Sprint 3 | Search frontend + booking backend + admin + notifications setup | TASK-022,023,024,025,028,031,035,036,040,041,101,104,105 | 30 SP | 30 SP |
| Sprint 4 | Booking frontend + consultation model + patient dashboard | TASK-029,032,033,034,037,039,050,060,080,092 | 25 SP | 25 SP |
| Sprint 5 | Consultation frontend + prescription backend + records backend | TASK-038,051,052,053,070,054,081 | 28 SP | 28 SP |
| Sprint 6 | Health records frontend + notifications + audit + subscription model | TASK-042,043,044,047,055,082,083,090 | 24 SP | 24 SP |
| Sprint 7 | Subscription integration (Razorpay) + doctor profile screen | TASK-045,046,048,106 | 14 SP | 14 SP |
| Sprint 8 | E2E tests + frontend component tests | TASK-095,096,097 | 15 SP | 15 SP |
| Sprint 9 | Load test + security audit + accessibility | TASK-098,099,100 | 8 SP | 8 SP |
| Sprint 10 | CD pipeline + staging deployment + hardening | TASK-005,006 remaining, staging deployment, documentation | 12 SP | 12 SP |
| Sprint 11 | Buffer / launch readiness / remediation | Carry-over, bug fixes, launch checklist | Buffer | 24 SP |
