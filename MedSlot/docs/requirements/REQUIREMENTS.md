# Requirements Specification — MedSlot

**Phase:** 2 — Requirements Engineering
**Standard:** ISO/IEC/IEEE 29148:2018, ISO/IEC 25010:2023
**Version:** 1.0
**Date:** 2026-05-25

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-25 | Requirements Agent — Phase 2 | Initial specification |

---

## 1. System Context

### 1.1 System Boundary

The **MedSlot Platform** is the system under development. It comprises a Next.js 14 frontend and a Django + DRF backend, deployed on AWS ECS Fargate. All data persists in AWS RDS (PostgreSQL). Files (health records, prescription PDFs) are stored in AWS S3.

### 1.2 Context Diagram

```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                         MedSlot Platform                                │
 │  ┌───────────┐   ┌────────────┐   ┌────────────┐   ┌──────────────┐   │
 │  │ Next.js   │   │ Django DRF │   │ PostgreSQL │   │   AWS S3     │   │
 │  │ Frontend  │──▶│  Backend  │──▶│  (RDS)    │   │ (Records +   │   │
 │  │           │   │  /api/v1/ │   │            │   │  Prescripts) │   │
 │  └───────────┘   └─────┬─────┘   └────────────┘   └──────────────┘   │
 └────────────────────────┼────────────────────────────────────────────────┘
                          │
      ┌───────────────────┼───────────────────┬──────────────────┐
      │                   │                   │                  │
      ▼                   ▼                   ▼                  ▼
 [MSG91 API]       [SendGrid API]    [Razorpay Sub API]  [AWS CloudFront]
 OTP delivery      Transactional     Subscription         Static assets +
                   email             billing +            S3 documents CDN
                                     Webhooks ──────────────────────────▶
                                                          [Patient / Doctor
                                                           Browser]

External Actors:
 ● Patient          — registers, searches, books, uploads records, views prescriptions
 ● Doctor           — registers, configures calendar, consults, issues prescriptions
 ● MedSlot Admin    — verifies doctor credentials, manages account status

External Systems:
 ● MSG91            — OTP SMS delivery (outbound from platform)
 ● SendGrid         — Transactional email delivery (outbound from platform)
 ● Razorpay         — Subscription billing (outbound API + inbound webhooks)
 ● AWS S3           — Object storage (read/write from platform)
 ● AWS CloudFront   — CDN for static assets and S3-served files
```

### 1.3 Out-of-Scope Interfaces

The following are explicitly outside the system boundary and generate no integration requirements:
- Pharmacy systems, lab test systems, insurance claim systems
- Video/telehealth infrastructure (WebRTC, Zoom SDK)
- Real-time messaging (WebSocket, MQTT)
- Native mobile app SDK (iOS/Android)
- Patient-to-patient communication
- GPS / map services (location is city + area text only)

---

## 2. Functional Requirements

### FR-AUTH — Authentication & Authorization

| ID | Requirement | Priority | User Story | Test Condition |
|----|-------------|----------|------------|----------------|
| FR-AUTH-001 | The system SHALL generate a 6-digit numeric OTP and dispatch it via MSG91 SMS to the provided mobile number when a user initiates login or registration, producing a delivery confirmation from MSG91. | Must Have | US-001, US-012 | OTP dispatched; MSG91 delivery report = success |
| FR-AUTH-002 | The system SHALL invalidate an OTP 5 minutes after generation, returning an "OTP expired" error to any verification attempt submitted after expiry. | Must Have | US-001, US-012 | OTP submitted at T+6min returns 400 with "OTP expired" |
| FR-AUTH-003 | The system SHALL reject OTP verification and increment a failure counter when an incorrect OTP is submitted, returning an "invalid OTP" error. After 3 consecutive failures within a 10-minute window, the system SHALL lock OTP requests for that phone number for 15 minutes. | Must Have | US-001, US-012 | 4th failed attempt within 10min returns 429 with lockout expiry |
| FR-AUTH-004 | The system SHALL issue a signed JWT access token with a 24-hour expiry upon successful OTP verification, returning it in the HTTP response body. | Must Have | US-001, US-012 | Valid OTP returns 200 with token; token encodes role + user_id |
| FR-AUTH-005 | The system SHALL enforce role-based access control (RBAC): Patient-role endpoints SHALL reject Doctor or Admin tokens with 403; Doctor-role endpoints SHALL reject Patient or Admin tokens with 403; Admin-role endpoints SHALL reject Patient or Doctor tokens with 403. | Must Have | All | Cross-role request returns 403 |
| FR-AUTH-006 | The system SHALL rate-limit OTP generation to a maximum of 5 requests per phone number per 60-minute window, returning HTTP 429 on excess requests. | Must Have | US-001, US-012 | 6th OTP request in 60 min returns 429 |
| FR-AUTH-007 | The system SHALL reject all API requests lacking a valid, non-expired JWT token with HTTP 401, except for publicly accessible endpoints (doctor search, doctor profile view, OTP initiation). | Must Have | All | Unauthenticated request to protected endpoint returns 401 |

---

### FR-REG-PAT — Patient Registration

