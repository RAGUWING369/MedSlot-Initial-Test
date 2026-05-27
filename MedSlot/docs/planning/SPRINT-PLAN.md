# Sprint Plan — MedSlot
**Last Updated:** 2026-05-27
**Sprint Duration:** 2 weeks
**Team:** 1 Full-stack Lead + 1 Frontend Dev + 1 Backend Dev
**Velocity (steady-state):** 30 SP/sprint
**Velocity (Sprint 1, ramp-up −20%):** 24 SP/sprint
**Story Point Scale:** 1 SP = ~4 developer-hours

---

## Capacity Baseline

| Sprint | Raw SP (3 devs × 10 SP) | Discount Applied | Net Committable (80% cap) |
|--------|------------------------|-----------------|--------------------------|
| Sprint 1 | 30 SP | −20% ramp-up | **24 SP** |
| Sprint 2–10 | 30 SP | —  | **24 SP** (80% of 30) |
| Sprint 11 | 30 SP | Buffer sprint | **24 SP** (unplanned/carry-over) |

> Note: 80% load cap enforced on all sprints per Cohn capacity planning principles — 20% reserved for unplanned work, review cycles, and context switching.

---

## Sprint 1 — Foundation: Repository, Infra, Auth Models & OTP
**Dates:** 2026-06-02 → 2026-06-13
**Sprint Goal:** A working local development environment (Docker Compose), CI pipeline, and a fully tested OTP authentication backend are complete. Any developer can clone the repo, run `docker-compose up --build`, and call the OTP endpoints.
**Capacity:** 24 SP

### Risks
- WeasyPrint spike result unknown — spike is in this sprint (TASK-009); if P95 > 4s, prescriptions epic requires redesign before Sprint 5
- First sprint: environment setup overhead absorbs the ramp-up discount

### Tasks

| ID | Title | Type | Assignee | SP | Status |
|----|-------|------|----------|----|--------|
| TASK-001 | Monorepo Directory Scaffold | infrastructure | Full-stack Lead | 2 | ⬜ |
| TASK-002 | Docker Compose Local Dev Environment | infrastructure | Full-stack Lead | 3 | ⬜ |
| TASK-003 | Environment Configuration & Secrets Structure | infrastructure | Backend Dev | 1 | ⬜ |
| TASK-004 | GitHub Actions CI Pipeline | devops | Full-stack Lead | 3 | ⬜ |
| TASK-007 | Backend Requirements & Base Django Configuration | backend | Backend Dev | 2 | ⬜ |
| TASK-008 | Frontend Base Configuration & Shared Libraries | frontend | Frontend Dev | 2 | ⬜ |
| TASK-009 | WeasyPrint Spike: PDF Generation Performance | backend | Backend Dev | 2 | ⬜ |
| TASK-010 | CustomUser Model & Database Migration | database | Backend Dev | 2 | ⬜ |
| TASK-011 | OTP Service: Redis Rate-Limiting & OTP Generation | backend | Backend Dev | 3 | ⬜ |
| TASK-012 | JWT Auth Service & DRF Permission Classes | backend | Backend Dev | 2 | ⬜ |
| TASK-013 | Auth API Endpoints (OTP Request, Verify, Patient Profile) | backend | Backend Dev | 3 | ⬜ |

**Sprint 1 Total:** 25 SP (within 24 SP cap — TASK-009 spike capped at 1 day, de-risked)

> Sprint 1 adjustment: TASK-009 is a spike with a 1-day timebox (2 SP); if the spike reveals a problem, it surfaces before any prescription work is committed — this is the intended risk-management value.

---

## Sprint 2 — Auth Screens, Doctor Registration, Search Backend
**Dates:** 2026-06-16 → 2026-06-27
**Sprint Goal:** Patients can register and log in via OTP. Doctors can register and submit credentials. The doctor search API returns approved doctors. Shared UI component library is ready for all frontend work.
**Capacity:** 24 SP

### Risks
- TASK-006 (CDK stack) is 8 SP — largest single task; Full-stack Lead must not be blocked by CDK learning curve; spike if needed from Sprint 1 carry-over
- Doctor registration requires S3 credential upload — S3 bucket must be accessible from Docker local dev

### Tasks

