# Use Cases — MedSlot

**Phase:** 2 — Requirements Engineering
**Version:** 1.0
**Date:** 2026-05-25
**Standard:** IEEE 29148:2018 — Use Case specification format

> Use cases document complex system interactions involving 3+ actors or 5+ steps. They complement user stories by specifying the system's exact response at each step including all error and alternative flows.

---

## UC-001 — Patient OTP Registration & First Login

**Use Case ID:** UC-001
**Name:** Patient OTP Registration and Account Creation
**Primary Actor:** Patient (Priya)
**Secondary Actors:** MSG91 (OTP delivery)
**User Stories Covered:** US-001, US-002

### Preconditions
- Priya's mobile number is not registered on MedSlot
- MSG91 OTP service is available
- Priya has a valid Indian mobile number

### Main Flow

| Step | Actor | Action | System Response |
|------|-------|--------|----------------|
| 1 | Priya | Navigates to registration/login page | System displays mobile number input form |
| 2 | Priya | Enters mobile number and clicks "Send OTP" | System validates format; calls MSG91 API; displays OTP input screen with 5-minute timer |
| 3 | MSG91 | Delivers 6-digit OTP via SMS | Priya receives SMS |
| 4 | Priya | Enters the 6-digit OTP | System verifies OTP (valid, within 5 minutes, correct digits) |
| 5 | System | OTP verified | System checks if phone number has an existing account |
| 6 | System | No account found | System creates new Patient account with role=patient; displays profile completion form |
| 7 | Priya | Enters name, DOB, gender, email; submits | System validates all fields; persists PatientProfile |
| 8 | System | Profile saved | System issues JWT token (24-hour expiry); redirects to patient home screen |

### Alternative Flows

**AF-001A: Returning user (account already exists)**
At Step 5: Account found → System skips profile form, issues JWT token, redirects to patient dashboard (login, not registration).

**AF-001B: OTP expires before entry**
At Step 4: OTP entered > 5 minutes after generation → System returns "OTP has expired — please request a new one"; returns to Step 2.

**AF-001C: Incorrect OTP entered**
At Step 4: OTP digits incorrect → System increments failure counter; returns "Invalid OTP — X attempts remaining." After 3 failures within 10 minutes: returns "Too many failed attempts. Try again in 15 minutes."

**AF-001D: MSG91 delivery failure**
At Step 2: MSG91 returns 5xx → System retries once after 2 seconds; if second attempt fails, returns "OTP delivery failed — please try again." No account is created.

**AF-001E: Invalid email at Step 7**
At Step 7: Email does not conform to RFC 5322 → System shows inline error on email field; profile not saved; Step 7 repeats.

### Postconditions

**Success:** Patient account created; PatientProfile persisted; JWT token issued; patient on home screen.
**Failure (timeout):** No account created; phone number available for re-registration.

### Business Rules Triggered
- BR-001 (OTP 5-minute expiry)
- BR-002 (lockout after 3 failures)
- BR-003 (one phone = one account)
- BR-004 (24-hour session)
- BR-005 (OTP rate limit)

---

## UC-002 — Doctor Self-Registration and Admin Approval

**Use Case ID:** UC-002
**Name:** Doctor Registration, Credential Submission, and Admin Verification
**Primary Actor:** Doctor (Dr. Arjun), Admin User
**Secondary Actors:** MSG91, SendGrid
**User Stories Covered:** US-012, US-013, US-022, US-023

### Preconditions
- Dr. Arjun's mobile number is not registered on MedSlot
- Admin panel is accessible to the Admin User
- MSG91 and SendGrid are available

### Main Flow

| Step | Actor | Action | System Response |
|------|-------|--------|----------------|
| 1 | Dr. Arjun | Navigates to Doctor Registration page | System displays doctor registration form |
| 2 | Dr. Arjun | Enters: name, mobile, specialty (from dropdown), MCI number, clinic name, area, city; uploads credential PDF (≤ 10MB); submits | System validates all required fields and file size |
| 3 | System | Validation passes | System generates OTP; calls MSG91 to send to Dr. Arjun's mobile |
| 4 | Dr. Arjun | Enters OTP | System verifies OTP |
| 5 | System | OTP verified | Creates Doctor account with status=Pending Verification; stores credential document in S3 (admin-access-only folder) |
| 6 | System | Account created | Sends notification email to Admin User via SendGrid; displays confirmation page to Dr. Arjun: "Application submitted. We'll notify you within 48 hours." |
| 7 | Admin User | Opens admin panel; navigates to verification queue; reviews Dr. Arjun's application and credential document | Admin panel displays: name, specialty, MCI number, submission date, credential document link |
| 8 | Admin User | Clicks "Approve" | System sets account status = Approved; sends approval email to Dr. Arjun |
| 9 | Dr. Arjun | Receives approval email; logs in via OTP | System verifies OTP; issues JWT with role=doctor; redirects to doctor dashboard |

