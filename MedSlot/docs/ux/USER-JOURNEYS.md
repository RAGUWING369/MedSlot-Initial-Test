# User Journey Maps — MedSlot

**Phase:** 5 — UX Design
**Version:** 1.0
**Date:** 2026-05-26
**Framework:** Nielsen Norman Group Journey Mapping Methodology

---

## Persona Reference

| Persona | Role | Primary Goal |
|---------|------|-------------|
| **Priya** | Patient, 34, Bengaluru, IT professional | Find and book a verified specialist without calling clinics |
| **Dr. Arjun** | Cardiologist, 42, Hyderabad, solo clinic | Conduct full consultation workflow — see patients, write notes, issue prescription — with minimal friction |
| **Admin User** | MedSlot ops team | Verify doctor applications and maintain platform integrity |

---

## Journey 1: Priya — First-Time Patient Books an Appointment

**Journey Name:** New Patient Discovery to Confirmed Booking
**Persona:** Priya — Urban Indian Patient
**Entry Point:** Priya searches "cardiologist Bengaluru" on Google, or a friend shares a MedSlot link
**Goal:** Confirm a specific appointment slot with a verified cardiologist, receive confirmation, and know the booking went through
**User Story Coverage:** US-001, US-002, US-003, US-004, US-005, US-006

---

### Happy Path

| Step | Screen | User Action | System Response | Emotional State | Pain Point Resolved |
|------|--------|-------------|-----------------|-----------------|---------------------|
| 1 | Landing / Search (SCR-001) | Arrives on MedSlot homepage; sees search bar prominently | SSR page loads in ≤ 2.5s; search bar is in hero section | Curious, cautious — "Is this trustworthy?" | Old: had to Google individual clinic names and call each one |
| 2 | Search (SCR-001) | Selects "Cardiologist" from specialty dropdown | Dropdown shows 13 fixed specialties; no typing required | Slightly more confident | Old: had to know exact specialty name or category |
| 3 | Search (SCR-001) | Types "Bengaluru" in city field, clicks Search | System fires GET /api/v1/doctors/search/?specialty=&city=Bengaluru | Hopeful | — |
| 4 | Results (SCR-002) | Sees list of verified cardiologists with next-available dates | Results load with name, specialty, clinic, area, city, next available slot; MCI Verified badge on each | Relieved — "These are real doctors" | Old: no way to filter by specialty AND city; no availability info |
| 5 | Results (SCR-002) | Clicks on "Dr. Arjun Mehta" card | Navigates to doctor profile page | Interested | — |
| 6 | Doctor Profile (SCR-003) | Reads credentials, sees MCI Verified badge, views 7-day slot calendar | GET /api/v1/doctors/{slug}/; 7-day slot grid renders; booked slots hidden | Confident — "This doctor seems legitimate" | Old: could not verify doctor credentials online for independent practitioners |
| 7 | Doctor Profile (SCR-003) | Clicks available slot "Thu 11 Jun, 10:30 AM" | Slot highlighted; booking summary panel opens below | Excited | — |
| 8 | Booking Flow (SCR-004) | Reviews booking summary (doctor, date, time, clinic address) | Summary card renders: Dr. Arjun Mehta, Cardiology, 11 Jun 10:30 AM, Lalitha Nagar, Hyderabad | Focused | Old: no confirmation step; had to call to verify booking |
| 9 | Auth Gate | Clicks "Confirm Booking" — not logged in | Redirected to OTP login/registration with slot preserved in session | Mild friction — but expected | — |
| 10 | OTP Login (SCR-006) | Enters mobile number +91 98765 43210 | OTP sent via MSG91; "OTP sent to +91 98765 43210" shown | Slightly anxious — awaiting SMS | Old: required password creation/remembering |
| 11 | OTP Login (SCR-006) | Enters 6-digit OTP within 5 minutes | POST /api/v1/auth/otp/verify/; JWT returned; is_new_user=true | Relieved — smooth | — |
| 12 | Profile Completion (new user) | Fills name, DOB, gender, email | POST /api/v1/patients/profile/; account created | Slightly impatient — wants to just book | Old: lengthy registration forms blocked healthcare apps |
| 13 | Booking Confirmation (SCR-005) | Booking auto-completes; confirmation screen shown | POST /api/v1/appointments/; status=Scheduled; booking confirmation email queued | Delighted — "Done! That was fast" | Old: had to wait for callback to confirm |
| 14 | Email | Opens email from MedSlot | Confirmation email with doctor name, date, time, clinic address arrives within 60s | Reassured — has a paper trail | Old: no confirmation; had to write it down |