| ID | Requirement | Priority | User Story | Test Condition |
|----|-------------|----------|------------|----------------|
| FR-REG-PAT-001 | The system SHALL create a new Patient account when a previously unregistered mobile number successfully verifies an OTP, prompting the patient to complete their profile. | Must Have | US-001 | New number → OTP success → account created with role=patient |
| FR-REG-PAT-002 | The patient profile SHALL collect and persist: full name (required), date of birth (required), gender (required: Male/Female/Other), email address (required, used for notifications). | Must Have | US-001 | Profile saved; fields retrievable via /api/v1/patient/profile/ |
| FR-REG-PAT-003 | The system SHALL validate that the email address provided at patient registration matches the standard RFC 5322 email format, returning a field-level validation error for non-conforming input. | Must Have | US-001 | Invalid email returns 400 with field error on "email" |

---

### FR-REG-DOC — Doctor Registration & Approval

| ID | Requirement | Priority | User Story | Test Condition |
|----|-------------|----------|------------|----------------|
| FR-REG-DOC-001 | The system SHALL collect the following fields at doctor registration: full name (required), mobile number (required), specialty (required, from fixed taxonomy), MCI registration number (required), clinic name (required), clinic area/locality (required), clinic city (required), and credential document upload (required, PDF or image, ≤ 10MB). | Must Have | US-012 | All fields persisted; incomplete form returns field-level errors |
| FR-REG-DOC-002 | The system SHALL create a Doctor account with status = "Pending Verification" and role = doctor upon completion of the registration form, preventing login until status transitions to "Approved". | Must Have | US-012 | Registration completes; login attempt returns 403 with "account pending" |
| FR-REG-DOC-003 | The system SHALL notify the MedSlot Admin via email (SendGrid) within 60 seconds of a new doctor application submission. | Must Have | US-012, US-022 | Admin email received within 60s of doctor form submit |
| FR-REG-DOC-004 | The system SHALL display the doctor registration form with inline, field-level validation without full page reload. | Must Have | US-012 | Submit with invalid fields highlights errors inline |

---

### FR-SEARCH — Doctor Search & Discovery

| ID | Requirement | Priority | User Story | Test Condition |
|----|-------------|----------|------------|----------------|
| FR-SEARCH-001 | The system SHALL return a list of verified doctors when a patient submits a search with at least one filter (specialty or city), excluding all Doctor accounts with status ≠ "Approved". | Must Have | US-003, US-004 | Search with specialty=Cardiologist returns only Approved doctors with that specialty |
| FR-SEARCH-002 | The system SHALL allow patients to filter search results by specialty (single select from the fixed taxonomy) and by city (text filter matching clinic city field). Both filters MAY be used simultaneously. | Must Have | US-003, US-004 | Specialty + city combined filter returns intersection |
| FR-SEARCH-003 | Each search result entry SHALL display: doctor full name, specialty, clinic name, clinic area, clinic city, and a "Next Available" indicator (earliest available slot date, or "No slots available"). | Must Have | US-003 | Search result card contains all 6 fields |
| FR-SEARCH-004 | Search results SHALL be ordered: first by exact specialty match, then alphabetically by doctor last name. | Should Have | US-003 | Results with exact specialty match precede partial matches; within group, alphabetical |
| FR-SEARCH-005 | The search interface SHALL be accessible without authentication (public page). An unauthenticated user who selects a slot SHALL be prompted to register/login before the booking is confirmed. | Must Have | US-003 | Unauthenticated user reaches slot selection → redirected to OTP flow → booking completes |

---

### FR-PROFILE — Doctor Profile

| ID | Requirement | Priority | User Story | Test Condition |
|----|-------------|----------|------------|----------------|
| FR-PROFILE-001 | The system SHALL display a doctor's public profile containing: full name, specialty, MCI registration indicator ("Verified"), clinic name, full clinic address (area + city), and available appointment slots for the next 7 calendar days. | Must Have | US-005 | Profile page renders all fields; slots shown for next 7 days |
| FR-PROFILE-002 | The doctor profile SHALL only display available (unbooked, non-blocked) slots. Slots that are booked or blocked SHALL NOT be visible to patients. | Must Have | US-005 | Booked slot absent from patient-visible profile |
| FR-PROFILE-003 | An authenticated doctor SHALL be able to update their clinic name, clinic area, clinic city, and consultation details from their profile settings. | Must Have | US-014 | Doctor updates clinic name; change persists and reflects on public profile |
| FR-PROFILE-004 | An authenticated doctor SHALL NOT be able to edit their MCI registration number via the self-service interface. MCI number changes require Admin action. | Must Have | US-014 | Doctor PUT to mci_number field returns 403 |
| FR-PROFILE-005 | The system SHALL display the doctor's profile page to unauthenticated patients (public access). | Must Have | US-005 | GET /doctors/{id}/profile returns 200 without auth token |

---

### FR-CAL — Availability Calendar Management