### Alternative Flows

**AF-002A: Admin rejects application**
At Step 8: Admin clicks "Reject", enters reason → System sets status = Rejected; sends rejection email to Dr. Arjun with reason → Dr. Arjun sees "Application rejected" message on next login attempt → End.

**AF-002B: Dr. Arjun attempts login before approval**
At Step 9 (if attempted before Step 8): OTP verified but account status ≠ Approved → System returns "Your account is pending verification. You will be notified once approved." → Dashboard not accessible.

**AF-002C: Missing required field**
At Step 2: Any required field is empty → System displays inline field-level error; Step 2 repeats.

**AF-002D: Credential file exceeds 10MB**
At Step 2: File size > 10MB → System shows: "Credential document must not exceed 10MB"; Step 2 repeats.

### Postconditions

**Approved:** Doctor account with status=Approved; 30-day trial started; doctor on dashboard.
**Rejected:** Doctor account with status=Rejected; doctor notified with reason; cannot log in.

### Business Rules Triggered
- BR-003 (one phone = one account)
- BR-016 (MCI number mandatory)
- BR-017 (non-Approved doctors not in search)
- BR-018 (non-Approved doctors cannot access dashboard)
- BR-024 (30-day trial on approval)
- BR-029 (fixed specialty taxonomy)

---

## UC-003 — Patient Books Appointment

**Use Case ID:** UC-003
**Name:** End-to-End Appointment Booking
**Primary Actor:** Patient (Priya)
**Secondary Actors:** SendGrid, Doctor (Dr. Arjun — passive recipient)
**User Stories Covered:** US-003, US-004, US-005, US-006

### Preconditions
- Priya has an active Patient account (logged in)
- At least one Approved doctor with available slots exists
- SendGrid is available

### Main Flow

| Step | Actor | Action | System Response |
|------|-------|--------|----------------|
| 1 | Priya | Navigates to search page; selects specialty = "Cardiologist"; types city = "Hyderabad" | System returns filtered list of Approved Cardiologists in Hyderabad |
| 2 | Priya | Selects Dr. Arjun from results | System displays Dr. Arjun's full profile with available slots for the next 7 days |
| 3 | Priya | Selects slot: 2026-06-10 at 10:00am | System displays booking summary: doctor name, specialty, clinic address, date, time |
| 4 | Priya | Clicks "Confirm Booking" | System acquires row-level lock on the slot; verifies slot is still available |
| 5 | System | Slot is available | Creates Appointment record (status=Scheduled); releases lock |
| 6 | System | Appointment created | Removes slot from available slots display; sends booking confirmation email to Priya; sends new booking notification to Dr. Arjun |
| 7 | Priya | Booking confirmation displayed | System shows: "Appointment confirmed for 10 June 2026 at 10:00am with Dr. Arjun." |

### Alternative Flows

**AF-003A: Slot taken by concurrent booking**
At Step 4: Another patient already acquired the lock and booked the same slot → System releases lock; returns: "This slot is no longer available. Please choose another time." → Returns to Step 2 (profile with updated available slots).

**AF-003B: Unauthenticated patient selects a slot**
At Step 3 (if Priya is not logged in): System redirects to OTP registration/login flow; after successful OTP verification, returns to Step 3 with the slot pre-selected.

**AF-003C: Doctor has no available slots**
At Step 2: Doctor profile shows "No slots available in the next 7 days" → Priya returns to search results to select another doctor.

**AF-003D: Patient already has a Scheduled appointment with this doctor on the same date**
At Step 4: System detects existing Scheduled appointment for same patient + doctor + date → Returns: "You already have an appointment with Dr. Arjun on this date." → Returns to Step 2.

### Postconditions

**Success:** Appointment record created (status=Scheduled); slot removed from available pool; both parties notified by email.
**Failure:** No appointment created; slot remains available.

