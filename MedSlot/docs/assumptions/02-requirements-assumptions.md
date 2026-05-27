# Requirements Engineering — Assumption Log

**Phase:** 02 — Requirements Engineering
**Agent:** 02_requirements_agent.md
**Generated:** 2026-05-25
**Session:** MedSlot Phase 2 — initial requirements specification; all Phase 1 ideation artifacts available

---

## Tier 3 Inferences Made This Phase

| ID | Inference | Basis | Confidence | Must Validate Before Phase |
|----|-----------|-------|------------|---------------------------|
| A-02-001 | Prescription pre-signed S3 URL validity period = 7 days; on-demand regeneration via patient My Appointments view | Confirmed as Tier 2 suggestion by user in Phase 2 gap scan (2026-05-25) | High — user confirmed | Phase 7 — implementation (S3 URL expiry configuration) |
| A-02-002 | Razorpay Subscriptions (not Razorpay payment gateway) is used for MedSlot's doctor subscription billing; webhook lifecycle events govern subscription status | Confirmed as Tier 1 answer by user in Phase 2 gap scan (2026-05-25) | High — user confirmed | Phase 4 (Architecture) — Razorpay Subscriptions API design; Phase 7 — integration testing |
| A-02-003 | Doctor trial period = 30 days from account approval date; platform-managed (not Razorpay trial) | Inferred from FEASIBILITY-REPORT.md recommendation of 30-60 day trial; 30 days adopted as confirmed standard | Medium | Phase 7 — implementation (trial expiry logic in DoctorSubscription model) |
| A-02-004 | Patient cancellation window = 2 hours before appointment start | Confirmed as Tier 1 follow-up answer by user (A.b) in Phase 2 gap scan (2026-05-25) | High — user confirmed | Phase 7 — integration test (boundary test at T-2h±1min) |
| A-02-005 | Appointment reminder email is sent 24 hours (±15 minutes) before appointment start; ±15 minutes tolerance accounts for scheduled job execution timing | Inferred from FR-NOTIF-006 and standard scheduled email practice; tolerance based on industry norm for scheduler jitter | Medium-High | Phase 7 — scheduled job implementation; test job execution timing |
| A-02-006 | Fixed specialty taxonomy confirmed at 13 specialties: General Physician, Dermatologist, Cardiologist, Orthopedist, Gynecologist & Obstetrics, Pediatrician, ENT Specialist, Ophthalmologist, Psychiatrist, Dentist, Neurologist, Diabetologist, General Surgeon | Confirmed as Tier 2 suggestion by user in Phase 2 gap scan (2026-05-25) | High — user confirmed | Phase 7 — database seed (Specialty table); any change requires BR-030 governance |
| A-02-007 | Three appointment outcome states: Completed (via prescription issuance), No-Show (doctor mark), Cancelled (patient or doctor action) | Confirmed as Tier 2 suggestion by user in Phase 2 gap scan (2026-05-25) | High — user confirmed | Phase 7 — appointment state machine implementation |
| A-02-008 | Location model for doctor discovery: city + area/locality text fields; patient filters by city; no GPS or map integration | Confirmed as Tier 2 suggestion by user in Phase 2 gap scan (2026-05-25) | High — user confirmed | Phase 4 (Architecture) — no map service in tech stack |
| A-02-009 | PDF generation is asynchronous (queued job, not synchronous on HTTP request) to meet the ≤ 4s end-to-end target and prevent request timeout | Inferred from NFR-PE-004 (4s P95 target) combined with WeasyPrint rendering time characteristics; synchronous generation on an HTTP request would risk timeout under load | Medium-High | Phase 4 (Architecture) — async job queue design; Phase 7 — ECS task allocation for PDF worker |
| A-02-010 | Appointment reminder emails are triggered by a scheduled background job (cron/celery beat), not by a real-time event at booking time | Inferred from the nature of "send 24h before appointment" — this requires either a per-booking delayed task or a polling scheduler; polling scheduler (cron) is chosen as the simpler implementation given 3-developer team | Medium | Phase 4 (Architecture) — Celery Beat or equivalent scheduler design |
| A-02-011 | Admin panel is implemented using Django's built-in admin framework (extended/customised) rather than a custom-built React frontend | Inferred from FEASIBILITY-REPORT.md schedule mitigation: "Build admin panel as a thin Django admin view" to reduce frontend time budget | Medium | Phase 4 (Architecture) — confirm admin tool approach; Phase 7 — Sprint 1 admin panel task |
| A-02-012 | Soft delete for health records retains the S3 object permanently; database record is flagged `deleted=True` and excluded from patient listing queries | Inferred from BR-022 (10-year retention) — physical S3 deletion would violate retention; soft delete is the standard compliant pattern | High | Phase 7 — health record deletion implementation |
| A-02-013 | Razorpay Subscriptions integration requires processing at minimum these webhook events: subscription.activated, subscription.charged (payment failed), subscription.cancelled | Inferred from Razorpay Subscriptions API documentation; these three events cover all subscription lifecycle states required by FR-SUB-003 through FR-SUB-005 | Medium-High | Phase 7 — Razorpay webhook handler implementation; integration testing |
| A-02-014 | OTP rate limit (5 per phone per 60 minutes) is enforced using Redis — TTL-based counter per phone number key | Inferred from Redis being in the declared tech stack (CLAUDE.md); Redis TTL-based rate limiting is the standard implementation pattern for OTP rate limiting in Django | High | Phase 7 — Redis rate limiting implementation in auth endpoints |

