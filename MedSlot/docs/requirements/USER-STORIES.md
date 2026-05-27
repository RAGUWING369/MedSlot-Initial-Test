# User Stories — MedSlot

**Phase:** 2 — Requirements Engineering
**Version:** 1.0
**Date:** 2026-05-25
**Standard:** INVEST criteria (Bill Wake, 2003); BDD Given/When/Then (Dan North)

> All stories use specific persona names. MoSCoW priority applied across all stories. Every story has ≥ 2 BDD acceptance criteria (1 happy path + 1 edge/error case).

---

## Persona Reference

| Persona | Description |
|---------|-------------|
| **Priya** | Urban Indian patient, 34, Bengaluru; books appointments via mobile web |
| **Dr. Arjun** | Independent Cardiologist, Hyderabad; solo clinic; moderate tech proficiency |
| **Admin User** | MedSlot ops team member; verifies doctor applications |

---

## MUST HAVE Stories

---

### US-001 — Patient OTP Registration

**As Priya**, I want to register on MedSlot using my mobile number and an OTP, so that I can create a verified account without needing a password.

**Priority:** Must Have | **Size:** S | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Successful new patient registration
Given Priya is a new user (phone number not registered)
When she enters her mobile number and requests an OTP
And she enters the 6-digit OTP within 5 minutes
And she completes the profile form (name, DOB, gender, email)
Then her Patient account is created with role = patient
And she is logged in and redirected to the patient home screen

Scenario: OTP entered after expiry
Given Priya requested an OTP
When she enters the correct OTP more than 5 minutes after generation
Then the system returns "OTP has expired — please request a new one"
And no account is created

Scenario: Existing phone number attempted for registration
Given Priya's number is already registered
When she submits the OTP for a number already linked to an account
Then the system logs her in (rather than creating a duplicate account)

Scenario: Invalid email address at profile completion
Given Priya verified her OTP successfully
When she enters "priya@" as her email address in the profile form
Then the system shows an inline error on the email field: "Please enter a valid email address"
And the form is not submitted
```

---

### US-002 — Patient Login

**As Priya**, I want to log in using my mobile number and OTP, so that I can access my appointments and health records securely without remembering a password.

**Priority:** Must Have | **Size:** S | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Successful returning patient login
Given Priya is a registered patient
When she enters her mobile number and requests an OTP
And she enters the correct OTP within 5 minutes
Then she receives a JWT access token
And she is redirected to her patient dashboard

Scenario: OTP lockout after repeated failures
Given Priya requests an OTP for login
When she enters an incorrect OTP 3 times within 10 minutes
Then the system locks OTP requests for her number for 15 minutes
And displays: "Too many failed attempts. Try again in 15 minutes."
```

---

### US-003 — Doctor Search by Specialty

**As Priya**, I want to search for doctors by medical specialty, so that I can find the right type of doctor for my health concern without calling clinics.

**Priority:** Must Have | **Size:** S | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Patient searches by specialty
Given Priya is on the search page (authenticated or unauthenticated)
When she selects "Cardiologist" from the specialty dropdown
Then the system returns a list of Approved doctors with specialty = Cardiologist
And each result shows: doctor name, specialty, clinic name, area, city, next available date

Scenario: No doctors available for selected specialty
Given Priya selects "Neurologist" from the specialty dropdown
When no Approved doctors exist with that specialty
Then the system displays: "No doctors found for this specialty. Try a different filter."
And no results are shown

Scenario: Pending/Suspended doctor excluded from results
Given a doctor with status = "Pending Verification" has specialty = Cardiologist
When Priya searches for Cardiologists
Then that doctor does not appear in the results
```

---

### US-004 — Doctor Search Filter by City

**As Priya**, I want to filter doctor search results by city, so that I only see doctors in my city and can easily reach their clinic.

**Priority:** Must Have | **Size:** XS | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Specialty + city combined filter
Given Priya has selected specialty = "General Physician"
When she also types "Bengaluru" in the city filter
Then the results show only General Physicians with clinic_city = Bengaluru

Scenario: City filter with no matching doctors
Given Priya filters by city = "Shimla"
When no Approved doctors have clinic_city = Shimla
Then the system shows: "No doctors found in Shimla."
```