### Business Rules Triggered
- BR-006 (one slot, one patient)
- BR-007 (one patient, one doctor, one date)
- BR-008 (30-day slot window)
- BR-009 (only patients can book)

---

## UC-004 — Doctor Conducts Consultation and Issues Prescription

**Use Case ID:** UC-004
**Name:** Full Consultation Workflow — Notes to PDF Prescription Delivery
**Primary Actor:** Doctor (Dr. Arjun)
**Secondary Actors:** Patient (Priya — passive recipient), AWS S3, WeasyPrint, SendGrid
**User Stories Covered:** US-015, US-017, US-018, US-019, US-020

### Preconditions
- An Appointment with status=Scheduled exists for today
- The appointment belongs to Dr. Arjun
- AWS S3, WeasyPrint, and SendGrid are available

### Main Flow

| Step | Actor | Action | System Response |
|------|-------|--------|----------------|
| 1 | Dr. Arjun | Opens doctor dashboard; views today's appointments | System displays list of today's appointments sorted by time ascending |
| 2 | Dr. Arjun | Clicks "Start Consultation" on Priya's 10:00am appointment | System verifies appointment date = today; transitions status → In Consultation; displays consultation form |
| 3 | Dr. Arjun | Fills in: Chief Complaint = "Chest tightness on exertion", Examination Findings = "BP 140/90", Diagnosis = "Stable Angina Pectoris"; clicks "Save Draft" | System persists consultation notes; displays "Notes saved" confirmation |
| 4 | Dr. Arjun | Clicks "Issue Prescription"; adds medicines: Amlodipine 5mg / Once daily / 30 days; Aspirin 75mg / Once daily / 90 days; adds instructions: "Low sodium diet"; sets follow-up = 2026-07-10; submits | System validates prescription form (required fields: min 1 medicine with all sub-fields) |
| 5 | System | Validation passes | Persists Prescription record; queues PDF generation job |
| 6 | System | WeasyPrint generates PDF | PDF contains: MedSlot header, Dr. Arjun's details, Priya's name, appointment date, Chief Complaint, Diagnosis, medicines table, instructions, follow-up date, generation timestamp |
| 7 | System | PDF generated | Stores PDF in S3 at path: prescriptions/{priya_id}/{appointment_id}.pdf with SSE-S3 encryption |
| 8 | System | S3 storage confirmed | Sets appointment status → Completed; generates 7-day pre-signed URL; sends prescription delivery email to Priya with URL |
| 9 | Priya | Receives email | Email contains: Dr. Arjun's name, date, PDF download link |

### Alternative Flows

**AF-004A: Missing required notes field at prescription issuance**
At Step 4: Diagnosis field is empty → System shows inline error: "Diagnosis is required before issuing a prescription." → Step 4 repeats.

**AF-004B: WeasyPrint PDF generation failure**
At Step 6: WeasyPrint throws exception → System retries once; if second failure: logs ops alert; displays to Dr. Arjun: "Prescription generation failed. Please try again." → Appointment remains In Consultation; prescription record not committed.

**AF-004C: S3 upload failure**
At Step 7: S3 PUT fails → System retries 3× with jitter; if all fail: logs error; returns error to Dr. Arjun; no Prescription DB record committed → Appointment remains In Consultation.

**AF-004D: SendGrid email failure**
At Step 8: SendGrid returns 5xx → System retries 3× with exponential backoff; appointment is still marked Completed; prescription record is persisted → Priya can access the prescription via her My Appointments view even if email fails.

**AF-004E: Doctor marks appointment as No-Show (no consultation)**
At Step 2 (alternative — patient did not arrive): Dr. Arjun clicks "Mark as No-Show" on a past appointment → Status transitions → No-Show; no consultation form; no prescription issued; consultation workflow exits.

### Postconditions

**Success:** Appointment=Completed; Prescription record persisted; PDF in S3; Priya notified by email.
**PDF Failure:** Appointment remains In Consultation; Doctor notified; no prescription committed.

### Business Rules Triggered
- BR-012 (terminal status immutability)
- BR-019 (PHI not in logs)
- BR-020 (PHI field annotation)
- BR-021 (PHI access by doctor only)
- BR-023 (prescription only for In-Consultation appointments)
- BR-024 (prescription immutability)

---

## UC-005 — Patient Cancels Appointment

