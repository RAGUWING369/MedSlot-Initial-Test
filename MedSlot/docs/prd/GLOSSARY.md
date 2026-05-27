# MedSlot — Domain Glossary

**Phase:** 3 — Product Requirements Document
**Version:** 1.0
**Date:** 2026-05-25
**Scope:** All terms used across MedSlot SDLC artifacts (Phases 1–14). Entries are normative — any agent or developer encountering a term in this list must use the definition provided here.

---

## How to Use This Glossary

- Terms appear in **bold** throughout SDLC artifacts. When a term is defined here, its use in all other documents is governed by this definition.
- Terms marked `[PHI]` contain or reference Protected Health Information as defined by MedSlot's data classification policy (BR-019, BR-020, NFR-MAIN-005).
- Terms marked `[Technical]` are implementation-specific and relevant primarily to Phases 4–7.
- Cross-references use → notation.

---

## A

**Admin Panel**
The administrative interface used by MedSlot Operations staff (the Admin User persona). Built on Django's extended admin framework. Used for doctor verification, account management, and platform oversight. Accessible only to users with `role=admin`. Not accessible to patients or doctors.

**Admin User**
A member of the MedSlot Operations team who uses the Admin Panel to review, approve, or reject doctor registration applications, and to manage platform-level settings. One of the three defined user roles (see → Role).

**Appointment**
A confirmed booking between a specific Patient and a specific Doctor for a fixed date and time slot. Represented as a database record with a defined → Appointment Status. An appointment occupies exactly one → Slot. Created with status = Scheduled on confirmation.

**Appointment Status**
The current state of an → Appointment in the → Appointment State Machine. Valid states: `Scheduled`, `In Consultation`, `Completed`, `Cancelled`, `No-Show`. The states `Completed`, `Cancelled`, and `No-Show` are → Terminal States.

**Appointment State Machine**
The defined set of valid transitions between → Appointment Status values:
- `Scheduled` → `In Consultation` (doctor starts consultation)
- `In Consultation` → `Completed` (prescription issued)
- `In Consultation` → `No-Show` (doctor marks no-show)
- `Scheduled` → `Cancelled` (patient or doctor cancels)
No transition from a → Terminal State is permitted.

**Area**
A text field in the Doctor's profile representing the sub-city locality or neighbourhood of the clinic (e.g., "Koramangala", "Banjara Hills"). Combined with → City to form the doctor's location. No GPS or map coordinates are stored. See also → Location Model.

**Availability Calendar**
A doctor-defined configuration that specifies their working days (by day-of-week), working hours per day, and → Slot Duration. Used to automatically generate → Slots for the next 30 days. Stored as an `AvailabilityCalendar` database record per doctor.

**AvailabilityCalendar**
The Django model representing a doctor's availability configuration. Fields: doctor (FK), working_days (array), start_time, end_time, slot_duration_minutes. Changes to this model do not affect existing → Booked Slots.

---

## B

**Blocked Date**
A specific calendar date that a doctor has marked as unavailable (e.g., for leave or a holiday). All → Unbooked Slots on a blocked date are removed from the available pool. Existing → Booked Slots on a blocked date are not automatically cancelled.

**Booked Slot**
A → Slot that has an associated `Appointment` record with status = `Scheduled` or `In Consultation`. Cannot be offered to another patient until the appointment reaches a → Terminal State or is cancelled.

**Booking Confirmation Email**
An email sent to the patient immediately upon appointment creation (status → Scheduled), and a separate notification email sent to the doctor. Delivered via → SendGrid (FR-NOTIF-002, FR-NOTIF-003).

**Business Rule (BR)**
A constraint or invariant that governs system behaviour, independent of implementation. All business rules are catalogued in `docs/requirements/BUSINESS-RULES.md` and referenced as BR-NNN.

---

## C

**Cancellation Window**
The minimum time before an appointment start time within which a patient may cancel without restriction. Defined as **> 2 hours** before the appointment start time (BR-010, A-02-004). A patient cannot cancel an appointment if the current time is within 2 hours of its scheduled start.

**Chief Complaint** `[PHI]`
A structured field in the → Consultation Note capturing the patient's primary reason for the visit in the doctor's words (e.g., "Chest tightness on exertion"). Required before a → Prescription can be issued.

**City**
A text field in the Doctor's profile representing the metropolitan area of the clinic (e.g., "Hyderabad", "Bengaluru", "Pune"). Used as the primary filter in → Doctor Discovery. Patient search filters by city.

