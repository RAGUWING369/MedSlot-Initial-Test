# MedSlot — Product Analytics Plan

**Phase:** 3 — Product Requirements Document
**Version:** 1.0
**Date:** 2026-05-25
**Owner:** Product (MedSlot Ops)
**Reviewed By:** Tech Lead (Phase 4 — confirm implementation approach)

---

## 1. Analytics Philosophy

MedSlot collects behavioural events to measure product performance against the KPIs defined in `docs/ideation/SUCCESS-METRICS.md` and the feature success metrics defined in `docs/prd/PRD.md`. Analytics data is used exclusively for product improvement — not for advertising, third-party data sale, or profiling.

**Architecture decision:** All events are stored in a dedicated `analytics_events` PostgreSQL table. No third-party analytics SDK (Mixpanel, Amplitude, Segment, GA4) is used in v1. Events are written server-side on significant state changes and client-side for UX funnel steps. This avoids third-party data sharing and keeps implementation within the existing stack.

**PII handling:** Analytics events must never contain PHI (BR-019). The `user_id` (UUID) is the only user identifier stored in events. Event properties may contain: specialty name, city name, appointment date (not time), slot count, file size — never: patient name, diagnosis, medicine names, prescription content, health record file names.

---

## 2. Event Storage Schema

### `analytics_events` Table

```sql
CREATE TABLE analytics_events (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name    VARCHAR(100) NOT NULL,
    user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id    UUID,                        -- client-generated per browser session
    role          VARCHAR(20),                 -- 'patient' | 'doctor' | 'admin' | null (anonymous)
    properties    JSONB DEFAULT '{}',
    server_ts     TIMESTAMPTZ NOT NULL DEFAULT now(),  -- server-assigned timestamp (UTC)
    client_ts     TIMESTAMPTZ,                -- client-sent timestamp (UTC), nullable
    page_url      TEXT,
    user_agent    TEXT
);

CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_user_id    ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_server_ts  ON analytics_events(server_ts);
CREATE INDEX idx_analytics_events_role       ON analytics_events(role);
```

**Notes:**
- `server_ts` is the authoritative timestamp for all funnel analysis
- `properties` JSONB is the flexible event-specific payload (see event definitions below)
- `user_id` is nullable for anonymous events (pre-login steps of the OTP flow)
- `session_id` links events within a single browser session for funnel analysis

---

## 3. Event Taxonomy

Events are grouped by product area. Each event definition includes: name, trigger, actor, key properties, PII risk rating.

### 3.1 Authentication Events

| Event Name | Trigger | Actor | Properties | PII Risk |
|-----------|---------|-------|-----------|----------|
| `auth.otp_requested` | User submits phone number on login/register form | Patient or Doctor (anonymous) | `role_intent` (patient/doctor), `phone_last3` (last 3 digits only) | Low |
| `auth.otp_verified` | OTP successfully verified | Patient or Doctor | `role`, `is_new_user` (bool) | None |
| `auth.otp_failed` | OTP verification fails | Anonymous | `attempt_count`, `failure_reason` (invalid/expired/locked) | None |
| `auth.otp_resent` | User requests OTP resend | Anonymous | `resend_count` | None |
| `auth.session_expired` | JWT expires while user is active | Patient or Doctor | `role`, `last_action` (event_name) | None |
| `auth.logout` | User explicitly logs out | Patient or Doctor | `role` | None |

### 3.2 Patient Registration Events

| Event Name | Trigger | Actor | Properties | PII Risk |
|-----------|---------|-------|-----------|----------|
| `registration.profile_form_viewed` | New patient sees profile completion form | Patient | — | None |
| `registration.profile_form_submitted` | Patient submits profile form | Patient | `fields_filled` (count), `has_email` (bool) | None |
| `registration.profile_completed` | PatientProfile successfully persisted | Patient | — | None |

### 3.3 Doctor Discovery & Search Events