---

### US-005 — View Doctor Profile

**As Priya**, I want to view a doctor's full profile including available slots, so that I can make an informed decision before booking.

**Priority:** Must Have | **Size:** S | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Patient views full doctor profile
Given Dr. Arjun is an Approved doctor with availability configured
When Priya navigates to Dr. Arjun's profile page
Then she sees: Dr. Arjun's name, specialty, "MCI Verified" indicator,
  clinic name, full clinic address, and available slots for the next 7 days

Scenario: Profile shows only available (unbooked) slots
Given Dr. Arjun has 3 slots on a given day: 9am (booked), 9:30am (available), 10am (available)
When Priya views Dr. Arjun's profile
Then she sees only the 9:30am and 10am slots — the 9am slot is not shown

Scenario: Unauthenticated access to profile
Given Priya is not logged in
When she navigates to a doctor's profile page
Then the profile loads successfully (public page)
And if she clicks "Book", she is redirected to OTP registration/login
```

---

### US-006 — Book Appointment

**As Priya**, I want to book a specific appointment slot with a doctor, so that I have a confirmed time and avoid walk-in queues.

**Priority:** Must Have | **Size:** M | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Successful appointment booking
Given Priya is logged in and viewing Dr. Arjun's profile
When she selects the 9:30am slot on 2026-06-10 and confirms
Then an Appointment record is created with status = Scheduled
And the slot is removed from the available slots display
And Priya receives a booking confirmation email within 60 seconds
And Dr. Arjun receives a new booking notification email within 60 seconds

Scenario: Slot taken by concurrent booking
Given Priya and another patient attempt to book the same slot simultaneously
When both submit the booking request at the same time
Then exactly one booking succeeds
And the other receives: "This slot is no longer available. Please choose another time."

Scenario: Patient attempts second booking same doctor same day
Given Priya has a Scheduled appointment with Dr. Arjun on 2026-06-10
When she attempts to book another slot with Dr. Arjun on 2026-06-10
Then the system returns: "You already have an appointment with this doctor on this date."

Scenario: Unauthenticated user tries to book
Given Priya is not logged in
When she selects a slot and clicks "Book"
Then she is redirected to the OTP login/registration flow
And after successful OTP verification, the booking flow resumes from the slot selection step
```

---

### US-007 — View My Appointments (Patient)

**As Priya**, I want to see all my upcoming and past appointments in one place, so that I can track my medical visits and prepare for upcoming ones.

**Priority:** Must Have | **Size:** S | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Patient views appointment list
Given Priya has 2 upcoming and 3 past appointments
When she navigates to "My Appointments"
Then she sees all 5 appointments, sorted by date descending
And each entry shows: doctor name, specialty, date, time, clinic, status

Scenario: No appointments
Given Priya has no appointments on the platform
When she navigates to "My Appointments"
Then she sees: "You have no appointments yet. Find a doctor to get started."
```

---

### US-008 — Cancel Appointment (Patient)

**As Priya**, I want to cancel an upcoming appointment if my plans change, so that I can free up the slot for another patient and manage my schedule.

**Priority:** Must Have | **Size:** S | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Successful cancellation (within allowed window)
Given Priya has a Scheduled appointment at 3pm
And the current time is 11am (> 2 hours before)
When she clicks "Cancel" and confirms the cancellation
Then the appointment status changes to Cancelled
And Dr. Arjun receives a cancellation notification email within 60 seconds
And the slot becomes available again for other patients

Scenario: Cancellation rejected (within 2-hour window)
Given Priya has a Scheduled appointment at 3pm
And the current time is 1:30pm (< 2 hours before)
When she clicks "Cancel"
Then the system shows: "Cancellations are not allowed within 2 hours of the appointment."
And the appointment status remains Scheduled

Scenario: Cancellation of already-cancelled appointment
Given an appointment already has status = Cancelled
When Priya attempts to cancel it again
Then the system returns: "This appointment has already been cancelled."
```

---

### US-009 — Upload Health Record