**Consultation**
The clinical interaction between a Doctor and a Patient during a scheduled appointment. In MedSlot, a consultation is initiated when the doctor clicks "Start Consultation" and is represented by the appointment transitioning to status = `In Consultation`. A consultation results in a → Consultation Note and optionally a → Prescription.

**Consultation Note** `[PHI]`
A structured record created by the doctor during a → Consultation. Contains: Chief Complaint, Examination Findings, Diagnosis, and optionally free-text clinical observations. Stored as a `ConsultationNote` record linked to the Appointment. PHI — access restricted to the treating doctor (BR-021).

**CustomUser**
The Django auth model serving as the base user entity for all roles in MedSlot. Has a `role` field (`patient`, `doctor`, `admin`). Both `PatientProfile` and `DoctorProfile` extend from CustomUser via a one-to-one relationship. There are no separate auth models per role.

---

## D

**Dashboard (Doctor)**
The main interface for authenticated doctors. Displays today's appointments, upcoming appointments, availability settings entry point, and consultation history. Protected by `IsApprovedDoctor` permission class.

**Dashboard (Patient)**
The main interface for authenticated patients. Displays upcoming appointments, past appointment history, My Health Records, and My Prescriptions. Protected by `IsPatient` permission class.

**Diagnosis** `[PHI]`
A field in the → Consultation Note specifying the doctor's clinical determination (e.g., "Stable Angina Pectoris"). Required field before a → Prescription can be issued.

**Doctor**
A Registered Medical Practitioner (MBBS or above) who has self-registered on MedSlot, been approved by the Admin User, and uses the platform to manage appointments and conduct consultations. One of three defined → Roles.

**Doctor Discovery**
The patient-facing search experience that surfaces → Approved Doctor profiles filtered by specialty and city. Implemented as a server-side rendered (SSR) Next.js page for SEO performance. Doctors appear in results only when their account status = `Approved` and subscription status is `Trial` or `Active`.

**DoctorProfile**
The Django model extending `CustomUser` for users with `role=doctor`. Fields include: specialty (FK to Specialty), MCI number, clinic name, city, area, profile bio, consultation hours, subscription_id, subscription_status, trial_expiry_date, account_status (Pending/Approved/Rejected). See → Doctor Verification.

**Doctor Subscription**
The recurring billing relationship between a Doctor and MedSlot. Managed via → Razorpay Subscriptions. Statuses: `Trial`, `Active`, `Paused`, `Cancelled`. A `DoctorSubscription` model stores: razorpay_subscription_id, plan_id, status, current_period_start, current_period_end, trial_expiry. See → Trial Period.

**Doctor Verification**
The process by which the Admin User reviews and approves or rejects a Doctor's self-registration application. A doctor's account status must be `Approved` before they can access the doctor dashboard, appear in search, or begin their → Trial Period.

---

## E

**Examination Findings** `[PHI]`
A field in the → Consultation Note for clinical observations (e.g., vital signs, physical examination results). Not required to issue a prescription but included in the prescription PDF when populated.

---

## F

**Feature Specification**
A section within the PRD that describes a discrete product feature: its purpose, user stories covered, acceptance criteria summary, edge cases, and feature-level success metric.

**Follow-Up Date**
An optional field on a → Prescription indicating the recommended date for the patient's next appointment. Included in the → Prescription PDF if set.

**FR (Functional Requirement)**
A specification of a system behaviour the product must exhibit. All FRs are catalogued in `docs/requirements/REQUIREMENTS.md` and referenced as FR-[AREA]-NNN.

---

## G

**Gap Scan**
Per RULE-BEHAVIOR.md Rule 1, the structured information-gap analysis performed by every phase agent before beginning phase work. Gaps are classified Tier 1 (MUST ASK), Tier 2 (SUGGEST & CONFIRM), or Tier 3 (HIGH-CONFIDENCE INFERENCE).

---

## H

**Health Record** `[PHI]`
A patient-uploaded document stored in AWS S3 (e.g., previous lab results, scan reports, discharge summaries). Each record has: file name, upload date, file type, S3 object key. Max file size: 10MB. Soft-deleted only (never physically removed — 10-year retention, BR-022). Visible only to the uploading patient.

**Human Gate**
A mandatory review and approval checkpoint between SDLC phases. No phase may begin until the preceding phase receives explicit `APPROVED` from the user. Defined in RULE-EXECUTION.md Rule 8 and Rule 11.