| Event Name | Trigger | Actor | Properties | PII Risk |
|-----------|---------|-------|-----------|----------|
| `search.page_viewed` | Patient loads the doctor search/discovery page | Patient | `referrer` (home/direct/email) | None |
| `search.filtered` | Patient applies specialty or city filter | Patient | `specialty` (name), `city` (name), `result_count` | None |
| `search.results_empty` | Search returns 0 results | Patient | `specialty`, `city` | None |
| `search.doctor_profile_viewed` | Patient clicks through to a doctor's profile | Patient | `specialty`, `city`, `doctor_id` (UUID) | None |
| `search.slots_viewed` | Patient views the available slot picker on a doctor profile | Patient | `doctor_id`, `available_slot_count`, `days_with_slots` | None |

### 3.4 Appointment Booking Events

| Event Name | Trigger | Actor | Properties | PII Risk |
|-----------|---------|-------|-----------|----------|
| `booking.slot_selected` | Patient selects a time slot | Patient | `doctor_id`, `slot_date` (YYYY-MM-DD only), `slot_time_bucket` (morning/afternoon/evening) | None |
| `booking.summary_viewed` | Patient views the booking summary/confirmation screen | Patient | `doctor_id`, `specialty` | None |
| `booking.confirm_clicked` | Patient clicks "Confirm Booking" | Patient | `doctor_id`, `specialty`, `city` | None |
| `booking.completed` | Appointment record created (status=Scheduled) | Patient | `doctor_id`, `specialty`, `city`, `days_until_appointment` | None |
| `booking.slot_conflict` | Slot already taken during concurrent booking | Patient | `doctor_id` | None |
| `booking.auth_redirect` | Unauthenticated patient redirected to login before booking | Anonymous | `doctor_id` | None |
| `booking.duplicate_blocked` | Booking blocked (patient already has appointment with this doctor on same date) | Patient | `doctor_id` | None |

### 3.5 Appointment Management Events

| Event Name | Trigger | Actor | Properties | PII Risk |
|-----------|---------|-------|-----------|----------|
| `appointment.my_appointments_viewed` | Patient opens My Appointments | Patient | `upcoming_count`, `past_count` | None |
| `appointment.cancel_initiated` | Patient clicks "Cancel" on an appointment | Patient | `days_until_appointment`, `within_window` (bool) | None |
| `appointment.cancel_completed` | Appointment status set to Cancelled by patient | Patient | `days_until_appointment` | None |
| `appointment.cancel_blocked` | Cancel blocked — within 2-hour window | Patient | `minutes_until_appointment` | None |
| `appointment.doctor_cancel_completed` | Doctor cancels an appointment | Doctor | `days_until_appointment` | None |
| `appointment.reminder_email_sent` | 24-hour reminder email dispatched by scheduled job | System | `appointment_id` (internal ref only, not user-visible), `hours_until_appointment` | None |

### 3.6 Doctor Consultation Events

| Event Name | Trigger | Actor | Properties | PII Risk |
|-----------|---------|-------|-----------|----------|
| `consultation.started` | Doctor transitions appointment to In Consultation | Doctor | `appointment_id` (internal ref) | None |
| `consultation.notes_saved` | Doctor saves draft consultation notes | Doctor | `fields_filled` (count: complaint/findings/diagnosis) | None |
| `consultation.prescription_form_opened` | Doctor opens the prescription issuance form | Doctor | — | None |
| `consultation.prescription_issued` | Prescription record persisted, PDF job queued | Doctor | `medicine_count`, `has_instructions` (bool), `has_followup` (bool) | None |
| `consultation.no_show_marked` | Doctor marks appointment as No-Show | Doctor | — | None |
| `consultation.completed` | Appointment status set to Completed | System | — | None |

### 3.7 Prescription PDF Events