**Use Case ID:** UC-005
**Name:** Patient Initiates Appointment Cancellation
**Primary Actor:** Patient (Priya)
**Secondary Actors:** SendGrid (notification to Doctor)
**User Stories Covered:** US-008

### Preconditions
- Priya has a Scheduled appointment
- The appointment start time is more than 2 hours in the future

### Main Flow

| Step | Actor | Action | System Response |
|------|-------|--------|----------------|
| 1 | Priya | Navigates to "My Appointments"; locates the Scheduled appointment | System displays appointment with "Cancel" button |
| 2 | Priya | Clicks "Cancel" | System checks: appointment status=Scheduled AND current time < appointment start − 2 hours |
| 3 | System | Check passes | Displays confirmation modal: "Are you sure you want to cancel your appointment with Dr. Arjun on 10 June at 10:00am?" |
| 4 | Priya | Confirms cancellation | System sets appointment status = Cancelled; frees the slot |
| 5 | System | Status updated | Sends cancellation notification email to Dr. Arjun: "Priya has cancelled the appointment on 10 June at 10:00am." |
| 6 | Priya | Sees confirmation | "Your appointment has been cancelled." displayed; appointment shows status=Cancelled in her list |

### Alternative Flows

**AF-005A: Cancellation attempted within 2-hour window**
At Step 2: current time ≥ appointment start − 2 hours → System returns: "Cancellations are not allowed within 2 hours of the appointment." → No status change.

**AF-005B: Appointment already in terminal status**
At Step 2: Appointment status is already Cancelled/Completed/No-Show → System returns: "This appointment is already closed."

### Postconditions

**Success:** Appointment=Cancelled; slot freed; Dr. Arjun notified.
**Blocked:** Appointment remains Scheduled; patient shown reason.

### Business Rules Triggered
- BR-010 (2-hour cancellation window)
- BR-012 (terminal status immutability)

---

## UC-006 — Doctor Manages Availability Calendar

**Use Case ID:** UC-006
**Name:** Doctor Configures Working Days, Hours, and Blocked Dates
**Primary Actor:** Doctor (Dr. Arjun)
**Secondary Actors:** None
**User Stories Covered:** US-014

### Preconditions
- Dr. Arjun is logged in with status=Approved
- Dr. Arjun has an active subscription (Trial or Active)

### Main Flow

| Step | Actor | Action | System Response |
|------|-------|--------|----------------|
| 1 | Dr. Arjun | Navigates to "Availability Settings" | System displays calendar configuration form with current settings (or defaults if first setup) |
| 2 | Dr. Arjun | Selects working days: Mon, Tue, Wed, Thu, Fri (checks each) | Form updates to show working hours inputs for each selected day |
| 3 | Dr. Arjun | Sets working hours for each day: 9:00am–1:00pm; selects slot duration: 30 minutes | Form shows preview of generated slots (e.g., "8 slots per day") |
| 4 | Dr. Arjun | Clicks "Save Availability" | System validates no end-time ≤ start-time |
| 5 | System | Validation passes | Saves AvailabilityCalendar record; triggers slot generation for next 30 days |
| 6 | System | Slots generated | Displays: "Availability saved. 8 slots per working day for the next 30 days." |
| 7 | Dr. Arjun | Navigates to "Block Dates"; selects 2026-06-15 as a leave day | System marks 2026-06-15 as blocked; removes all generated slots for that date |
| 8 | System | Blocked dates updated | Any existing Scheduled appointments on 2026-06-15 are unaffected (not cancelled) |

### Alternative Flows

**AF-006A: Invalid time range**
At Step 4: Any working day has end time ≤ start time → System shows inline error: "End time must be after start time for [day]." → Step 3 repeats.

**AF-006B: Calendar change with existing bookings**
At Step 5: Some slots in the new calendar conflict with already-booked appointments → System saves the calendar change; existing Scheduled appointments are preserved unchanged; new calendar applies only to as-yet-unbooked future slots.

**AF-006C: Doctor deselects a currently working day**
At Step 2: Dr. Arjun unchecks Wednesday → System removes Wednesday slots for future unbooked dates; any Scheduled appointments on upcoming Wednesdays remain unchanged.

### Postconditions

**Success:** AvailabilityCalendar saved; slot window regenerated for 30 days; existing appointments unaffected.

### Business Rules Triggered
- BR-008 (30-day slot window)
- BR-011 (calendar changes do not affect existing booked appointments — FR-CAL-004)