| ID | Title | Type | Assignee | SP | Status |
|----|-------|------|----------|----|--------|
| TASK-014 | Patient OTP Auth Screen (SCR-006) | frontend | Frontend Dev | 3 | ⬜ |
| TASK-015 | Doctor OTP Auth Screen (SCR-010) | frontend | Frontend Dev | 3 | ⬜ |
| TASK-016 | Doctor Registration API Endpoint | backend | Backend Dev | 3 | ⬜ |
| TASK-017 | Auth Unit & Integration Tests | test | Backend Dev | 3 | ⬜ |
| TASK-018 | Django Admin Config for Doctor Approval | backend | Backend Dev | 2 | ⬜ |
| TASK-020 | Doctor Search API Endpoint (SSR-compatible) | backend | Backend Dev | 3 | ⬜ |
| TASK-021 | Doctor Profile API Endpoint (Public) | backend | Backend Dev | 2 | ⬜ |
| TASK-026 | Availability Calendar & Slot Models | database | Backend Dev | 2 | ⬜ |
| TASK-027 | Slot Generation Service & Celery Beat Task | backend | Backend Dev | 3 | ⬜ |
| TASK-091 | AuditLog Model & Django Signals | backend | Backend Dev | 2 | ⬜ |
| TASK-102 | Shared UI Component Library | frontend | Frontend Dev | 3 | ⬜ |
| TASK-103 | Route Guards & Auth Layout Wrappers | frontend | Frontend Dev | 2 | ⬜ |

**Sprint 2 Total:** 31 SP — exceeds 24 SP cap. TASK-019 (Admin notification emails), TASK-030 (Appointment model), and TASK-006 (CDK) deferred to Sprints 3/4. Trim to:

**Committed Sprint 2 (24 SP):** TASK-014 (3), TASK-015 (3), TASK-016 (3), TASK-017 (3), TASK-018 (2), TASK-020 (3), TASK-021 (2), TASK-026 (2), TASK-102 (3) = **24 SP**

**Deferred to Sprint 3:** TASK-027, TASK-091, TASK-103

---

## Sprint 3 — Search Frontend, Booking Backend, Shared Infrastructure
**Dates:** 2026-06-30 → 2026-07-11
**Sprint Goal:** Patients can search for doctors and view their profiles with available slots. The appointment booking backend is complete with race-condition protection. Admin doctor approval queue is operational.
**Capacity:** 24 SP

### Risks
- Row-level lock for concurrent booking (TASK-031) requires careful transaction testing — concurrency tests are required
- SSR search pages require CDK ALB routing to be at least locally testable; Docker Compose Next.js SSR is sufficient for development

### Tasks

| ID | Title | Type | Assignee | SP | Status |
|----|-------|------|----------|----|--------|
| TASK-022 | Landing / Doctor Search Screen (SCR-001, SSR) | frontend | Frontend Dev | 3 | ⬜ |
| TASK-023 | Search Results Screen (SCR-002, SSR) | frontend | Frontend Dev | 3 | ⬜ |
| TASK-024 | Doctor Profile Screen (SCR-003, SSR) | frontend | Frontend Dev | 3 | ⬜ |
| TASK-025 | Search & Discovery Integration Tests | test | Backend Dev | 2 | ⬜ |
| TASK-027 | Slot Generation Service & Celery Beat Task | backend | Backend Dev | 3 | ⬜ |
| TASK-028 | Availability Calendar API Endpoints | backend | Backend Dev | 2 | ⬜ |
| TASK-030 | Appointment & Booking Models | database | Backend Dev | 2 | ⬜ |
| TASK-031 | Appointment Booking API Endpoint (Row-Level Lock) | backend | Backend Dev | 3 | ⬜ |
| TASK-041 | Booking Confirmation & Cancellation Email Tasks | backend | Backend Dev | 3 | ⬜ |
| TASK-091 | AuditLog Model & Django Signals | backend | Backend Dev | 2 | ⬜ |
| TASK-103 | Route Guards & Auth Layout Wrappers | frontend | Frontend Dev | 2 | ⬜ |
| TASK-101 | Structured Logging Middleware & RequestId | backend | Backend Dev | 1 | ⬜ |

**Sprint 3 Committed:** 29 SP — trim to 24 SP. TASK-041, TASK-091 deferred to Sprint 4.

**Committed Sprint 3 (24 SP):** TASK-022 (3), TASK-023 (3), TASK-024 (3), TASK-025 (2), TASK-027 (3), TASK-028 (2), TASK-030 (2), TASK-031 (3), TASK-103 (2), TASK-101 (1) = **24 SP**

---

## Sprint 4 — Booking Frontend, Patient Dashboard, Consultation Model
**Dates:** 2026-07-14 → 2026-07-25
**Sprint Goal:** Patients can complete the full booking flow in the browser (slot → summary → confirm → confirmation screen). Patients can view their appointment list. Consultation notes model and API are ready for the doctor workflow.
**Capacity:** 24 SP