| Event Name | Trigger | Actor | Properties | PII Risk |
|-----------|---------|-------|-----------|----------|
| `prescription.pdf_generation_queued` | PDF job enqueued | System | `appointment_id` (internal ref) | None |
| `prescription.pdf_generation_completed` | WeasyPrint successfully generates PDF | System | `generation_time_ms`, `pdf_size_bytes` | None |
| `prescription.pdf_generation_failed` | WeasyPrint fails after retry | System | `error_type`, `retry_count` | None |
| `prescription.pdf_s3_upload_completed` | PDF successfully stored in S3 | System | `pdf_size_bytes` | None |
| `prescription.email_sent` | Prescription delivery email dispatched | System | — | None |
| `prescription.download_link_clicked` | Patient clicks the pre-signed URL in email or from My Appointments | Patient | `days_since_appointment` | None |
| `prescription.presigned_url_regenerated` | Patient regenerates expired pre-signed URL | Patient | `days_since_original_generation` | None |

### 3.8 Health Record Events

| Event Name | Trigger | Actor | Properties | PII Risk |
|-----------|---------|-------|-----------|----------|
| `health_record.upload_initiated` | Patient opens the file upload UI | Patient | — | None |
| `health_record.upload_completed` | Health record persisted in S3 and database | Patient | `file_size_bytes`, `file_type` (extension only — not name) | None |
| `health_record.upload_failed` | Upload fails (file too large, S3 error) | Patient | `failure_reason` (size_exceeded/s3_error), `file_size_bytes` | None |
| `health_record.viewed` | Patient views their health records list | Patient | `record_count` | None |
| `health_record.deleted` | Patient soft-deletes a health record | Patient | — | None |

### 3.9 Doctor Availability Calendar Events

| Event Name | Trigger | Actor | Properties | PII Risk |
|-----------|---------|-------|-----------|----------|
| `availability.calendar_viewed` | Doctor opens Availability Settings | Doctor | `has_existing_config` (bool) | None |
| `availability.calendar_saved` | AvailabilityCalendar successfully saved, slots generated | Doctor | `working_days_count`, `slot_duration_minutes`, `slots_generated_count` | None |
| `availability.calendar_save_failed` | Validation fails (invalid time range) | Doctor | `error_type` | None |
| `availability.date_blocked` | Doctor adds a blocked date | Doctor | `days_until_blocked_date` | None |

### 3.10 Doctor Registration Events

| Event Name | Trigger | Actor | Properties | PII Risk |
|-----------|---------|-------|-----------|----------|
| `doctor_registration.form_viewed` | Doctor lands on registration form | Doctor (anonymous) | — | None |
| `doctor_registration.submitted` | Doctor submits registration form (post-OTP) | Doctor | `specialty` (name), `city` | None |
| `doctor_registration.approved` | Admin approves doctor account | Admin | `days_since_submission` | None |
| `doctor_registration.rejected` | Admin rejects doctor account | Admin | `days_since_submission` | None |
| `doctor_registration.approval_email_opened` | (SendGrid webhook) Approval email opened | System | — | None |

### 3.11 Subscription Events

| Event Name | Trigger | Actor | Properties | PII Risk |
|-----------|---------|-------|-----------|----------|
| `subscription.trial_started` | 30-day trial begins on account approval | System | — | None |
| `subscription.trial_days_remaining` | Daily job — counts trial remaining | System | `days_remaining` | None |
| `subscription.trial_expired` | Trial period ends without active subscription | System | — | None |
| `subscription.activated` | Razorpay webhook: subscription.activated | System | `plan_id` | None |
| `subscription.payment_failed` | Razorpay webhook: subscription.charged (failed) | System | `retry_count` | None |
| `subscription.cancelled` | Razorpay webhook: subscription.cancelled | System | `tenure_days` | None |

---

## 4. Funnel Definitions

### Funnel 1 — Patient Booking Funnel (Primary Conversion)

**Business Goal:** Booking funnel completion ≥ 60% (SUCCESS-METRICS.md)

