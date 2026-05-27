# Business Rules Catalog — MedSlot

**Phase:** 2 — Requirements Engineering
**Version:** 1.0
**Date:** 2026-05-25
**Standard:** BABOK v3 — Section 8.2 (Business Rules Analysis)

> Business rules are domain-level constraints that govern system behaviour regardless of which software feature implements them. They are separated from functional requirements because they often apply across multiple features and remain stable across releases.

---

## BR-AUTH — Authentication Rules

| ID | Business Rule | Authority | Applies To |
|----|--------------|-----------|-----------|
| BR-001 | An OTP code expires exactly 5 minutes after the moment of generation. Any verification attempt submitted after this window SHALL be rejected. | Security policy — OWASP OTP guidance recommends ≤ 10-minute OTP validity; MedSlot adopts 5 minutes for tighter security. | FR-AUTH-001, FR-AUTH-002 |
| BR-002 | A maximum of 3 consecutive failed OTP verification attempts for the same phone number within any 10-minute window triggers a 15-minute OTP lockout for that phone number. The lockout counter resets after 10 minutes of inactivity. | Security policy — OWASP Brute Force Prevention guideline; prevents enumeration attacks on the OTP endpoint. | FR-AUTH-003 |
| BR-003 | Each mobile phone number may be registered to exactly one user account on the platform. A phone number already associated with a Patient account cannot be used to register a Doctor account, and vice versa. | MedSlot business policy — one verified identity per phone number; prevents account confusion in a health context. | FR-REG-PAT-001, FR-REG-DOC-001 |
| BR-004 | An authenticated user session expires after 24 hours of inactivity or from the time of token issuance, whichever comes first. The user must re-authenticate via OTP. | MedSlot business policy — balances session convenience against health data access security. | FR-AUTH-004, FR-AUTH-006 |
| BR-005 | OTP generation is rate-limited to a maximum of 5 requests per phone number per 60-minute rolling window. This limit applies regardless of whether the previous OTPs were verified or expired. | Security policy — prevents SMS abuse/toll fraud; OWASP API Security Top 10 (API4 — Unrestricted Resource Consumption). | FR-AUTH-006 |

---

## BR-BOOK — Booking Rules

| ID | Business Rule | Authority | Applies To |
|----|--------------|-----------|-----------|
| BR-006 | An appointment slot may be held by exactly one patient at any point in time. The system must prevent double-booking using database-level concurrency controls (row-level locking or equivalent). | Physical resource constraint — a doctor can only see one patient per time slot. | FR-BOOK-001, FR-BOOK-002 |
| BR-007 | A patient may not hold more than one appointment with the same doctor that is in "Scheduled" status on the same calendar date (in IST). A second booking attempt for the same doctor on the same date is rejected until the existing appointment is completed, cancelled, or becomes a no-show. | MedSlot business policy — prevents time-slot gaming and back-to-back booking abuse. | FR-BOOK-004 |
| BR-008 | Appointment slots are generated for a rolling 30-day window from the current calendar date (IST). Slots beyond 30 days are not displayed or bookable. The window advances by one day each midnight (IST). | MedSlot business policy — balances booking horizon against doctor schedule commitment certainty. | FR-CAL-002, FR-CAL-005 |
| BR-009 | Only users with the Patient role may book appointments. Doctor and Admin role users are excluded from the booking flow. | MedSlot business policy — doctors are service providers on the platform, not consumers; prevents operational conflict. | FR-BOOK-006 |

---

## BR-CANCEL — Cancellation Rules