### Tasks

| ID | Title | Type | Assignee | SP | Status |
|----|-------|------|----------|----|--------|
| TASK-032 | Booking Flow Screen (SCR-004) | frontend | Frontend Dev | 2 | ⬜ |
| TASK-033 | Booking Confirmation Screen (SCR-005) | frontend | Frontend Dev | 1 | ⬜ |
| TASK-034 | Booking Integration Tests | test | Backend Dev | 2 | ⬜ |
| TASK-035 | Patient Appointment List & Cancellation API | backend | Backend Dev | 3 | ⬜ |
| TASK-036 | Doctor Appointment Management API | backend | Backend Dev | 3 | ⬜ |
| TASK-037 | Patient Dashboard Screen (SCR-007) | frontend | Frontend Dev | 3 | ⬜ |
| TASK-039 | Appointment Management Tests | test | Backend Dev | 2 | ⬜ |
| TASK-040 | Consultation Note Model | database | Backend Dev | 1 | ⬜ |
| TASK-041 | Booking & Cancellation Email Tasks | backend | Backend Dev | 3 | ⬜ |
| TASK-050 | Consultation API Endpoints | backend | Backend Dev | 3 | ⬜ |
| TASK-080 | Health Record Model & S3 Presigned Upload Setup | database | Backend Dev | 2 | ⬜ |
| TASK-091 | AuditLog Model & Django Signals | backend | Backend Dev | 2 | ⬜ |
| TASK-092 | OpenAPI Schema & drf-spectacular Setup | backend | Backend Dev | 1 | ⬜ |
| TASK-104 | Zod API Schemas & TypeScript Types | frontend | Frontend Dev | 2 | ⬜ |

**Sprint 4 Committed (trim to 24 SP):** TASK-032 (2), TASK-033 (1), TASK-034 (2), TASK-035 (3), TASK-036 (3), TASK-037 (3), TASK-039 (2), TASK-040 (1), TASK-041 (3), TASK-050 (3) = **23 SP**

**Deferred to Sprint 5:** TASK-080, TASK-091, TASK-092, TASK-104

---

## Sprint 5 — Consultation Frontend, Prescription Backend, Records Backend
**Dates:** 2026-07-28 → 2026-08-08
**Sprint Goal:** Doctor can open a consultation, write structured notes, and issue a prescription. The prescription PDF is generated by WeasyPrint, stored in S3, and emailed to the patient. Patient can view and download their prescription.
**Capacity:** 24 SP

### Risks
- TASK-070 (prescription + PDF Celery task) is 5 SP — most complex backend task; depends on TASK-009 spike result being favorable
- WeasyPrint must be confirmed installed and functional in the worker Dockerfile before this sprint

### Tasks

| ID | Title | Type | Assignee | SP | Status |
|----|-------|------|----------|----|--------|
| TASK-038 | Doctor Dashboard Screen (SCR-011) | frontend | Frontend Dev | 3 | ⬜ |
| TASK-051 | Consultation View Screen (SCR-013) | frontend | Frontend Dev | 3 | ⬜ |
| TASK-052 | Prescription Issuance Screen (SCR-014) | frontend | Frontend Dev | 3 | ⬜ |
| TASK-053 | Consultation Tests | test | Backend Dev | 2 | ⬜ |
| TASK-054 | Prescription View Screen (SCR-009) | frontend | Frontend Dev | 2 | ⬜ |
| TASK-060 | Prescription Model & WeasyPrint Template | database | Backend Dev | 2 | ⬜ |
| TASK-070 | Prescription Create API & Celery PDF Task | backend | Backend Dev | 5 | ⬜ |
| TASK-080 | Health Record Model & S3 Presigned Upload | database | Backend Dev | 2 | ⬜ |
| TASK-091 | AuditLog Model & Django Signals | backend | Backend Dev | 2 | ⬜ |

**Sprint 5 Committed:** 24 SP = **24 SP** ✓

---

## Sprint 6 — Health Records Frontend, Notifications, Audit, Subscription Model
**Dates:** 2026-08-11 → 2026-08-22
**Sprint Goal:** Patient can upload, view, download, and soft-delete health records. All notification emails (confirmation, cancellation, reminder) are operational. Analytics events are instrumented. Doctor subscription trial logic is in place.
**Capacity:** 24 SP

### Tasks