| ID | Requirement | Priority | User Story | Test Condition |
|----|-------------|----------|------------|----------------|
| FR-CAL-001 | The system SHALL allow an authenticated doctor to define their availability by selecting working days (checkbox per day: Monday–Sunday), defining working hours (start time, end time) per working day, and selecting default slot duration (dropdown: 15 / 30 / 45 / 60 minutes). | Must Have | US-014 | Calendar saved; GET /doctor/availability returns configured days, hours, duration |
| FR-CAL-002 | The system SHALL automatically generate bookable appointment slots from the doctor's configured working days, working hours, and slot duration, covering a rolling 30-day window from the current date. | Must Have | US-014 | After calendar config, GET /doctors/{id}/slots returns generated slots within 30-day window |
| FR-CAL-003 | The system SHALL allow an authenticated doctor to block specific calendar dates (marking them as unavailable), preventing slot generation for those dates. | Must Have | US-014 | Blocked date returns no slots on patient-facing profile |
| FR-CAL-004 | A change to the doctor's availability calendar (working hours, slot duration, blocked dates) SHALL NOT modify or cancel any appointment that is already in "Scheduled" status. | Must Have | US-014 | Calendar update does not change existing booked appointments |
| FR-CAL-005 | The system SHALL regenerate the 30-day slot window daily at midnight (server time, IST) to ensure future slots reflect the current calendar configuration. | Must Have | US-014 | Day-boundary test: new day adds new slot at 30-day horizon |
| FR-CAL-006 | The system SHALL prevent a doctor from setting a working day end time that is earlier than or equal to the start time, returning a validation error. | Must Have | US-014 | End time ≤ start time returns 400 with validation error |

---

### FR-BOOK — Appointment Booking

| ID | Requirement | Priority | User Story | Test Condition |
|----|-------------|----------|------------|----------------|
| FR-BOOK-001 | The system SHALL allow an authenticated patient to select an available slot from a doctor's profile and confirm a booking, creating an Appointment record with status = "Scheduled". | Must Have | US-006 | POST /appointments creates record; status=Scheduled |
| FR-BOOK-002 | The system SHALL prevent concurrent double-booking of the same slot using a database-level transaction and row-level locking. If two patients attempt to book the same slot simultaneously, exactly one SHALL succeed and the other SHALL receive a "slot no longer available" error. | Must Have | US-006 | Concurrent booking test: one succeeds, one returns 409 |
| FR-BOOK-003 | The system SHALL display a booking summary (doctor name, date, time, clinic address) for patient confirmation before the booking is committed. | Must Have | US-006 | Pre-confirmation screen renders all 4 fields |
| FR-BOOK-004 | A patient SHALL NOT book more than one "Scheduled" appointment with the same doctor on the same calendar date. The system returns a conflict error if attempted. | Must Have | US-006 | Second booking with same doctor on same date returns 409 |
| FR-BOOK-005 | The booked slot SHALL be immediately removed from the available slots displayed on the doctor's public profile upon confirmed booking. | Must Have | US-006 | Refresh doctor profile post-booking: booked slot absent |
| FR-BOOK-006 | Only authenticated users with the Patient role MAY book appointments. Doctor and Admin role users SHALL receive 403 on booking endpoints. | Must Have | US-006 | Doctor JWT on POST /appointments returns 403 |

---

### FR-APPT — Appointment Management

| ID | Requirement | Priority | User Story | Test Condition |
|----|-------------|----------|------------|----------------|
| FR-APPT-001 | The system SHALL display all appointments for an authenticated patient (upcoming + past), sorted by appointment date-time descending, showing: doctor name, specialty, date, time, clinic, status. | Must Have | US-007 | GET /patient/appointments returns full history, correct sort |
| FR-APPT-002 | The system SHALL display today's appointments for an authenticated doctor, sorted by appointment time ascending, showing: patient name, time, status. | Must Have | US-015 | GET /doctor/appointments/today returns today's appointments sorted |
| FR-APPT-003 | The system SHALL display upcoming appointments (next 30 days) for an authenticated doctor, sorted by date-time ascending. | Must Have | US-016 | GET /doctor/appointments/upcoming returns 30-day window sorted |
| FR-APPT-004 | The system SHALL allow an authenticated patient to cancel an appointment with status = "Scheduled" if the appointment start time is more than 2 hours from the time of the cancellation request. The appointment status SHALL be set to "Cancelled". | Must Have | US-008 | Cancel at T-2h+1min: status=Cancelled; Cancel at T-2h-1min: 409 returned |
| FR-APPT-005 | The system SHALL allow an authenticated doctor to cancel any appointment with status = "Scheduled" at any time before the appointment start time. The appointment status SHALL be set to "Cancelled". | Must Have | US-021 | Doctor cancels T-1min appointment: status=Cancelled |
| FR-APPT-006 | The system SHALL allow an authenticated doctor to mark an appointment outcome after the appointment start time has passed: "No-Show" (patient did not attend) or transition to consultation state. Both "No-Show" and "Cancelled" are terminal statuses. | Must Have | US-020 | Mark no-show: status=No-Show; further status change returns 409 |
| FR-APPT-007 | The system SHALL send a cancellation notification email to the non-cancelling party (patient if doctor cancels; doctor if patient cancels) within 60 seconds of the cancellation action. | Must Have | US-008, US-021 | Cancellation email received by correct party within 60s |

---

### FR-CONSULT — Consultation Workflow