**As Priya**, I want to upload my previous health records (lab reports, X-rays, prescriptions from other doctors), so that I have all my health history in one place and can share it with my doctor during a consultation.

**Priority:** Must Have | **Size:** S | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Successful health record upload
Given Priya is logged in and on the "My Records" page
When she uploads a PDF file named "blood_test.pdf" (3MB)
Then the file is stored in S3 with SSE-S3 encryption
And the record appears in her list with the original filename and upload date

Scenario: File too large
Given Priya attempts to upload a file of 12MB
When she submits the upload
Then the system returns: "File size exceeds the 10MB limit. Please upload a smaller file."
And no file is stored

Scenario: Invalid file format
Given Priya attempts to upload a .docx file
When she submits the upload
Then the system returns: "Only PDF, JPEG, and PNG files are supported."
```

---

### US-010 — View Received Prescription

**As Priya**, I want to view prescriptions I have received from doctors on MedSlot, so that I have a permanent digital record of my treatment history.

**Priority:** Must Have | **Size:** S | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Patient views prescription after consultation
Given Dr. Arjun issued a prescription for Priya's appointment
When Priya navigates to "My Appointments" and opens the completed appointment
Then she sees a "View Prescription" link
And clicking it either opens the PDF or triggers a download

Scenario: Expired prescription link regeneration
Given the 7-day pre-signed URL on Priya's prescription has expired
When she clicks "View Prescription"
Then a fresh 7-day pre-signed URL is generated on demand
And the PDF opens/downloads successfully
```

---

### US-011 — Download Prescription PDF

**As Priya**, I want to download my prescription as a PDF, so that I can save it locally, print it at a pharmacy, or share it with a family member.

**Priority:** Must Have | **Size:** XS | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Successful PDF download
Given Priya has a completed appointment with a prescription
When she clicks "Download Prescription"
Then the browser downloads or opens the PDF
And the PDF contains: doctor name, clinic, date, diagnosis, medicine list

Scenario: Fresh link after expiry
Given the 7-day link has expired
When Priya clicks "Download Prescription"
Then the system silently regenerates a fresh link and the download proceeds
```

---

### US-012 — Doctor Registration

**As Dr. Arjun**, I want to register on MedSlot by submitting my credentials for verification, so that I can have an approved presence on the platform and start receiving patient bookings.

**Priority:** Must Have | **Size:** M | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Successful doctor registration submission
Given Dr. Arjun accesses the doctor registration page
When he fills in all required fields (name, mobile, specialty=Cardiologist,
  MCI number, clinic name, clinic area, clinic city, credential PDF)
  and submits
Then his account is created with status = Pending Verification
And the Admin receives a notification email within 60 seconds
And Dr. Arjun sees a confirmation: "Application submitted. We will notify you within 48 hours."

Scenario: Registration with missing required field
Given Dr. Arjun fills in all fields except MCI number
When he submits the form
Then an inline error appears on the MCI number field: "MCI Registration Number is required."
And the form is not submitted

Scenario: Credential document exceeds 10MB
Given Dr. Arjun attaches a 15MB PDF as his credential document
When he submits the form
Then the system shows: "Credential document must not exceed 10MB."
```

---

### US-013 — Doctor Login

**As Dr. Arjun**, I want to log in to MedSlot using my mobile OTP, so that I can access my appointment dashboard securely.