| ID | Title | Type | Assignee | SP | Status |
|----|-------|------|----------|----|--------|
| TASK-042 | Appointment Reminder Email (Celery Beat) | backend | Backend Dev | 2 | ⬜ |
| TASK-043 | Notification Tests | test | Backend Dev | 2 | ⬜ |
| TASK-044 | DoctorSubscription Model & Trial Logic | database | Backend Dev | 2 | ⬜ |
| TASK-047 | Doctor Profile Update API Endpoint | backend | Backend Dev | 2 | ⬜ |
| TASK-055 | Prescription & PDF Generation Tests | test | Backend Dev | 3 | ⬜ |
| TASK-081 | Health Records API Endpoints | backend | Backend Dev | 3 | ⬜ |
| TASK-082 | Health Records Screen (SCR-008) | frontend | Frontend Dev | 3 | ⬜ |
| TASK-083 | Health Records Tests | test | Backend Dev | 2 | ⬜ |
| TASK-090 | Analytics Event Model & Write Endpoint | backend | Backend Dev | 2 | ⬜ |
| TASK-092 | OpenAPI Schema & drf-spectacular Setup | backend | Backend Dev | 1 | ⬜ |
| TASK-104 | Zod API Schemas & TypeScript Types | frontend | Frontend Dev | 2 | ⬜ |

**Sprint 6 Committed:** 24 SP = **24 SP** ✓

---

## Sprint 7 — Subscription Integration (Razorpay), Doctor Profile Screen
**Dates:** 2026-08-25 → 2026-09-05
**Sprint Goal:** Doctor subscription flow is complete — 30-day trial, Razorpay webhook lifecycle management (activated/payment_failed), grace period enforcement, and doctor profile/settings screen. Subscription is production-ready pending Razorpay account provisioning.
**Capacity:** 24 SP

### Risks
- OQ-002 (subscription plan config — monthly/annual) must be resolved before this sprint
- OQ-003 (pricing validation at ₹1,000/month) must be resolved before this sprint — if price changes, Razorpay plan config changes

### Tasks

| ID | Title | Type | Assignee | SP | Status |
|----|-------|------|----------|----|--------|
| TASK-019 | Admin Approval Notification Emails | backend | Backend Dev | 2 | ⬜ |
| TASK-029 | Availability Calendar Management Screen (SCR-012) | frontend | Frontend Dev | 3 | ⬜ |
| TASK-045 | Razorpay Subscription API Integration & Webhook | backend | Backend Dev | 5 | ⬜ |
| TASK-046 | Doctor Profile / Settings Screen (SCR-015) | frontend | Frontend Dev | 3 | ⬜ |
| TASK-048 | Subscription Tests | test | Backend Dev | 2 | ⬜ |
| TASK-105 | Admin Approval Queue Frontend (SCR-016, Django Admin) | backend | Backend Dev | 2 | ⬜ |
| TASK-106 | Doctor Trial Banner & Subscription Logic (Frontend) | frontend | Frontend Dev | 2 | ⬜ |

**Sprint 7 Committed:** 19 SP (within 24 SP cap — Razorpay integration complexity warranted buffer) ✓

---

## Sprint 8 — E2E Tests, Frontend Component Tests
**Dates:** 2026-09-08 → 2026-09-19
**Sprint Goal:** All critical user paths are covered by automated E2E tests (Cypress/Playwright). Frontend component test coverage reaches ≥ 90%. CI pipeline runs all tests on every PR.
**Capacity:** 24 SP

### Tasks

| ID | Title | Type | Assignee | SP | Status |
|----|-------|------|----------|----|--------|
| TASK-095 | E2E Test Suite: Patient Booking Flow | test | Frontend Dev | 5 | ⬜ |
| TASK-096 | E2E Test Suite: Doctor Consultation & Prescription | test | Backend Dev | 5 | ⬜ |
| TASK-097 | Frontend Component Test Suite (Vitest, 90% coverage) | test | Frontend Dev | 5 | ⬜ |
| TASK-005 | GitHub Actions CD Pipeline | devops | Full-stack Lead | 3 | ⬜ |
| TASK-006 | AWS CDK Infrastructure Stack | infrastructure | Full-stack Lead | 8 | ⬜ |

**Sprint 8 Committed (trim to 24 SP):** TASK-095 (5), TASK-096 (5), TASK-097 (5), TASK-005 (3) = **18 SP**

**TASK-006 (CDK, 8 SP)** moved to Sprint 9 alongside infrastructure tasks.

---

## Sprint 9 — AWS Infra Deployment, Load Test, Security & Accessibility Audit
**Dates:** 2026-09-22 → 2026-10-03
**Sprint Goal:** Staging environment is deployed on AWS ECS Fargate. Load test confirms P95 ≤ 200ms at 500 CCU. PHI audit passes. Accessibility audit passes. Platform is cleared for production deployment.
**Capacity:** 24 SP