| ID | Requirement | Priority | User Story | Test Condition |
|----|-------------|----------|------------|----------------|
| FR-CONSULT-001 | The system SHALL allow an authenticated doctor to open a consultation for an appointment with status = "Scheduled" where the appointment date equals the current calendar date (IST), transitioning the appointment to status = "In Consultation". | Must Have | US-017 | Open consultation on today's appointment: status=In Consultation |
| FR-CONSULT-002 | The consultation session SHALL present a structured note form with the following fields: Chief Complaint (required, free text), History of Present Illness (optional, free text), Examination Findings (optional, free text), Diagnosis (required, free text), Plan / Treatment Instructions (optional, free text). | Must Have | US-018 | Form renders all 5 fields; submit without required fields returns validation error |
| FR-CONSULT-003 | The system SHALL persist consultation notes to the appointment record each time the doctor saves the form (including draft saves before prescription issuance). | Must Have | US-018 | Save draft: notes retrievable via GET /appointments/{id}/consultation |
| FR-CONSULT-004 | Consultation notes SHALL be immutable once the appointment status transitions to "Completed". Any edit attempt after completion SHALL return 403. | Must Have | US-018 | PUT to notes after status=Completed returns 403 |
| FR-CONSULT-005 | Only the doctor assigned to the appointment SHALL access the consultation note form for that appointment. All other roles return 403. | Must Have | US-017 | Patient JWT on GET /appointments/{id}/consultation returns 403 |

---

### FR-RX — Prescription Generation & Delivery

| ID | Requirement | Priority | User Story | Test Condition |
|----|-------------|----------|------------|----------------|
| FR-RX-001 | The system SHALL allow a doctor to issue a prescription for an appointment with status = "In Consultation". The prescription form SHALL include: medicine entries (each with name, dosage, frequency, duration — all required per entry), additional instructions (optional, free text), follow-up date (optional). | Must Have | US-019 | POST /prescriptions on In-Consultation appointment: prescription created |
| FR-RX-002 | The prescription form SHALL support multiple medicine entries (minimum 1, no maximum). The doctor SHALL be able to add and remove medicine rows dynamically. | Must Have | US-019 | 5-medicine prescription persisted correctly |
| FR-RX-003 | The system SHALL generate a prescription PDF using WeasyPrint from a defined HTML template containing: MedSlot header, doctor name + specialty + clinic, patient name, appointment date, consultation notes (Chief Complaint, Diagnosis), medicine list, instructions, follow-up date (if set), generation timestamp. | Must Have | US-019 | Generated PDF contains all defined fields |
| FR-RX-004 | The generated PDF SHALL be stored in AWS S3 under the path: `prescriptions/{patient_id}/{appointment_id}.pdf` with SSE-S3 encryption. | Must Have | US-019 | S3 object exists at path with server-side encryption |
| FR-RX-005 | The system SHALL send a prescription delivery email to the patient (via SendGrid) within 60 seconds of prescription issuance, containing a pre-signed S3 URL valid for 7 days. | Must Have | US-019 | Email received within 60s; link valid; link expired after 7 days |
| FR-RX-006 | The system SHALL set appointment status to "Completed" immediately upon successful prescription issuance. | Must Have | US-019 | POST /prescriptions → appointment status=Completed |
| FR-RX-007 | A patient SHALL be able to regenerate a fresh 7-day pre-signed URL for any of their prescriptions via their My Appointments view at any time, regardless of the original URL's expiry. | Must Have | US-011 | GET /prescriptions/{id}/download returns fresh pre-signed URL |
| FR-RX-008 | Prescription records SHALL be immutable once created. No edit or delete operation SHALL be permitted on a prescription by any role, including Admin. | Must Have | US-019 | PUT /prescriptions/{id} returns 405 |

---

### FR-RECORD — Health Record Management

| ID | Requirement | Priority | User Story | Test Condition |
|----|-------------|----------|------------|----------------|
| FR-RECORD-001 | The system SHALL allow an authenticated patient to upload health record files in PDF, JPEG, or PNG format, each not exceeding 10MB, to their personal S3 folder. | Must Have | US-009 | Valid PDF ≤ 10MB: upload succeeds; 11MB file returns 400 |
| FR-RECORD-002 | Uploaded health record files SHALL be stored at path: `records/{patient_id}/{uuid}.{ext}` in AWS S3 with SSE-S3 encryption. | Must Have | US-009 | S3 object at correct path with encryption flag |
| FR-RECORD-003 | The system SHALL display a list of an authenticated patient's uploaded health records showing: file name (original), file type, upload date, ordered by upload date descending. | Must Have | US-009 | GET /patient/records returns list with correct fields and sort |
| FR-RECORD-004 | The system SHALL provide a pre-signed S3 download URL valid for 7 days when a patient requests to download a health record. | Must Have | US-009 | GET /records/{id}/download returns pre-signed URL; URL valid for 7 days |
| FR-RECORD-005 | The system SHALL allow an authenticated patient to soft-delete a health record (record marked deleted in the database; S3 object retained per 10-year retention policy). The file SHALL NOT appear in the patient's records list after deletion. | Should Have | US-009 | DELETE /records/{id}: record absent from list; S3 object still exists |

---

### FR-NOTIF — Notifications