**Priority:** Must Have | **Size:** S | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Successful approved doctor login
Given Dr. Arjun's account has status = Approved
When he verifies his OTP successfully
Then he receives a JWT token with role = doctor
And is redirected to the doctor dashboard (today's appointments)

Scenario: Login attempt before approval
Given Dr. Arjun's account has status = Pending Verification
When he successfully verifies his OTP
Then the system returns: "Your account is pending verification. You will be notified once approved."
And no dashboard access is granted
```

---

### US-014 — Configure Availability Calendar

**As Dr. Arjun**, I want to set my working days, hours, and appointment slot duration, so that patients can only book me during my actual available times.

**Priority:** Must Have | **Size:** M | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Successful calendar configuration
Given Dr. Arjun is logged in and navigates to Availability Settings
When he selects Mon-Fri as working days, 9:00am–1:00pm as hours,
  and 30 minutes as slot duration
Then the system generates slots: 9:00, 9:30, 10:00, 10:30, 11:00, 11:30, 12:00, 12:30
  for each weekday within the next 30 days
And these slots appear on his public profile

Scenario: Block a specific date
Given Dr. Arjun has working days including Monday
When he blocks 2026-06-08 (a Monday) as a leave day
Then no slots are generated for 2026-06-08
And existing Scheduled appointments on that date are unaffected

Scenario: Invalid time range
Given Dr. Arjun sets working hours end time = 8:00am and start time = 9:00am
When he attempts to save
Then the system shows: "End time must be after start time."
```

---

### US-015 — View Today's Appointments (Doctor)

**As Dr. Arjun**, I want to see all my appointments for today at a glance when I log in, so that I can quickly understand my schedule and call the next patient.

**Priority:** Must Have | **Size:** S | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Doctor views today's schedule
Given Dr. Arjun has 4 appointments today (2 Scheduled, 1 Completed, 1 Cancelled)
When he opens the doctor dashboard
Then he sees all 4 appointments sorted by time ascending
And each entry shows: patient name, appointment time, status

Scenario: No appointments today
Given Dr. Arjun has no appointments on today's date
When he opens the dashboard
Then he sees: "No appointments scheduled for today."
```

---

### US-016 — View Upcoming Appointments (Doctor)

**As Dr. Arjun**, I want to see my upcoming appointments for the next 30 days, so that I can plan ahead and manage my workload.

**Priority:** Must Have | **Size:** XS | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Doctor views upcoming appointments
Given Dr. Arjun has 10 Scheduled appointments over the next 30 days
When he navigates to "Upcoming Appointments"
Then he sees all 10 appointments sorted by date-time ascending
And appointments beyond 30 days from today are not shown
```

---

### US-017 — Open Consultation

**As Dr. Arjun**, I want to open a consultation session for a patient's appointment, so that I can record my clinical notes before issuing a prescription.

**Priority:** Must Have | **Size:** S | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Doctor opens today's consultation
Given Dr. Arjun has a Scheduled appointment for today at 10:00am
When he clicks "Start Consultation" on that appointment
Then the appointment status transitions to "In Consultation"
And the consultation notes form is displayed

Scenario: Attempt to open consultation for a future date
Given Dr. Arjun has a Scheduled appointment for tomorrow
When he attempts to click "Start Consultation"
Then the system shows: "Consultation can only be started on the day of the appointment."
And the appointment status remains Scheduled
```

---

### US-018 — Write Consultation Notes

**As Dr. Arjun**, I want to record structured consultation notes (chief complaint, diagnosis, plan), so that the clinical encounter is documented and feeds into the prescription.

**Priority:** Must Have | **Size:** S | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Doctor saves draft notes
Given an appointment is In Consultation
When Dr. Arjun fills in Chief Complaint = "Chest pain" and Diagnosis = "Stable Angina"
  and clicks "Save Draft"
Then the notes are persisted to the appointment record
And Dr. Arjun can continue to the prescription form

Scenario: Required fields missing at prescription issuance
Given Dr. Arjun left the Diagnosis field empty
When he attempts to issue a prescription
Then the system shows: "Diagnosis is required before issuing a prescription."
And the prescription is not created

Scenario: Attempt to edit notes after completion
Given an appointment status is Completed
When Dr. Arjun tries to edit the consultation notes
Then the system returns: "Consultation notes are locked once the appointment is complete."
```

---

### US-019 — Issue Prescription

**As Dr. Arjun**, I want to issue a digital prescription to the patient after the consultation, so that the patient receives a formatted PDF by email without me printing or writing anything.

**Priority:** Must Have | **Size:** M | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Successful prescription issuance
Given an appointment is In Consultation with notes saved
When Dr. Arjun adds medicines (e.g., Amlodipine 5mg, Once daily, 30 days),
  optional instructions, and clicks "Issue Prescription"
Then a prescription record is created and PDF is generated
And the PDF is stored in S3
And Priya receives a prescription delivery email with the PDF link within 60 seconds
And the appointment status transitions to "Completed"

Scenario: Prescription with multiple medicines
Given Dr. Arjun adds 4 medicines to the prescription
When he issues the prescription
Then all 4 medicines appear correctly in the generated PDF

Scenario: PDF generation failure
Given the WeasyPrint service encounters an error
When the prescription is submitted
Then the system retries once
And if the second attempt also fails, an ops alert is logged
And Dr. Arjun sees: "Prescription generation failed. Please try again."
And the appointment remains In Consultation (not Completed)
```

---

### US-020 — Mark Appointment Outcome

**As Dr. Arjun**, I want to mark an appointment as completed (with prescription) or as a no-show, so that my appointment records accurately reflect what happened.

**Priority:** Must Have | **Size:** XS | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Mark as No-Show
Given an appointment's start time has passed
And the patient did not attend
When Dr. Arjun clicks "Mark as No-Show"
Then the appointment status is set to "No-Show"
And the slot is freed for future booking consideration

Scenario: Attempt to mark No-Show before appointment time
Given an appointment is scheduled for 3pm and it is 2pm
When Dr. Arjun tries to mark it as No-Show
Then the system shows: "No-Show can only be marked after the appointment start time."

Scenario: Attempt to change a terminal status
Given an appointment already has status = No-Show
When Dr. Arjun attempts to change the status
Then the system returns: "This appointment is already closed."
```

---

### US-021 — Doctor Cancels Appointment

**As Dr. Arjun**, I want to cancel a patient's appointment if I am unavailable, so that the patient knows in advance and can book elsewhere.

**Priority:** Must Have | **Size:** S | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Doctor cancels scheduled appointment
Given Dr. Arjun has a Scheduled appointment tomorrow
When he clicks "Cancel Appointment" and confirms
Then the appointment status is set to Cancelled
And Priya receives a cancellation email within 60 seconds
And the slot is freed for other patients

Scenario: Doctor attempts to cancel after appointment start time
Given the appointment start time has passed
When Dr. Arjun attempts to cancel
Then the system shows: "The appointment start time has passed. Please use Mark as No-Show."
```

---

### US-022 — Admin Reviews Doctor Applications

**As the Admin User**, I want to see all pending doctor applications in a queue, so that I can review and verify their credentials systematically.

**Priority:** Must Have | **Size:** S | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Admin views pending applications
Given 5 doctors have status = Pending Verification
When the Admin accesses the admin panel verification queue
Then all 5 applications are listed with: name, specialty, MCI number, submission date, credential document link

Scenario: Admin with no applications in queue
Given no doctors have status = Pending Verification
When the Admin accesses the queue
Then the panel shows: "No applications pending verification."
```

---

### US-023 — Admin Approves or Rejects Doctor

**As the Admin User**, I want to approve or reject a doctor's application, so that only verified practitioners appear on the platform.

**Priority:** Must Have | **Size:** S | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Admin approves doctor application
Given the Admin has reviewed Dr. Arjun's application and found credentials valid
When the Admin clicks "Approve"
Then Dr. Arjun's account status changes to Approved
And Dr. Arjun receives an approval email: "Your MedSlot account is approved!"
And Dr. Arjun can now log in and access the doctor dashboard

Scenario: Admin rejects with reason
Given the Admin determines a submitted MCI number is invalid
When the Admin clicks "Reject" and enters reason: "MCI number could not be verified"
Then the doctor's account status changes to Rejected
And the doctor receives a rejection email containing the rejection reason
```

---

### US-024 — Admin Suspends Doctor Account

**As the Admin User**, I want to suspend a doctor's account if there is a complaint or compliance issue, so that the doctor is immediately hidden from the platform while the issue is investigated.

**Priority:** Must Have | **Size:** S | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Admin suspends an active doctor
Given Dr. Arjun has status = Approved
When the Admin clicks "Suspend Account"
Then Dr. Arjun's status changes to Suspended
And Dr. Arjun's profile is removed from all patient search results
And Dr. Arjun cannot log in (receives 403 with "account suspended" message)

Scenario: Admin reactivates a suspended doctor
Given Dr. Arjun has status = Suspended (investigation complete, cleared)
When the Admin clicks "Reactivate Account"
Then Dr. Arjun's status returns to Approved
And his profile reappears in search results
And he can log in again
```

---

### US-025 — Doctor Subscribes to MedSlot

**As Dr. Arjun**, I want to subscribe to MedSlot via Razorpay after my trial, so that I can continue using the consultation workflow and receiving patient bookings.

**Priority:** Must Have | **Size:** M | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Doctor within trial period
Given Dr. Arjun's account was approved 10 days ago (trial day 10 of 30)
When he accesses the doctor dashboard
Then he can use all features without payment
And a banner shows: "Your free trial expires in 20 days."

Scenario: Doctor subscribes before trial expiry
Given Dr. Arjun is on day 25 of his trial
When he clicks "Subscribe" and completes Razorpay subscription checkout
Then a Razorpay subscription is created
And on webhook "subscription.activated", his subscription status = Active
And the trial expiry banner disappears

Scenario: Subscription payment fails (grace period)
Given Dr. Arjun has an active subscription
When Razorpay sends a payment failure webhook
Then his subscription status = Payment Failed
And he receives an email with a payment resolution link
And he retains dashboard access for 7 days

Scenario: Dashboard suspended after 7-day payment failure
Given Dr. Arjun's subscription has been in Payment Failed status for 8 days
When he attempts to access the doctor dashboard
Then he receives HTTP 402 with: "Your subscription is inactive. Please update your payment."
And Priya can still view her existing appointments (read-only) for 90 days
```

---

## SHOULD HAVE Stories

---

### US-026 — Appointment Reminder Email

**As Priya**, I want to receive a reminder email 24 hours before my appointment, so that I don't forget and can arrive prepared.

**Priority:** Should Have | **Size:** S | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Reminder sent 24 hours before appointment
Given Priya has a Scheduled appointment on 2026-06-10 at 10:00am
When the system time reaches 2026-06-09 at 10:00am (±15 min)
Then Priya receives a reminder email containing: doctor name, date, time, clinic address

Scenario: No reminder for cancelled appointment
Given Priya's appointment is cancelled before the 24-hour mark
When the reminder time window arrives
Then no reminder email is sent
```

---

### US-027 — Soft Delete Health Record

**As Priya**, I want to delete a health record I uploaded by mistake, so that my records list stays clean and relevant.

**Priority:** Should Have | **Size:** XS | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Successful soft delete
Given Priya uploaded a file named "wrong_file.pdf"
When she clicks "Delete" and confirms
Then the record is marked deleted in the database
And it no longer appears in her "My Records" list
And the S3 object is retained (soft delete only — 10-year retention)

Scenario: Attempting to access a deleted record directly
Given a record has been soft-deleted
When a direct URL to that record's download endpoint is requested
Then the system returns 404: "Record not found."
```

---

### US-028 — Doctor Views Issued Prescriptions

**As Dr. Arjun**, I want to see a history of all prescriptions I have issued, so that I can refer back to past treatments when consulting a returning patient.

**Priority:** Should Have | **Size:** S | **INVEST:** ✅ All criteria met

**Acceptance Criteria:**

```
Scenario: Doctor views prescription history
Given Dr. Arjun has issued 8 prescriptions over 3 months
When he navigates to "My Prescriptions"
Then he sees all 8 prescriptions sorted by issue date descending
And each entry shows: patient name, date, primary diagnosis

Scenario: No prescriptions issued yet
Given Dr. Arjun just activated his account
When he views "My Prescriptions"
Then he sees: "No prescriptions issued yet."
```

---

## Specialty Taxonomy Reference

The following fixed list applies to US-003, US-004, US-012, US-025 and all search/discovery flows:

| # | Specialty |
|---|-----------|
| 1 | General Physician |
| 2 | Dermatologist |
| 3 | Cardiologist |
| 4 | Orthopedist |
| 5 | Gynecologist & Obstetrics |
| 6 | Pediatrician |
| 7 | ENT Specialist |
| 8 | Ophthalmologist |
| 9 | Psychiatrist |
| 10 | Dentist |
| 11 | Neurologist |
| 12 | Diabetologist |
| 13 | General Surgeon |