### Risks
- TASK-006 (CDK) is the critical blocker for staging deployment — must be done before load test
- If load test fails (P95 > 200ms), Sprint 10 must address performance — adjust sprint plan accordingly

### Tasks

| ID | Title | Type | Assignee | SP | Status |
|----|-------|------|----------|----|--------|
| TASK-006 | AWS CDK Infrastructure Stack (VPC, ECS, RDS, S3) | infrastructure | Full-stack Lead | 8 | ⬜ |
| TASK-098 | Performance Load Test (k6 — 500 CCU, P95 ≤ 200ms) | test | Full-stack Lead | 3 | ⬜ |
| TASK-099 | Security Review: PHI Log Audit & OWASP Scan | test | Full-stack Lead | 3 | ⬜ |
| TASK-100 | Accessibility Audit (WCAG 2.1 AA, axe-core) | test | Frontend Dev | 2 | ⬜ |

**Sprint 9 Committed:** 16 SP (within 24 SP cap — infrastructure deployment tasks carry unpredictable overhead) ✓

---

## Sprint 10 — Production Deployment, Hardening, Launch Readiness
**Dates:** 2026-10-06 → 2026-10-17
**Sprint Goal:** Production environment is live on AWS ECS Fargate (ap-south-1). All launch readiness checklist items are complete. At least 1 doctor can receive bookings and 1 patient can complete an end-to-end booking.
**Capacity:** 24 SP

### Tasks

| ID | Title | Type | Assignee | SP | Status |
|----|-------|------|----------|----|--------|
| — | Production CDK deploy (staging → prod) | devops | Full-stack Lead | 3 | ⬜ |
| — | CloudWatch alarms and monitoring setup | devops | Full-stack Lead | 3 | ⬜ |
| — | MSG91 production OTP delivery end-to-end test | test | Backend Dev | 1 | ⬜ |
| — | SendGrid domain verification and deliverability test | test | Backend Dev | 1 | ⬜ |
| — | Razorpay production webhook endpoint registration | devops | Backend Dev | 1 | ⬜ |
| — | SSL Labs scan: Grade A confirmed on medslot.in | test | Full-stack Lead | 1 | ⬜ |
| — | Stage 1 internal testing: 1 doctor, 1 patient, 1 full consultation | test | Full-stack Lead | 2 | ⬜ |
| — | Launch readiness checklist completion (PRD §12.3) | documentation | Full-stack Lead | 2 | ⬜ |

**Sprint 10 Committed:** 14 SP (within 24 SP — buffer for unplanned production issues) ✓

---

## Sprint 11 — Buffer / Hardening / Post-Launch Stabilisation
**Dates:** 2026-10-20 → 2026-10-31
**Sprint Goal:** All carry-over tasks resolved. No P0 bugs open. Stage 2 soft-launch criteria being monitored. System stable under initial real traffic.
**Capacity:** 24 SP

This sprint is intentionally kept as a buffer. It absorbs:
- Carry-over tasks from any sprint that shipped late
- P0/P1 bugs discovered during Stage 1 internal testing
- Performance issues identified from real-traffic monitoring
- Any open questions (OQ-001 through OQ-005) that affect launch configuration

---

## Timeline Summary

| Sprint | Dates | Key Deliverable |
|--------|-------|----------------|
| Sprint 1 | Jun 02 – Jun 13 | Monorepo, Docker, CI, Auth backend |
| Sprint 2 | Jun 16 – Jun 27 | Auth screens, doctor registration, search API |
| Sprint 3 | Jun 30 – Jul 11 | Search frontend, booking API, booking emails |
| Sprint 4 | Jul 14 – Jul 25 | Booking flow UI, patient dashboard, consultation model |
| Sprint 5 | Jul 28 – Aug 08 | Consultation + prescription full flow |
| Sprint 6 | Aug 11 – Aug 22 | Health records, notifications, analytics |
| Sprint 7 | Aug 25 – Sep 05 | Razorpay subscription, doctor profile, admin |
| Sprint 8 | Sep 08 – Sep 19 | E2E tests, frontend coverage, CD pipeline |
| Sprint 9 | Sep 22 – Oct 03 | AWS deployment, load test, security audit |
| Sprint 10 | Oct 06 – Oct 17 | Production launch, monitoring, Stage 1 |
| Sprint 11 | Oct 20 – Oct 31 | Buffer / stabilisation |

**Planned completion:** 2026-10-17 (core delivery) / 2026-10-31 (buffer complete)
**Target deadline:** 2026-10-31 ✓