**Exit Point:** Priya has a confirmed appointment. She knows the date, time, and clinic address. She has received an email confirmation.

---

### Error Path: OTP Not Received

| Step | User Action | System Response | Emotional State | Designed Improvement |
|------|-------------|-----------------|-----------------|---------------------|
| 11a | Waits 30+ seconds, no OTP | "Resend OTP" link visible after 30s | Anxious | Clear resend timer with countdown; "Resend OTP" appears at 30s |
| 11b | Clicks "Resend OTP" | New OTP sent; counter resets; remaining attempts shown | Less anxious | Rate limit info shown proactively: "You can request up to 5 OTPs per hour" |
| 11c | Enters wrong OTP 3 times | "Too many failed attempts. Try again in 15 minutes." with timer | Frustrated | Plain-language lockout message with exact time remaining; no HTTP codes shown |

---

### Error Path: Slot Taken During Booking (Race Condition)

| Step | User Action | System Response | Emotional State | Designed Improvement |
|------|-------------|-----------------|-----------------|---------------------|
| 8a | Clicks "Confirm Booking" | Another patient booked the same slot in the intervening seconds | Disappointed | Immediate inline error: "This slot was just taken by another patient. Choose a different time." + slot calendar refreshes automatically showing updated availability |

---

### Edge Case: Unauthenticated User Saves Slot Intent

After OTP login (Step 9–11), the system must resume the booking flow from Step 8 without losing the selected slot. The slot is preserved in the Next.js session/Zustand store during the auth redirect. The user should not have to re-find the doctor or re-select the slot.

**Moments of Friction:**
1. Step 9 — Auth gate interruption. Designed mitigation: slot selection preserved; auth flow is as short as possible (enter phone → enter OTP → done; profile completion only for new users).
2. Step 12 — Profile completion for new users. Designed mitigation: minimal required fields (name, DOB, gender, email); progressive disclosure (profile can be completed later if needed — but must have email for confirmation).

---

## Journey 2: Priya — Returning Patient Manages Appointments

**Journey Name:** View and Cancel an Upcoming Appointment
**Persona:** Priya
**Entry Point:** Priya logs in directly (returning user); navigates to My Appointments
**Goal:** View upcoming appointment details and cancel if needed
**User Story Coverage:** US-002, US-007, US-008

---

### Happy Path

| Step | Screen | User Action | System Response | Emotional State | Pain Point Resolved |
|------|--------|-------------|-----------------|-----------------|---------------------|
| 1 | OTP Login (SCR-006) | Enters mobile number + OTP | JWT returned with role=patient; redirected to patient dashboard | Comfortable — familiar flow | — |
| 2 | Patient Dashboard (SCR-007) | Sees "My Appointments" section | GET /api/v1/patients/appointments/; upcoming appointments sorted by date desc | In control | Old: had to call clinic to know appointment status |
| 3 | SCR-007 | Clicks on upcoming appointment card | Appointment detail expands inline | — | — |
| 4 | SCR-007 | Clicks "Cancel Appointment" | Confirmation modal: "Are you sure you want to cancel this appointment?" | Slightly uncertain | Clear undo warning prevents accidental cancellations |
| 5 | SCR-007 | Confirms cancellation | POST /api/v1/appointments/{id}/cancel/; status=Cancelled; cancellation email sent to Dr. Arjun | Relieved — "Done, no need to call" | Old: had to call clinic to cancel; often no answer |

### Error Path: Cancellation Outside Window