| ID | Requirement | Priority | User Story | Test Condition |
|----|-------------|----------|------------|----------------|
| FR-NOTIF-001 | The system SHALL deliver an OTP SMS via MSG91 within 10 seconds of an OTP generation request under normal network conditions. | Must Have | US-001, US-012 | SMS received within 10s in integration test |
| FR-NOTIF-002 | The system SHALL send a booking confirmation email to the patient within 60 seconds of a confirmed appointment booking, containing: doctor name, specialty, clinic address, appointment date and time. | Must Have | US-006 | Email received within 60s; all 4 fields present |
| FR-NOTIF-003 | The system SHALL send a new booking notification email to the doctor within 60 seconds of a confirmed appointment booking, containing: patient name, appointment date and time. | Must Have | US-006 | Doctor email received within 60s; patient name and time correct |
| FR-NOTIF-004 | The system SHALL send a cancellation notification email to the non-cancelling party within 60 seconds of an appointment cancellation, containing: appointment date, time, and who cancelled. | Must Have | US-008, US-021 | Correct recipient receives email within 60s |
| FR-NOTIF-005 | The system SHALL send a prescription delivery email to the patient within 60 seconds of prescription issuance, containing: doctor name, appointment date, and the PDF download link (7-day pre-signed URL). | Must Have | US-019 | Patient email contains working PDF link within 60s |
| FR-NOTIF-006 | The system SHALL send an appointment reminder email to the patient 24 hours (±15 minutes) before their scheduled appointment start time, containing: doctor name, appointment date, time, clinic address. | Should Have | US-007 | Reminder email received 24h before appointment ±15min |

---

### FR-ADMIN — Admin Panel

| ID | Requirement | Priority | User Story | Test Condition |
|----|-------------|----------|------------|----------------|
| FR-ADMIN-001 | The system SHALL provide an admin interface displaying all doctor applications with status = "Pending Verification", showing: doctor name, specialty, MCI number, submission date, and credential document(s). | Must Have | US-022 | Admin panel lists all pending applications with required fields |
| FR-ADMIN-002 | The system SHALL allow an admin to approve a pending doctor application, setting account status = "Approved", and send an approval email to the doctor. | Must Have | US-023 | Admin approves → status=Approved; doctor receives email; doctor can now log in |
| FR-ADMIN-003 | The system SHALL allow an admin to reject a pending doctor application, setting account status = "Rejected", and send a rejection email to the doctor containing the admin-entered reason. | Must Have | US-023 | Admin rejects with reason → status=Rejected; rejection email contains reason |
| FR-ADMIN-004 | The system SHALL allow an admin to suspend an approved doctor account, setting status = "Suspended", preventing the doctor from logging in, and removing the doctor's profile from patient search results. | Must Have | US-024 | Admin suspends → doctor login returns 403; doctor absent from search |
| FR-ADMIN-005 | The system SHALL allow an admin to reactivate a suspended doctor account, restoring login access and visibility in search results. | Must Have | US-024 | Admin reactivates → doctor login succeeds; doctor visible in search |
| FR-ADMIN-006 | All admin panel endpoints SHALL require Admin role JWT. Non-admin tokens return 403. | Must Have | US-022 | Patient/Doctor JWT on admin endpoints returns 403 |

---

### FR-SUB — Subscription Management