| ID | Business Rule | Authority | Applies To |
|----|--------------|-----------|-----------|
| BR-010 | A patient may cancel an appointment only if the current date-time (IST) is more than 2 hours before the appointment start time. Any cancellation attempt within the 2-hour window SHALL be rejected with an explanatory error message. | MedSlot business policy — confirmed in Phase 2 requirements gap scan (2026-05-25); gives doctors adequate notice to fill slots. | FR-APPT-004 |
| BR-011 | A doctor may cancel an appointment at any time before the appointment start time, with no minimum notice restriction. | MedSlot business policy — confirmed in Phase 2 requirements gap scan (2026-05-25); doctors must retain control over their schedule. | FR-APPT-005 |
| BR-012 | An appointment that has reached any terminal status (Completed, No-Show, or Cancelled) cannot be transitioned to any other status by any user role, including Admin. Terminal status transitions are irreversible. | Data integrity requirement — medical records must reflect actual clinical events; retroactive changes would compromise audit integrity. | FR-APPT-006 |

---

## BR-ROLE — Role and Access Rules

| ID | Business Rule | Authority | Applies To |
|----|--------------|-----------|-----------|
| BR-013 | A Patient account SHALL NOT access any Doctor dashboard endpoint, any Admin panel endpoint, or any resource owned by another patient. | Role separation — CLAUDE.md coding standard: "never use a single generic IsAuthenticated check where a role-specific check is required." | FR-AUTH-005, all FR-APPT, FR-CONSULT, FR-ADMIN |
| BR-014 | A Doctor account SHALL NOT access any Patient health records, any other doctor's appointments, or any Admin panel endpoint. | Role separation — CLAUDE.md coding standard; health data access must be strictly scoped. | FR-AUTH-005, all FR-RECORD, FR-ADMIN |
| BR-015 | An Admin account is a distinct account type. Admin users cannot simultaneously hold Patient or Doctor roles. An Admin account cannot be created through the self-registration flow — Admin accounts are provisioned internally. | Principle of least privilege — OWASP security best practice; prevents privilege escalation via self-registration. | FR-ADMIN-006 |

---

## BR-VERIFY — Doctor Verification Rules

| ID | Business Rule | Authority | Applies To |
|----|--------------|-----------|-----------|
| BR-016 | A Doctor account with status other than "Approved" SHALL NOT appear in patient search results, doctor profile pages accessible to patients, or any public-facing listing. | MedSlot trust policy — only MCI-verified practitioners are discoverable; unverified doctors appearing on the platform creates regulatory and reputational risk. | FR-SEARCH-001, FR-REG-DOC-002 |
| BR-017 | A Doctor account with status "Pending Verification", "Rejected", or "Suspended" cannot access the Doctor dashboard, create or modify availability slots, or initiate any consultation workflow. | MedSlot business policy — dashboard access requires an active, verified account. | FR-REG-DOC-002, FR-ADMIN-004 |
| BR-018 | MCI (Medical Council of India) registration number is a mandatory field at doctor registration and must be stored in the DoctorProfile record for credential audit purposes. The MCI number cannot be changed by the doctor via self-service after submission. | Medical Council of India regulations — all allopathic practitioners must hold a valid MCI/State Council registration. MedSlot's verification workflow cross-checks this number. | FR-REG-DOC-001, FR-PROFILE-004 |

---

## BR-PHI — Protected Health Information Rules

| ID | Business Rule | Authority | Applies To |
|----|--------------|-----------|-----------|
| BR-019 | Health records, consultation notes, prescription content, and patient demographics are classified as Personal Health Information (PHI) and SHALL NOT appear in application logs in plaintext under any circumstances, including error logs and debug output. | CLAUDE.md data privacy coding standard; Indian Information Technology Act 2000 (sensitive personal data provisions). | NFR-MAIN-003, NFR-SEC-011 |
| BR-020 | All Django model fields containing PHI must include an explicit inline comment `# PHI` in the model class definition. This annotation is mandatory and is verified in code review. | CLAUDE.md data privacy coding standard — enables automated PHI field discovery during security audits. | NFR-MAIN-005 |
| BR-021 | Consultation notes are accessible only to: (a) the doctor who created them, during the consultation session, and (b) the patient, via their delivered prescription PDF, in read-only form. No other role or user may access raw consultation note data. | Medical privacy practice; BABOK v3 data privacy principle. | FR-CONSULT-005, FR-RX-003 |