---

## Open Flags (Tier 2 — Confirmed Suggestions)

| Flag ID | Suggestion Made | User Response | Status |
|---------|----------------|---------------|--------|
| F-02-001 | Prescription pre-signed URL = 7-day expiry | Confirmed: YES | ✅ Resolved |
| F-02-002 | Doctor specialty = fixed list of 13 specialties | Confirmed: YES | ✅ Resolved |
| F-02-003 | No-show handling = 3 outcome states | Confirmed: YES | ✅ Resolved |
| F-02-004 | Location = city + area text; no GPS | Confirmed: YES | ✅ Resolved |

---

## Critical Note: Razorpay Subscription Integration

**Context:** The user confirmed in Phase 2 that Razorpay Subscriptions is used for MedSlot's doctor subscription billing. This was NOT in the original CLAUDE.md tech stack table. The original CLAUDE.md had "Payment: Razorpay for consultation fee collection" which was retracted in Phase 1. The Phase 2 confirmation introduces a new, distinct Razorpay use case: recurring subscription billing from doctors to MedSlot.

**Impact on CLAUDE.md:** Technology Stack table must be updated in Post-Phase Writes to add Razorpay Subscriptions as a new entry, with a clear note distinguishing it from consultation fee processing (which remains out of scope).

**Impact on Architecture (Phase 4):** The architecture agent must design:
- Razorpay Subscription plan creation flow
- Webhook receiver endpoint with HMAC validation
- DoctorSubscription model to store subscription_id, status, trial_expiry
- Idempotency handling for Razorpay webhooks

---

## Resolution Log

| ID | Original Assumption | Resolution | Resolved By | Date |
|----|--------------------|-----------|-----------:|------|
| A-02-001 | Prescription URL expiry = ? | 7-day expiry with on-demand regeneration | User (Phase 2 gap scan) | 2026-05-25 |
| A-02-002 | Subscription billing mechanism = ? | Razorpay Subscriptions (new tech stack entry) | User (Phase 2 gap scan) | 2026-05-25 |
| A-02-003 | Trial period duration = ? | 30 days from approval date | Inferred from Phase 1 feasibility report | 2026-05-25 |
| A-02-004 | Cancellation window = ? | 2 hours before appointment start | User (Phase 2 gap scan follow-up) | 2026-05-25 |
| A-02-006 | Specialty taxonomy = fixed or free text? | Fixed list of 13 specialties | User (Phase 2 gap scan) | 2026-05-25 |
| A-02-007 | Appointment outcomes = ? | Completed / No-Show / Cancelled | User (Phase 2 gap scan) | 2026-05-25 |
| A-02-008 | Location model = GPS or text? | City + area text; no GPS | User (Phase 2 gap scan) | 2026-05-25 |