---

## I

**In Consultation**
An → Appointment Status indicating the doctor has initiated the consultation workflow for this appointment. The transition from `Scheduled` to `In Consultation` is triggered by the doctor clicking "Start Consultation". This status is only reachable on the appointment's actual date.

**IST (Indian Standard Time)**
UTC+5:30. All appointment times, slot generation, cancellation window calculations, and scheduled job triggers operate in IST. Stored as UTC in the database; displayed as IST in all UI and emails.

---

## J

**JWT (JSON Web Token)**
The authentication token issued to both patients and doctors after successful OTP verification. Expires after 24 hours. Contains: user_id, role, issued_at, expiry. Never contains PHI. Stored client-side; sent as Authorization header on API requests.

---

## L

**Location Model**
The approach used to represent a doctor's clinic location: two free-text fields (`city` and `area`). No GPS coordinates, no map API integration (A-02-008). Patient discovery filters by `city` only.

---

## M

**MCI Number**
Medical Council of India registration number. A required field for doctor registration (BR-016). Used during Admin Verification to confirm the doctor is a licensed practitioner. Not exposed to patients in the UI.

**Medicine** `[PHI]`
A single drug entry in a → Prescription. Required fields per medicine: drug name, dosage, frequency, duration. A prescription must contain at least one medicine entry.

**MSG91**
The third-party SMS gateway used to deliver OTPs for patient and doctor authentication. The only channel for OTP delivery. MedSlot does not send OTPs via email or any other channel.

**My Appointments**
The patient-facing view listing all of a patient's appointments (past and upcoming) with their current → Appointment Status. The entry point for → Patient Cancellation and for accessing → Prescription PDFs.

---

## N

**NFR (Non-Functional Requirement)**
A quality attribute constraint the system must satisfy. Classified per ISO/IEC 25010:2023. All NFRs are catalogued in `docs/requirements/REQUIREMENTS.md` and referenced as NFR-[AREA]-NNN.

**No-Show**
An → Appointment Status indicating the patient did not attend the scheduled appointment, as marked by the Doctor. A → Terminal State. No prescription is issued for a no-show. The slot is not automatically freed for rebooking.

---

## O

**OTP (One-Time Password)**
A 6-digit numeric code sent via SMS (→ MSG91) to a user's registered mobile number for authentication. Valid for 5 minutes (BR-001). Rate-limited to 5 OTPs per phone number per 60 minutes (BR-005, A-02-014). After 3 failed verification attempts within 10 minutes, the phone number is locked for 15 minutes (BR-002).

**Open Question (OQ)**
A decision item in the PRD that requires resolution before a specific downstream phase. Catalogued as OQ-NNN in `docs/prd/PRD.md`.

---

## P

**Patient**
An urban Indian adult who uses MedSlot to discover doctors, book appointments, manage health records, and receive prescriptions. One of three defined → Roles. Registered via OTP on mobile number.

**PatientProfile**
The Django model extending `CustomUser` for users with `role=patient`. Fields: name, date_of_birth, gender, email, mobile_number. All PHI fields marked `# PHI`.

**PHI (Protected Health Information)**
Any field or data element that, alone or in combination, could identify an individual and relates to their health status, healthcare, or payment for care. In MedSlot: diagnosis, prescription content, examination findings, chief complaint, medicine names, health record file names and contents. Django model fields containing PHI must carry an inline `# PHI` comment (BR-020). PHI must never appear in application logs (BR-019).

**Pre-Signed URL**
A time-limited AWS S3 URL granting temporary access to a private S3 object without requiring AWS credentials. Used for prescription PDF delivery and health record access. Prescription pre-signed URLs expire after 7 days (A-02-001). URLs can be regenerated on demand from the patient's My Appointments view.

**Prescription** `[PHI]`
A formal medication order issued by a Doctor for a Patient at the conclusion of a → Consultation. Contains: one or more → Medicines, clinical instructions (optional), and optional → Follow-Up Date. Immutable once issued (BR-028). Triggers → Prescription PDF generation.

**Prescription PDF** `[PHI]`
A generated PDF document representing the → Prescription. Produced asynchronously by → WeasyPrint from an HTML template (A-02-009). Stored in → AWS S3 with SSE-S3 encryption. Delivered to the patient via email as a → Pre-Signed URL. Contains: MedSlot header, doctor name and details, patient name, appointment date, diagnosis, medicines table, instructions, follow-up date, generation timestamp.