| Step | Event | Label |
|------|-------|-------|
| 1 | `search.page_viewed` | Search Page Viewed |
| 2 | `search.filtered` | Filters Applied |
| 3 | `search.doctor_profile_viewed` | Doctor Profile Viewed |
| 4 | `search.slots_viewed` | Slots Viewed |
| 5 | `booking.slot_selected` | Slot Selected |
| 6 | `booking.summary_viewed` | Booking Summary Viewed |
| 7 | `booking.confirm_clicked` | Confirm Clicked |
| 8 | `booking.completed` | Booking Completed |

**Conversion denominator:** Step 1 (Search Page Viewed)
**Primary conversion metric:** Step 8 / Step 1
**Step 3→8 sub-funnel:** Measures intent-to-book conversion (patient already chose a doctor)

### Funnel 2 — Doctor Onboarding Funnel

**Business Goal:** Doctor time-to-first-appointment ≤ 7 days (SUCCESS-METRICS.md)

| Step | Event | Label |
|------|-------|-------|
| 1 | `doctor_registration.form_viewed` | Registration Form Viewed |
| 2 | `doctor_registration.submitted` | Registration Submitted |
| 3 | `doctor_registration.approved` | Account Approved |
| 4 | `availability.calendar_saved` | Calendar Configured |
| 5 | `booking.completed` | First Appointment Booked (patient side) |

**Time metric:** `server_ts` delta between Step 3 and Step 5 (days_until_first_appointment)

### Funnel 3 — Consultation Completion Funnel

**Business Goal:** Consultation workflow completion ≥ 70% (SUCCESS-METRICS.md)

| Step | Event | Label |
|------|-------|-------|
| 1 | `consultation.started` | Consultation Started |
| 2 | `consultation.notes_saved` | Notes Saved |
| 3 | `consultation.prescription_form_opened` | Prescription Form Opened |
| 4 | `consultation.prescription_issued` | Prescription Issued |
| 5 | `consultation.completed` | Appointment Completed |

**Conversion denominator:** Step 1 (Consultation Started)
**Completion rate:** Step 5 / Step 1

### Funnel 4 — OTP Registration Funnel

**Business Goal:** OTP registration completion rate ≥ 75% (SUCCESS-METRICS.md)

| Step | Event | Label |
|------|-------|-------|
| 1 | `auth.otp_requested` | OTP Requested |
| 2 | `auth.otp_verified` (is_new_user=true) | OTP Verified (New User) |
| 3 | `registration.profile_completed` | Profile Completed |

**Dropout analysis:** Step 1→2 measures OTP delivery and entry success rate; Step 2→3 measures profile form completion.

---

## 5. Dashboard Specifications

### Dashboard 1 — Executive KPI Dashboard (Weekly)

**Audience:** MedSlot Ops / Product Owner
**Refresh:** Daily (manual query or scheduled report)

| Metric | Source Events | Period |
|--------|--------------|--------|
| Total new patient registrations | `registration.profile_completed` | Week, Month |
| Total appointments booked | `booking.completed` | Week, Month |
| Booking funnel completion % | Funnel 1 | Week |
| Consultation completion % | Funnel 3 | Week |
| Prescription PDF generation success % | `prescription.pdf_generation_completed` / (`prescription.pdf_generation_completed` + `prescription.pdf_generation_failed`) | Week |
| Active paying doctors | `subscription.activated` minus `subscription.cancelled` | Snapshot |
| Trial doctors converting to paid | `subscription.activated` WHERE user had prior `subscription.trial_started` | Month |

### Dashboard 2 — Product Health Dashboard (Daily)

**Audience:** Tech Lead + Product
**Refresh:** Near-real-time (dashboard query)

| Metric | Source Events | Alert Threshold |
|--------|--------------|----------------|
| OTP success rate | `auth.otp_verified` / (`auth.otp_verified` + `auth.otp_failed` where failure_reason=invalid) | < 90% → alert |
| Booking funnel step-by-step drop-off | Funnel 1 step analysis | > 20% single-step drop increase WoW → alert |
| PDF generation P95 time | `prescription.pdf_generation_completed.generation_time_ms` | > 4000ms → alert |
| S3 upload failures | `prescription.pdf_s3_upload_completed` vs queued | Any failure → alert |
| Slot conflict rate | `booking.slot_conflict` / `booking.confirm_clicked` | > 5% → investigate |