---

## BR-DATA — Data Retention Rules

| ID | Business Rule | Authority | Applies To |
|----|--------------|-----------|-----------|
| BR-022 | Health records, prescription PDFs, consultation notes, and appointment records must be retained for a minimum of 10 years from the date of creation, regardless of patient account status or doctor subscription status. Soft deletion is the only permitted deletion mechanism. | Indian medical records retention guidelines (standard medical practice — 10-year retention is the accepted minimum); aligned with CLAUDE.md NFR. | FR-RECORD-005 |
| BR-023 | If a doctor's subscription lapses or account is suspended, the patient's existing appointment records, consultation history, and received prescription PDFs SHALL remain accessible to the patient (read-only) for a minimum of 90 days from the date of suspension. MedSlot must not make patient medical data inaccessible as a side effect of a commercial dispute with a doctor. | MedSlot business policy — data portability and patient welfare; confirmed in Phase 1 assumption resolution. | FR-SUB-005 |

---

## BR-SUB — Subscription Rules

| ID | Business Rule | Authority | Applies To |
|----|--------------|-----------|-----------|
| BR-024 | Every doctor account is granted a 30-day trial period beginning from the date the account is approved by admin. During the trial, the doctor has full dashboard access without a paid subscription. | MedSlot subscription policy — confirmed in Phase 2 requirements gap scan (2026-05-25). | FR-SUB-001 |
| BR-025 | A doctor account must have subscription status of either "Trial" or "Active" to access dashboard features. A doctor with status "Payment Failed" retains read-only access to their historical appointment records for 7 days, after which dashboard access is fully suspended. | MedSlot subscription policy — gives doctors a grace period to resolve payment issues before losing access. | FR-SUB-005 |
| BR-026 | Razorpay webhook events that modify doctor subscription status must pass HMAC-SHA256 signature validation before any state change is applied. Events that fail validation are rejected and logged as security alerts without modifying any system state. | Security policy — webhook signature validation prevents unauthorized subscription state manipulation; Razorpay API security documentation. | FR-SUB-006 |

---

## BR-RX — Prescription Rules

| ID | Business Rule | Authority | Applies To |
|----|--------------|-----------|-----------|
| BR-027 | A prescription may only be issued for an appointment currently in status "In Consultation". Prescriptions cannot be backdated or issued retroactively for appointments marked "No-Show", "Cancelled", or "Completed". | Medical best practice — prescriptions must be tied to an actual, in-progress clinical encounter to ensure safety and legal validity. | FR-RX-001 |
| BR-028 | Once a prescription is created and stored, it is permanently immutable. No user role — including Admin — may edit or delete a prescription record or its associated PDF. If a prescription contains an error, a new consultation appointment must be booked. | Medical regulatory practice — prescription integrity is a legal requirement; unilateral modification of a issued prescription is medically and legally impermissible. | FR-RX-008 |

---

## BR-SPECIALTY — Specialty Taxonomy Rules

| ID | Business Rule | Authority | Applies To |
|----|--------------|-----------|-----------|
| BR-029 | Doctor specialty must be selected from the platform-defined fixed taxonomy. Free-text specialty entry is not permitted. The taxonomy for v1 is fixed at 13 specialties: General Physician, Dermatologist, Cardiologist, Orthopedist, Gynecologist & Obstetrics, Pediatrician, ENT Specialist, Ophthalmologist, Psychiatrist, Dentist, Neurologist, Diabetologist, General Surgeon. | MedSlot business policy — confirmed in Phase 2 requirements gap scan (2026-05-25); ensures consistent search taxonomy and prevents discovery inconsistencies. | FR-REG-DOC-001, FR-SEARCH-001 |
| BR-030 | Additions to the specialty taxonomy require a platform-level configuration change (database seed update) and are not self-serviceable by doctors or admins through the UI in v1. | MedSlot business policy — taxonomy changes require deliberate governance to maintain search quality. | FR-REG-DOC-001 |