**Profile (Doctor)**
The public-facing representation of a doctor in → Doctor Discovery: specialty, name, clinic name, city, area, consultation hours, and optional bio. The detailed view also shows available → Slots for booking.

---

## R

**Razorpay Subscriptions**
The third-party recurring billing service used to manage MedSlot's → Doctor Subscription billing. Distinct from Razorpay's payment gateway product (which is not used by MedSlot — consultation fees are out of scope). Razorpay Subscriptions handles subscription creation, renewal, and cancellation lifecycle events via webhooks.

**Role**
The access classification of a MedSlot user. Three roles exist: `patient`, `doctor`, `admin`. Stored on `CustomUser.role`. Each role has distinct permission classes in the Django REST Framework layer (BR-013, BR-014, BR-015). No generic `IsAuthenticated` check is used where a role-specific check is required.

---

## S

**SaaS Subscription**
The commercial arrangement by which Doctors pay MedSlot a recurring monthly fee (₹1,000/month base case) to access the platform. Managed via → Razorpay Subscriptions. The first 30 days are a → Trial Period.

**SendGrid**
The third-party transactional email provider used by MedSlot for: booking confirmations, prescription delivery, appointment reminders, doctor approval/rejection notifications, and cancellation notifications.

**Slot**
A discrete bookable time unit generated from a doctor's → Availability Calendar. Defined by: doctor_id, date, start_time, end_time. Slots are generated for a rolling 30-day window (BR-008). A slot is either available (not booked), → Booked Slot, or blocked.

**Slot Duration**
The length of each appointment slot in minutes, configured by the doctor in their → Availability Calendar. Determines how many slots are generated per working day from the declared working hours.

**Soft Delete**
A deletion pattern where a record is flagged as deleted (`deleted=True`) in the database rather than physically removed. Used for → Health Records to comply with 10-year retention requirements (A-02-012, BR-022). Soft-deleted records are excluded from patient-facing queries but remain in the database.

**Specialty**
A fixed clinical specialisation category from the MedSlot taxonomy of 13 specialties (A-02-006, BR-029, BR-030). A doctor is assigned exactly one specialty at registration. The fixed list: General Physician, Dermatologist, Cardiologist, Orthopedist, Gynecologist & Obstetrics, Pediatrician, ENT Specialist, Ophthalmologist, Psychiatrist, Dentist, Neurologist, Diabetologist, General Surgeon. The list is seeded in the `Specialty` database table and is not editable by doctors.

**SSE-S3 (Server-Side Encryption with S3 Managed Keys)**
The AWS S3 encryption mode applied to all MedSlot objects (health records, prescription PDFs, credential documents). Encryption at rest is mandatory (NFR-SEC-007).

---

## T

**Terminal State**
An → Appointment Status from which no further transitions are permitted (BR-012). Terminal states: `Completed`, `Cancelled`, `No-Show`. Once an appointment reaches a terminal state, it is immutable.

**Trial Period**
The initial 30-day window after doctor account approval during which the Doctor has full access to MedSlot features without payment (A-02-003, FR-SUB-001). Managed by MedSlot (not a Razorpay Subscriptions trial). At expiry, the → DoctorSubscription status transitions to `Paused` if no active subscription exists.

**TLS (Transport Layer Security)**
The protocol used to encrypt all data in transit between clients and MedSlot servers. Minimum version: TLS 1.2 (NFR-SEC-008). Enforced at the load balancer/CloudFront layer.

---

## U

**Unbooked Slot**
A → Slot that has no associated appointment and is available for booking by a patient. Shown in the Doctor's available slot picker (next 7 days from patient's perspective; generated for 30 days).

---

## W

**WeasyPrint**
The server-side Python library used to render HTML templates to PDF. Used exclusively for → Prescription PDF generation. PDF generation is asynchronous (queued job) to meet the ≤ 4s end-to-end P95 target (A-02-009, NFR-PE-004). Version: 60.x.

---

## Z

**Zustand**
The client-side state management library used in the Next.js frontend. Manages: auth state (JWT, role, user_id), booking flow state (selected doctor, selected slot, booking step), and appointment session state.

---

*This glossary is normative. All SDLC agents and developers must use terms as defined here.*
*Last updated: Phase 3 — PRD. Update this file when new terms are introduced in subsequent phases.*