| Step | User Action | System Response | Emotional State | Designed Improvement |
|------|-------------|-----------------|-----------------|---------------------|
| 4a | Attempts to cancel appointment 1.5h before start | "Cancellations are not allowed within 2 hours of your appointment. Please contact the clinic directly." | Frustrated | Proactive: "Cancel" button disabled (not just fails) when < 2h with tooltip explaining why; shown before they click |

---

## Journey 3: Priya — Views and Downloads a Prescription

**Journey Name:** Access Prescription After Consultation
**Persona:** Priya
**Entry Point:** Email notification from MedSlot: "Your prescription is ready"
**Goal:** View and download the PDF prescription from Dr. Arjun
**User Story Coverage:** US-010, US-011

---

### Happy Path

| Step | Screen | User Action | System Response | Emotional State | Pain Point Resolved |
|------|--------|-------------|-----------------|-----------------|---------------------|
| 1 | Email | Clicks "View Prescription" link in email | Opens MedSlot; navigates to appointment | Pleased — easy access | Old: received a WhatsApp photo of handwritten prescription |
| 2 | Patient Dashboard (SCR-007) | Sees completed appointment with "View Prescription" link | GET /api/v1/appointments/; Completed appointment shows prescription link | Comfortable | — |
| 3 | Prescription View (SCR-009) | Clicks "View Prescription" | GET /api/v1/prescriptions/{id}/download/ → pre-signed S3 URL → PDF opens | Satisfied — "This is professional and clear" | Old: illegible handwriting; lost paper copy |
| 4 | SCR-009 | Clicks "Download PDF" | Browser downloads the prescription PDF file | Done | — |

### Error Path: Expired Link

| Step | User Action | System Response | Emotional State | Designed Improvement |
|------|-------------|-----------------|-----------------|---------------------|
| 3a | Clicks 8-day-old prescription link | System silently calls GET /api/v1/prescriptions/{id}/download/ → regenerates fresh 7-day URL → redirect | Unaware this happened — seamless | No error shown; URL regeneration is invisible to user |

---

## Journey 4: Priya — Uploads a Health Record

**Journey Name:** Upload Lab Report to Health Records
**Persona:** Priya
**Entry Point:** Priya navigates to "My Records" from her patient dashboard
**Goal:** Upload a blood test PDF and have it saved securely
**User Story Coverage:** US-009

---

### Happy Path

| Step | Screen | User Action | System Response | Emotional State | Pain Point Resolved |
|------|--------|-------------|-----------------|-----------------|---------------------|
| 1 | Health Records (SCR-008) | Navigates to "My Records" tab | GET /api/v1/patients/records/; existing records listed | Organised feeling | Old: scattered across WhatsApp, email, and paper |
| 2 | SCR-008 | Clicks "Upload Record" | Upload panel opens with drag-and-drop zone | — | — |
| 3 | SCR-008 | Selects "blood_test.pdf" (3MB) | Client-side validation: file is PDF, ≤ 10MB → proceeds | — | — |
| 4 | SCR-008 | Confirms upload | GET presigned URL from API; client uploads directly to S3; progress bar shown | Watching progress | Old: had to scan and email documents to each clinic separately |
| 5 | SCR-008 | Upload completes | "blood_test.pdf" appears in records list with upload date | Satisfied | — |

### Error Path: File Too Large

| Step | User Action | System Response | Emotional State | Designed Improvement |
|------|-------------|-----------------|-----------------|---------------------|
| 3a | Selects 15MB PNG scan | Client-side check before upload: "This file is 15MB. Maximum allowed size is 10MB. Please compress the file and try again." | Slightly frustrated but informed | Client-side validation prevents wasted upload attempt; message explains exactly what to do |

---

## Journey 5: Dr. Arjun — Full Consultation Workflow

**Journey Name:** Doctor Opens App → Consults → Issues Prescription → Done
**Persona:** Dr. Arjun — Independent Cardiologist
**Entry Point:** Dr. Arjun opens his laptop at 9 AM; navigates to MedSlot
**Goal:** Complete a consultation for Patient Priya, issue a prescription, and move to the next patient in under 5 minutes
**User Story Coverage:** US-013, US-015, US-017, US-018, US-019, US-020

---

### Happy Path