| ID | Requirement | Priority | User Story | Test Condition |
|----|-------------|----------|------------|----------------|
| FR-SUB-001 | The system SHALL grant a 30-day trial period from the account approval date during which a doctor can access all dashboard features without a paid subscription. | Must Have | US-025 | Account approved at T0; dashboard accessible at T+29d; inaccessible at T+31d without subscription |
| FR-SUB-002 | The system SHALL integrate with the Razorpay Subscriptions API to create a subscription plan for doctor accounts when they initiate subscription purchase after or during the trial period. | Must Have | US-025 | POST to Razorpay Subscriptions API creates subscription; subscription_id stored against doctor |
| FR-SUB-003 | The system SHALL process Razorpay webhook events for subscription lifecycle management. On "subscription.activated" event, doctor subscription status SHALL be set to "Active". | Must Have | US-025 | Webhook simulation: activated event → status=Active |
| FR-SUB-004 | On Razorpay webhook event indicating a failed payment (after Razorpay's retry cycle), doctor subscription status SHALL be set to "Payment Failed", and the doctor SHALL receive an email notification with a payment resolution link. | Must Have | US-025 | Webhook simulation: payment_failed event → status=Payment Failed; email sent |
| FR-SUB-005 | A doctor account with subscription status = "Payment Failed" for more than 7 consecutive days SHALL have dashboard access suspended. Existing appointment records for affected patients SHALL remain visible (read-only) to patients for 90 days from suspension. | Must Have | US-025 | T+8d after payment_failed → doctor dashboard returns 402; patient appointments still readable |
| FR-SUB-006 | The system SHALL validate all inbound Razorpay webhook payloads using HMAC-SHA256 signature verification before processing any state change. Invalid signatures SHALL return 400 and generate an alert log entry. | Must Have | US-025 | Invalid signature webhook returns 400; no state change; alert logged |

---

## 3. Business Rules

*(See docs/requirements/BUSINESS-RULES.md for complete catalog with authority references.)*

Summary reference table:

| ID | Rule Summary | Authority |
|----|-------------|-----------|
| BR-001 | OTP valid for 5 minutes from generation | Security policy |
| BR-002 | 3 failed OTP attempts within 10 min → 15-min lockout | Security policy |
| BR-003 | One phone number → one account (patient or doctor) | Business policy |
| BR-004 | Session JWT expires after 24 hours | Business policy |
| BR-005 | One slot → one patient (no double booking) | Physical constraint |
| BR-006 | Max 1 scheduled appointment per patient per doctor per calendar date | Business policy |
| BR-007 | Slot window: rolling 30 days from current date | Business policy |
| BR-008 | Patient cancellation window: > 2 hours before appointment start | Business policy |
| BR-009 | Doctor can cancel any time before appointment start | Business policy |
| BR-010 | Terminal statuses (Completed/No-Show/Cancelled) are immutable | Data integrity |
| BR-011 | Patient accounts cannot access doctor or admin endpoints | Role separation |
| BR-012 | Doctor accounts cannot book appointments | Business policy |
| BR-013 | Admin accounts are distinct from patient/doctor accounts | Least privilege |
| BR-014 | Only Approved doctors visible in search | Trust policy |
| BR-015 | Non-Approved doctors cannot access dashboard or create slots | Business policy |
| BR-016 | MCI registration number mandatory at doctor registration | MCI regulations |
| BR-017 | PHI must not appear in application logs in plaintext | Data privacy |
| BR-018 | PHI fields in Django models require `# PHI` comment | Coding standard |
| BR-019 | Health records, prescriptions, and notes retained ≥ 10 years | Medical records compliance |
| BR-020 | Patient data readable 90 days after doctor suspension | Data portability |
| BR-021 | Trial/Active subscription status → full dashboard access | Subscription policy |
| BR-022 | Payment Failed > 7 days → dashboard suspended | Subscription policy |
| BR-023 | Prescription only issuable for "In Consultation" appointments | Medical practice |
| BR-024 | Issued prescriptions are immutable | Medical regulatory practice |

---

## 4. Non-Functional Requirements

*Standard: ISO/IEC 25010:2023*

### 4.1 Performance Efficiency

| ID | Requirement | Metric | Target | Measurement Method |
|----|-------------|--------|--------|--------------------|
| NFR-PE-001 | API response time | P95 latency | ≤ 200ms under 500 concurrent users | Load test (k6 or Locust) at 80% peak load |
| NFR-PE-002 | Doctor discovery/search page load | Largest Contentful Paint (LCP) | ≤ 2.5s | Lighthouse CI + production RUM |
| NFR-PE-003 | Authenticated dashboard pages (patient + doctor) | LCP | ≤ 3.0s | Lighthouse CI + production RUM |
| NFR-PE-004 | Prescription PDF generation | End-to-end time (form submit → S3 confirmation) | ≤ 4s at P95 | Application timestamp logging |
| NFR-PE-005 | Health record upload (≤ 10MB file) | Upload time P95 | ≤ 5s | Client-side timing + S3 put completion event |
| NFR-PE-006 | Platform concurrent user capacity | Peak simultaneous users without degradation | 500 concurrent users | Load test maintaining NFR-PE-001 thresholds |

### 4.2 Reliability

| ID | Requirement | Metric | Target | Measurement Method |
|----|-------------|--------|--------|--------------------|
| NFR-REL-001 | Platform availability | Uptime | ≥ 99.9% per calendar month (≤ 43.8 min/month downtime) | AWS CloudWatch + uptime monitoring |
| NFR-REL-002 | Recovery Time Objective (RTO) | Time to restore after confirmed outage | ≤ 1 hour | Incident response drill |
| NFR-REL-003 | Recovery Point Objective (RPO) | Maximum data loss window after DB failure | ≤ 30 minutes | RDS automated backup verification |
| NFR-REL-004 | Email delivery retry | Retry on SendGrid 5xx errors | 3 retries with exponential backoff (1m, 5m, 30m) | Application logs |
| NFR-REL-005 | Prescription PDF generation failure | Retry on WeasyPrint failure | Retry once; if fails, notify ops via alert log; do not silently drop | Application logs + alert |

### 4.3 Security

| ID | Requirement | Metric | Target | Measurement Method |
|----|-------------|--------|--------|--------------------|
| NFR-SEC-001 | Data in transit | TLS version | TLS 1.2 or higher on all endpoints | SSL Labs scan (Grade A minimum) |
| NFR-SEC-002 | Data at rest (RDS) | Encryption standard | AES-256 via AWS RDS encryption | AWS console + config audit |
| NFR-SEC-003 | Data at rest (S3) | Encryption standard | SSE-S3 (AES-256) on all buckets | S3 bucket policy audit |
| NFR-SEC-004 | Authentication method | Method | SMS OTP only (no password, no social login) | Code review + penetration test |
| NFR-SEC-005 | Authorization model | Model | RBAC with three roles: Patient, Doctor, Admin | Role permission test suite |
| NFR-SEC-006 | Session token expiry | JWT TTL | 24 hours | Token expiry integration test |
| NFR-SEC-007 | OTP endpoint rate limit | Requests per phone/hour | Max 5 OTP requests per phone number per 60 minutes | Rate limit test |
| NFR-SEC-008 | S3 bucket access | Public access | All health record and prescription S3 buckets block public access; all file access via pre-signed URLs only | S3 bucket policy audit |
| NFR-SEC-009 | Razorpay webhook validation | Signature validation | HMAC-SHA256 signature verified on every webhook before processing | Code review |
| NFR-SEC-010 | Input validation | Injection prevention | Django ORM exclusively for all DB queries; DRF serializers validate all inputs | OWASP ZAP scan |
| NFR-SEC-011 | PHI log protection | Plaintext PHI in logs | Zero PHI fields in application logs in plaintext | Log audit + automated PHI scan |

### 4.4 Usability (Interaction Capability)

| ID | Requirement | Metric | Target | Measurement Method |
|----|-------------|--------|--------|--------------------|
| NFR-USE-001 | Patient booking flow time | End-to-end from search to confirmed booking | ≤ 2 minutes at P50 for new patient | Usability test with ≥ 5 participants |
| NFR-USE-002 | Accessibility standard | WCAG conformance | WCAG 2.1 Level AA on all public-facing pages | Axe accessibility scan + manual check |
| NFR-USE-003 | Browser support | Browser matrix | Chrome 120+, Firefox 124+, Safari 17+, Edge 120+ (desktop); Chrome Android 120+, Safari iOS 17+ (mobile) | Cross-browser test (BrowserStack or equivalent) |
| NFR-USE-004 | Responsive design | Minimum viewport | All pages functional at 375px minimum width; primary design target 1280px+ | Responsive test at 375px, 768px, 1280px |
| NFR-USE-005 | Form validation | Inline validation | All forms provide inline field-level validation without page reload | UI test |

### 4.5 Maintainability

| ID | Requirement | Metric | Target | Measurement Method |
|----|-------------|--------|--------|--------------------|
| NFR-MAIN-001 | Test coverage | Line coverage | ≥ 90% for all new code (backend + frontend) | pytest-cov (backend); Jest/Vitest coverage (frontend) |
| NFR-MAIN-002 | API documentation | OpenAPI specification | /api/schema/ endpoint returns valid OpenAPI 3.0 spec (drf-spectacular) | Schema validation test |
| NFR-MAIN-003 | Log format | Structured logging | All logs in JSON format with fields: timestamp, level, service, request_id, user_id (hashed), message | Log format audit |
| NFR-MAIN-004 | Audit trail | PHI-modifying actions | Audit log entry for: prescription issuance, health record upload, health record deletion, doctor approval/rejection/suspension | Audit log integration test |
| NFR-MAIN-005 | PHI field identification | Code annotation | All Django model fields containing PHI annotated with `# PHI` comment | Automated code scan |

### 4.6 Compatibility (Interoperability)

| ID | Requirement | Metric | Target | Measurement Method |
|----|-------------|--------|--------|--------------------|
| NFR-COMPAT-001 | API architecture | Style + versioning | REST, versioned at /api/v1/ | API design review |
| NFR-COMPAT-002 | API data format | Field naming | JSON with snake_case field names in all request/response bodies | API contract test |
| NFR-COMPAT-003 | MSG91 API | Version | MSG91 OTP API v5 | Integration test |
| NFR-COMPAT-004 | SendGrid API | Version | SendGrid Mail Send API v3 | Integration test |
| NFR-COMPAT-005 | Razorpay API | Version | Razorpay Subscriptions API (latest stable) | Integration test |

### 4.7 Portability

| ID | Requirement | Metric | Target | Measurement Method |
|----|-------------|--------|--------|--------------------|
| NFR-PORT-001 | Containerization | OCI compliance | All services containerized as Docker OCI images | docker build + run test |
| NFR-PORT-002 | Deployment target | Cloud region | AWS ECS Fargate, region ap-south-1 (Mumbai) | Staging deployment verification |
| NFR-PORT-003 | Database service | Managed service | AWS RDS PostgreSQL 16 | Deployment configuration review |

### 4.8 Functional Suitability

Validated via functional requirements (Section 2) and acceptance testing (Phase 9). All functional requirements are mapped to BDD acceptance criteria in USER-STORIES.md, which serve as the primary functional suitability test suite.

---

## 5. Data Requirements

### 5.1 Entity Inventory

| Entity | Description | Data Owner | Sensitivity | Retention Period | Volume at Launch | Volume at 12 months |
|--------|-------------|-----------|-------------|-----------------|-----------------|---------------------|
| User | Base account record (patient or doctor); role, phone, JWT tokens | MedSlot | PII | 10 years from last activity | ~500–1,000 | ~5,000–10,000 |
| PatientProfile | Patient demographics: name, DOB, gender, email | MedSlot | PII | 10 years from last activity | ~400–800 | ~4,000–8,000 |
| DoctorProfile | Doctor credentials, specialty, clinic info, MCI number, verification status | MedSlot | PII | 10 years from last activity | ~100–200 | ~1,000–2,000 |
| Specialty | Fixed taxonomy of 13 medical specialties | MedSlot | None | Indefinite | 13 records | 13 records (stable) |
| AvailabilityCalendar | Doctor's working days, hours, slot duration | MedSlot | None | Duration of doctor account | ~100–200 | ~1,000 |
| AppointmentSlot | Generated available slots per doctor (rolling 30 days) | MedSlot | None | 30-day rolling window (older slots archived) | ~10,000 | ~100,000 |
| Appointment | Booked appointment record; patient + doctor + slot + status | MedSlot | PII | 10 years | ~1,000 | ~10,000–15,000 |
| ConsultationNote | Structured consultation notes per appointment | MedSlot | **PHI** | 10 years | ~800 | ~8,000 |
| Prescription | Prescription data: medicines, instructions, follow-up | MedSlot | **PHI** | 10 years | ~800 | ~8,000 |
| PrescriptionPDF | S3-stored PDF file; reference stored in Prescription record | MedSlot | **PHI** | 10 years | ~800 files | ~8,000 files |
| HealthRecord | Patient-uploaded health documents | Patient (stored by MedSlot) | **PHI** | 10 years or until patient deletion | ~2,000 files | ~20,000 files |
| Notification | Audit record of all sent emails and SMS | MedSlot | PII (recipient data) | 2 years | ~5,000 | ~50,000 |
| DoctorSubscription | Razorpay subscription reference, status, trial expiry | MedSlot | PII | Duration of doctor account | ~100–200 | ~1,000 |

### 5.2 Import / Export Requirements

| Requirement | Detail |
|-------------|--------|
| No data migration | Greenfield — no legacy system to migrate from |
| Patient data export | Not required in v1; post-launch feature |
| Doctor credential document | Uploaded as PDF/image at registration; stored in S3 (admin access only); no export required |
| Prescription export | Patient downloads via pre-signed URL (PDF format) — no structured data export needed in v1 |

### 5.3 Analytics / Reporting Data

| Data Need | Measurement Method | Access Level |
|-----------|-------------------|-------------|
| Appointment completion rate | Query Appointment table: count by status | Internal — admin/ops query |
| Doctor weekly active rate | Query session logs by role=doctor, trailing 7 days | Internal — admin/ops query |
| OTP delivery success rate | MSG91 delivery report API | Internal — ops monitoring |
| Subscription MRR | DoctorSubscription table + Razorpay dashboard | Internal — finance |
| Platform uptime | AWS CloudWatch metrics | Internal — ops |

No third-party analytics platform (e.g., Mixpanel, Amplitude) is in scope for v1. Analytics queries run directly against the production PostgreSQL read replica.

---

## 6. Integration Requirements

| External System | Integration Type | Direction | Data Exchanged | Authentication | Availability SLA | Error Handling Strategy |
|----------------|-----------------|-----------|---------------|----------------|-----------------|------------------------|
| **MSG91** | REST API | Outbound | Phone number, OTP code | API Key (header) | 99.9% (MSG91 SLA) | Retry once after 2s on 5xx; log failure; return "OTP delivery failed" to user if both attempts fail |
| **SendGrid** | REST API (Mail Send v3) | Outbound | HTML email payload, recipient address, subject | API Key (Bearer token) | 99.9% (SendGrid SLA) | Retry 3× with exponential backoff (1m, 5m, 30m); alert ops log if all retries fail; do not silently drop |
| **AWS S3** | AWS SDK (boto3) | Bidirectional | File upload (PUT), pre-signed URL generation (GET) | IAM Role (ECS task role, no static credentials) | 99.99% (AWS SLA) | S3 SDK retry policy (3 retries with jitter); if upload fails, return error to user; do not create DB record |
| **AWS CloudFront** | CDN (passive) | Outbound (to users) | Static assets, S3-served documents | N/A — behind CloudFront distribution | 99.99% (AWS SLA) | Cache invalidation on deployment; no custom error handling needed |
| **Razorpay Subscriptions** | REST API (outbound) + Webhook (inbound) | Bidirectional | Subscription creation (outbound); subscription lifecycle events (inbound webhook) | API Key/Secret (outbound); HMAC-SHA256 webhook signature (inbound) | 99.9% (Razorpay SLA) | Idempotency key on all write operations; webhook signature validation before any state change; duplicate webhook detection (store processed event IDs) |

---

## 7. Constraints

All constraints from CLAUDE.md are formally documented below as requirements context:

| Constraint | Formal Statement | Impact |
|------------|-----------------|--------|
| Cloud budget | AWS infrastructure cost SHALL NOT exceed $2,000 USD/month | Architecture must be cost-optimized; ECS Fargate task sizing and RDS instance class must be reviewed in Phase 4 |
| Timeline | Core patient booking flow + doctor consultation + prescription generation SHALL be complete by 2026-10-31 | Scope freeze enforced at Phase 6; cut-scope protocol triggered if behind at Sprint 3 |
| Compliance | Patient data SHALL be encrypted at rest (AES-256) and in transit (TLS 1.2+) from day one; no HIPAA or DISHA full compliance required | Covered by NFR-SEC-001 through NFR-SEC-003 |
| Team size | Implementation team is 3 developers (1 full-stack lead, 1 frontend, 1 backend) | Architecture and task breakdown must account for this constraint |
| Authentication | Only SMS OTP via MSG91; no password or social login | Covered by NFR-SEC-004; no OAuth infrastructure needed |
| No payment processing | MedSlot does not process consultation fees. Razorpay is used only for MedSlot's own doctor subscription billing | Consultation fee is out of scope; FR-SUB covers subscription billing only |
| Platform target | Web-first, desktop-first (1280px+) with responsive adaptation down to 375px | Covered by NFR-USE-004; no native mobile app in v1 |