### Dashboard 3 — Doctor Engagement Dashboard (Weekly)

**Audience:** MedSlot Ops (retention monitoring)
**Refresh:** Weekly

| Metric | Source Events | Period |
|--------|--------------|--------|
| Doctor weekly active rate | Doctors with ≥1 `consultation.started` in week | Week |
| Avg time to first appointment (from approval) | Funnel 2 step 3→5 delta | Month cohort |
| Calendar setup rate within 48h of approval | `availability.calendar_saved` within 48h of `doctor_registration.approved` | Month cohort |
| No-show rate | `consultation.no_show_marked` / `consultation.started` | Week |
| Prescription download rate | `prescription.download_link_clicked` / `prescription.email_sent` | Week |

---

## 6. PII Handling Rules for Analytics

| Rule | Implementation |
|------|---------------|
| No names in events | `user_id` (UUID) only — never name, email, or phone in properties |
| No PHI in event properties | Diagnosis, medicines, chief complaint, examination findings, health record file names — never in any event property |
| Phone number hashing | `auth.otp_requested` stores only last 3 digits for debugging; full phone number never stored in analytics |
| Appointment date only | `slot_date` properties use YYYY-MM-DD only; appointment time is not recorded in analytics events |
| File type not file name | `health_record.upload_completed.file_type` is the extension (pdf, jpg) — never the file name |
| Doctor identification | `doctor_id` UUID is stored in patient-side events (discovery, booking) as a foreign key — doctor name is never stored in analytics |
| Analytics events excluded from PHI access logs | `analytics_events` table is excluded from the PHI audit log scope defined in NFR-MAIN-003 |

---

## 7. Data Retention for Analytics Events

- Analytics events are retained for **24 months** from `server_ts`.
- After 24 months, events are purged via a scheduled monthly job.
- Purging is logical deletion (DELETE from `analytics_events` WHERE `server_ts` < NOW() - INTERVAL '24 months').
- This retention period is separate from — and shorter than — the 10-year retention requirement for health records (BR-022). The two datasets are not co-mingled.

---

## 8. Implementation Notes (for Phase 4 and Phase 7)

### Server-Side Event Writing
- Backend (Django) writes events to `analytics_events` table directly via the Django ORM on significant state transitions (appointment created, prescription issued, subscription webhooks, etc.).
- Server-side events use `server_ts = now()` authoritative timestamp.
- Events are written synchronously within the same request/transaction for state-change events, and asynchronously (Celery task) for post-processing events (PDF generation, email delivery).

### Client-Side Event Writing
- Next.js frontend sends events to `POST /api/v1/analytics/events` for UX funnel steps (page views, clicks, filter selections).
- Client sends `client_ts` (browser timestamp), `session_id` (generated on session start, stored in sessionStorage), and event properties.
- Endpoint requires authentication for patient/doctor events; anonymous events (pre-login OTP funnel) use a rate-limited unauthenticated endpoint.
- `user_id` is injected server-side from the JWT — client never sends user_id directly.

### Event Schema Validation
- All events must pass JSONB schema validation against the property definitions in this document before insertion.
- Invalid events are rejected with a 422 response (client-side) or logged to `ops_alerts` (server-side).

### Phase 4 Deliverable
The Architecture agent must specify:
- `analytics_events` table placement (primary PostgreSQL instance or separate analytics schema)
- Celery task configuration for async analytics writes
- API endpoint specification for `POST /api/v1/analytics/events`
- Index strategy for dashboard query performance (server_ts, event_name, user_id already specified above)

---

*This document is reviewed at Phase 4 (Architecture) and Phase 7 (Implementation) for technical feasibility adjustments.*
*All event names and property keys are normative — changes require PRD version bump.*