| Step | Screen | User Action | System Response | Emotional State | Pain Point Resolved |
|------|--------|-------------|-----------------|-----------------|---------------------|
| 1 | OTP Login (SCR-010) | Enters +91 mobile; requests OTP | OTP SMS delivered via MSG91 within 10s | Routine — familiar | — |
| 2 | OTP Login (SCR-010) | Enters OTP | JWT with role=doctor returned; redirected to doctor dashboard | Ready to work | — |
| 3 | Doctor Dashboard (SCR-011) | Sees today's appointments list | GET /api/v1/doctor/appointments/today/; sorted by time asc; 5 appointments shown | Oriented — knows his day | Old: checked paper diary + phone reminders; often incomplete |
| 4 | SCR-011 | Sees "Priya S. — 10:30 AM — Scheduled"; clicks "Start Consultation" | POST /api/v1/consultations/start/; appointment status → In Consultation; consultation form opens | Focused — entering work mode | Old: no structured record; opened Google Docs or paper notepad |
| 5 | Consultation View (SCR-013) | Reads patient profile in sidebar (name, age, gender); types "Chest pain on exertion" in Chief Complaint | Form renders 5 structured fields; auto-save draft on focus loss | In flow — methodical | Old: would lose notes if tab closed |
| 6 | SCR-013 | Fills in History, Examination Findings, Diagnosis = "Stable Angina", Plan | All fields save on blur | Confident | — |
| 7 | SCR-013 | Clicks "Issue Prescription" | Prescription form opens as next step | Efficient — single flow | Old: separate paper prescription with carbon copy |
| 8 | Prescription Issuance (SCR-014) | Adds: "Amlodipine 5mg — Once daily — 30 days", optional instructions "Avoid strenuous activity", follow-up in 4 weeks | Dynamic medicine row form; can add multiple rows | Methodical | — |
| 9 | SCR-014 | Clicks "Issue Prescription" | POST /api/v1/prescriptions/; 202 Accepted; PDF generation queued in Celery; appointment → Completed | Relieved — "Done" | Old: manually write, photocopy, hand to patient |
| 10 | SCR-014 → SCR-011 | Sees success toast: "Prescription issued. Priya will receive the PDF by email." Automatically returns to today's schedule | Appointment shows "Completed" status | Satisfied — "Next patient" | Old: uncertain if patient got the prescription |

**Exit Point:** Dr. Arjun has completed the consultation. The appointment is marked Completed. Priya receives an email with the prescription PDF within 60 seconds. Dr. Arjun sees his today's schedule with the appointment marked done.

---

### Error Path: PDF Generation Fails

| Step | User Action | System Response | Emotional State | Designed Improvement |
|------|-------------|-----------------|-----------------|---------------------|
| 9a | Clicks "Issue Prescription" | Celery task fails; retries once; final failure | Alarmed | "Prescription generation failed. The data has been saved. Please try again or contact support." Appointment stays In Consultation — not prematurely marked Complete |

---

### Error Path: Opening Consultation for Future Appointment

| Step | User Action | System Response | Emotional State | Designed Improvement |
|------|-------------|-----------------|-----------------|---------------------|
| 4a | Tries to start consultation for tomorrow's appointment | "Start Consultation" button is disabled for future dates with tooltip: "Consultation can only be started on the day of the appointment." | Mild annoyance | Button disabled with tooltip — no wasted click |

---

## Journey 6: Dr. Arjun — Configures Availability Calendar

**Journey Name:** Doctor Sets Up Availability After First Login
**Persona:** Dr. Arjun
**Entry Point:** First login after admin approval; dashboard shows "Set up your availability to start receiving bookings"
**Goal:** Configure Mon-Fri, 9 AM–1 PM, 30-min slots so patients can book him
**User Story Coverage:** US-014

---

### Happy Path

| Step | Screen | User Action | System Response | Emotional State | Pain Point Resolved |
|------|--------|-------------|-----------------|-----------------|---------------------|
| 1 | Doctor Dashboard (SCR-011) | Sees "Calendar not configured" empty state with CTA | Dashboard shows empty state: "You haven't set up your availability yet. Start accepting bookings by configuring your schedule." | Motivated | Old: manually maintaining a paper diary |
| 2 | Availability Calendar (SCR-012) | Navigates to "Availability" tab; checks Mon-Fri checkboxes | Working days grid renders; each selected day shows time inputs | Focused | — |
| 3 | SCR-012 | Sets 09:00–13:00 for each weekday | Time picker inputs per day | Methodical | — |
| 4 | SCR-012 | Selects "30 minutes" from slot duration dropdown | Preview: "8 slots per day: 09:00, 09:30, 10:00, 10:30, 11:00, 11:30, 12:00, 12:30" | Confident — preview eliminates guessing | Old: no preview of what this would produce |
| 5 | SCR-012 | Clicks "Save Availability" | PUT /api/v1/doctor/availability/; slots generated for next 30 days | Accomplished | — |
| 6 | SCR-012 | Sees success: "Availability saved. Patients can now book you for the next 30 days." | 30-day slot count shown | Pleased | — |

### Error Path: Invalid Time Range

| Step | User Action | System Response | Emotional State | Designed Improvement |
|------|-------------|-----------------|-----------------|---------------------|
| 3a | Sets end time 08:00 before start time 09:00 | Inline error on end time field: "End time must be after start time." Save button disabled | Caught early | Inline field validation; save button disabled until valid |

---

## Journey 7: Admin — Reviews and Approves Doctor Application

**Journey Name:** Admin Processes Doctor Verification Queue
**Persona:** Admin User
**Entry Point:** Admin receives email notification: "New doctor application submitted — Dr. Ananya Shah, Dermatologist"
**Goal:** Review credentials, approve the application, and have the doctor receive an approval email
**User Story Coverage:** US-022, US-023

---

### Happy Path

| Step | Screen | User Action | System Response | Emotional State | Pain Point Resolved |
|------|--------|-------------|-----------------|-----------------|---------------------|
| 1 | Django Admin Panel (SCR-016) | Navigates to Doctor Verification queue | GET admin/doctors/pending/; all Pending applications listed with submission date | Organised | — |
| 2 | SCR-016 | Clicks on "Dr. Ananya Shah" application | Application detail opens: all fields + credential document link | Reviewing | — |
| 3 | SCR-016 | Opens credential document S3 link | PDF credential opens in new tab | Reading | — |
| 4 | SCR-016 | Verifies MCI number matches; clicks "Approve" | POST /api/v1/admin/doctors/{id}/approve/; status → Approved; approval email sent; 30-day trial starts | Satisfied | — |
| 5 | SCR-016 | Sees success indicator; application moves from Pending queue | Queue count decrements | Done | — |

### Error Path: Rejection with Reason

| Step | User Action | System Response | Emotional State | Designed Improvement |
|------|-------------|-----------------|-----------------|---------------------|
| 4a | MCI number doesn't match; clicks "Reject" | Rejection modal opens: required "Reason" text field | Careful | Required reason field prevents zero-context rejections; doctor receives the reason text in their email |

---

## Key Moments of Friction Summary

| Journey | Moment of Highest Friction | Designed Resolution |
|---------|---------------------------|---------------------|
| J1 — Patient booking | Auth gate interrupting slot selection | Slot preserved in session; OTP flow is minimal (phone → OTP → profile for new users only) |
| J1 — Patient booking | Profile completion for new users | Only 4 required fields; inline validation; no full-page reload |
| J2 — Cancel appointment | Discovering cancellation is blocked (<2h window) | Cancel button shows disabled state with tooltip before user tries to click |
| J3 — Prescription access | Expired 7-day pre-signed URL | Silent URL regeneration — user never sees an error |
| J4 — File upload | File too large | Client-side validation before upload attempt |
| J5 — Doctor consultation | Losing notes if tab closed | Auto-save on blur; explicit "Save Draft" button |
| J5 — Doctor consultation | PDF generation failure | Appointment stays In Consultation; no data lost; clear error message |
| J6 — Calendar setup | Not knowing what slot count to expect | Live preview: "This configuration generates X slots per day" |
| J7 — Admin review | No context in rejection emails to doctors | Required reason field on rejection modal |
