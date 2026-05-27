# Wireframe Specifications — MedSlot

**Phase:** 5 — UX Design
**Version:** 1.0
**Date:** 2026-05-26
**Primary Visual Spec:** `docs/visuals/ux/` — HTML wireframe files (one directory per screen, one file per state)

---

## Information Architecture

### 2a — Sitemap (Navigation Tree)

```
MedSlot
├── PUBLIC (unauthenticated accessible)
│   ├── / (Landing + Doctor Search) — SCR-001
│   ├── /search (Doctor Search Results) — SCR-002
│   ├── /doctors/{slug} (Doctor Profile) — SCR-003
│   └── /auth (OTP Login / Registration) — SCR-006 / SCR-010
│
├── PATIENT (authenticated, role=patient)
│   ├── /dashboard (My Appointments) — SCR-007
│   ├── /book/{slot_id} (Booking Flow) — SCR-004
│   ├── /book/confirm (Booking Confirmation) — SCR-005
│   ├── /records (Health Records) — SCR-008
│   └── /prescriptions/{id} (Prescription View) — SCR-009
│
├── DOCTOR (authenticated, role=doctor, status=Approved)
│   ├── /doctor/dashboard (Today's Appointments) — SCR-011
│   ├── /doctor/appointments (Upcoming Appointments) — part of SCR-011
│   ├── /doctor/availability (Calendar Management) — SCR-012
│   ├── /doctor/consultation/{appointment_id} (Consultation View) — SCR-013
│   ├── /doctor/prescription/{appointment_id} (Prescription Issuance) — SCR-014
│   └── /doctor/profile (Profile & Settings) — SCR-015
│
└── ADMIN (Django Admin Panel)
    └── /admin/doctors/pending/ (Doctor Approval Queue) — SCR-016
```

### 2b — Navigation Pattern Decision

**Selected Pattern:** Top navigation bar (desktop) + responsive collapse to hamburger (mobile)

**Justification:** MedSlot has 4–6 top-level navigable sections per role. The primary experience is desktop-first (1280px+). Users switch between sections (Search → Profile → My Appointments) at moderate frequency. Top navigation provides:
- Persistent role context (patient vs. doctor portal)
- Fast section switching without sidebar taking content space
- Standard web convention that both urban Indian patients and doctors expect

Patient nav items: Find Doctors | My Appointments | My Records | [User Avatar/Name]
Doctor nav items: Dashboard | Availability | My Profile | [User Avatar/Name]
Public nav items: Find Doctors | For Doctors | Login/Register

### 2c — Content Inventory Per Screen

| Screen | Data Displayed | API Source | Actions Available |
|--------|---------------|-----------|------------------|
| SCR-001 Landing/Search | Specialty dropdown (13 items), city input | GET /api/v1/specialties/ | Submit search |
| SCR-002 Search Results | Doctor cards: name, specialty, clinic, next available | GET /api/v1/doctors/search/?specialty=&city= | View profile, paginate |
| SCR-003 Doctor Profile | Doctor details, 7-day slot calendar | GET /api/v1/doctors/{slug}/ | Select slot, book |
| SCR-004 Booking Flow | Selected slot summary, doctor details | Session state | Confirm booking |
| SCR-005 Booking Confirmation | Appointment details, email confirmation status | GET /api/v1/appointments/{id}/ | View my appointments |
| SCR-006 Patient Auth | Phone input, OTP input, profile form (new users) | POST /api/v1/auth/otp/request/, /verify/ | Submit OTP, complete profile |
| SCR-007 Patient Dashboard | Appointments list (upcoming + past), prescription links | GET /api/v1/patients/appointments/ | Cancel, view prescription |
| SCR-008 Health Records | Records list (name, type, date), upload form | GET /api/v1/patients/records/ | Upload, download, delete |
| SCR-009 Prescription View | Prescription details (read-only), PDF download link | GET /api/v1/prescriptions/{id}/download/ | Download PDF |
| SCR-010 Doctor Auth | Phone input, OTP input | POST /api/v1/auth/otp/request/, /verify/ | Submit OTP |
| SCR-011 Doctor Dashboard | Today's appointments, upcoming summary | GET /api/v1/doctor/appointments/today/ | Start consultation, cancel, mark no-show |
| SCR-012 Availability Calendar | Working days/hours form, blocked dates, slot preview | GET/PUT /api/v1/doctor/availability/ | Save availability, block dates |
| SCR-013 Consultation View | Patient info sidebar, consultation note form (5 fields) | GET/POST /api/v1/consultations/{id}/ | Save draft, issue prescription |
| SCR-014 Prescription Issuance | Medicine rows form, instructions, follow-up date | POST /api/v1/prescriptions/ | Add/remove medicine row, issue prescription |
| SCR-015 Doctor Profile/Settings | Profile info, clinic details, subscription status | GET/PATCH /api/v1/doctor/profile/ | Update clinic info, manage subscription |
| SCR-016 Admin Approval Queue | Pending doctor applications list, application detail | GET/POST /api/v1/admin/doctors/ | Approve, reject with reason |

---

## Screen Inventory

| Screen ID | Screen Name | URL/Route | Primary Persona | User Stories | Priority | States Required |
|-----------|------------|-----------|-----------------|-------------|----------|----------------|
| SCR-001 | Landing / Doctor Search | / | Priya (public) | US-003, US-004 | Must Have | default, loading, empty, error |
| SCR-002 | Doctor Search Results | /search | Priya (public) | US-003, US-004 | Must Have | default, loading, empty, error |
| SCR-003 | Doctor Profile | /doctors/{slug} | Priya (public) | US-005, US-006 | Must Have | default, loading, empty, error |
| SCR-004 | Appointment Booking Flow | /book/{slot_id} | Priya (authenticated) | US-006 | Must Have | default, loading, error, success |
| SCR-005 | Booking Confirmation | /book/confirmed | Priya (authenticated) | US-006 | Must Have | default, loading, error |
| SCR-006 | Patient OTP Auth | /auth/patient | Priya | US-001, US-002 | Must Have | default, loading, error, success |
| SCR-007 | Patient Dashboard / My Appointments | /dashboard | Priya (authenticated) | US-007, US-008, US-010, US-011 | Must Have | default, loading, empty, error |
| SCR-008 | Health Records Upload | /records | Priya (authenticated) | US-009, US-027 | Must Have | default, loading, empty, error, success |
| SCR-009 | Prescription View | /prescriptions/{id} | Priya (authenticated) | US-010, US-011 | Must Have | default, loading, error |
| SCR-010 | Doctor OTP Auth | /auth/doctor | Dr. Arjun | US-012, US-013 | Must Have | default, loading, error, success |
| SCR-011 | Doctor Dashboard | /doctor/dashboard | Dr. Arjun (authenticated) | US-015, US-016, US-020, US-021 | Must Have | default, loading, empty, error |
| SCR-012 | Availability Calendar Management | /doctor/availability | Dr. Arjun (authenticated) | US-014 | Must Have | default, loading, empty, error, success |
| SCR-013 | Consultation View | /doctor/consultation/{id} | Dr. Arjun (authenticated) | US-017, US-018 | Must Have | default, loading, error, success |
| SCR-014 | Prescription Issuance | /doctor/prescription/{id} | Dr. Arjun (authenticated) | US-019 | Must Have | default, loading, error, success |
| SCR-015 | Doctor Profile / Settings | /doctor/profile | Dr. Arjun (authenticated) | US-012, US-025 | Must Have | default, loading, error, success |
| SCR-016 | Admin Doctor Approval Queue | /admin/doctors/pending/ | Admin User | US-022, US-023, US-024 | Must Have | default, loading, empty, error |

---

## Screen Specifications

---

### Screen: SCR-001 — Landing / Doctor Search

**URL:** /
**Purpose:** Entry point for patients to discover and search for doctors by specialty and city.
**Persona:** Priya (public, unauthenticated)
**User Stories:** US-003, US-004

#### Layout (Desktop — 1440px)

```
+------------------------------------------------------------+
| HEADER: MedSlot Logo | Find Doctors | For Doctors | Login  |
+------------------------------------------------------------+
| HERO SECTION (full-width, brand color bg)                  |
|   H1: "Find a Verified Doctor Near You"                    |
|   Subtext: "Speciality-based search, real availability"    |
|   SEARCH CARD (white card, centered, max-w-2xl)            |
|     [ Specialty Dropdown v ]  [ City: Bengaluru... ]       |
|     [ Search Doctors Button — full-width of card ]         |
+------------------------------------------------------------+
| TRUST SECTION: 3 trust-signal cards                        |
|   [MCI Verified] [Real-time Availability] [Instant Booking]|
+------------------------------------------------------------+
| HOW IT WORKS: 3-step illustration                          |
+------------------------------------------------------------+
| FOOTER                                                     |
+------------------------------------------------------------+
```

#### States
- **Default:** Hero with search card; specialty dropdown shows "Select Specialty" placeholder; city shows placeholder text "Enter city (e.g., Bengaluru)"
- **Loading:** Slim top progress bar on search submit; search button shows spinner + "Searching..." text
- **Empty:** N/A — this screen always renders (no data dependency)
- **Error:** If specialties API fails, static list used as fallback (13 specialties are fixed seed data)

#### Interactions
- Specialty dropdown: click → opens dropdown with 13 specialty options
- City field: text input, no autocomplete in v1
- Search button: on click → validates both fields not empty → navigates to /search with query params
- "For Doctors" nav link → /auth/doctor (registration/login flow)
- "Login" nav link → /auth/patient

#### Validation Rules
| Field | Required | Format | Error Message |
|-------|----------|--------|---------------|
| Specialty | No (but shows empty state if blank + city submitted) | Select from 13 options | "Please select a specialty to search" |
| City | No (but shows all doctors if blank) | Free text | — |

---

### Screen: SCR-002 — Doctor Search Results

**URL:** /search?specialty={id}&city={city}
**Purpose:** Show paginated list of verified doctors matching search criteria.
**Persona:** Priya (public)
**User Stories:** US-003, US-004

#### Layout (Desktop — 1440px)

```
+------------------------------------------------------------+
| HEADER (sticky)                                            |
+------------------------------------------------------------+
| SEARCH BAR (mini, inline edit of filters)                  |
| Specialty: [Cardiologist v]  City: [Bengaluru]  [Search]  |
+------------------------------------------------------------+
| RESULTS AREA (max-w-4xl mx-auto)                           |
|   "15 Cardiologists found in Bengaluru"                    |
|   +--------------------------------------------------+    |
|   | [Doctor Card 1]                                   |    |
|   | Dr. Arjun Mehta · Cardiologist                    |    |
|   | ✓ MCI Verified  Heart Care Clinic · Banjara Hills |    |
|   | Next Available: Thu 11 Jun                        |    |
|   | [View Profile →]                                  |    |
|   +--------------------------------------------------+    |
|   | [Doctor Card 2] ...                               |    |
|   +--------------------------------------------------+    |
|   PAGINATION: [< Prev] [1] [2] [3] [Next >]               |
+------------------------------------------------------------+
```

#### States
- **Default:** Results list with doctor cards (realistic data: Indian names, Bengaluru clinics)
- **Loading:** Skeleton cards (3 skeleton rows matching card dimensions) while API loads
- **Empty:** "No doctors found for Cardiology in Bengaluru. Try a different specialty or city." + CTA to modify search
- **Error:** "We couldn't load search results. Check your connection and try again." + Retry button

#### Interactions
- Doctor card (any click) → navigates to /doctors/{slug}
- "View Profile →" button → navigates to /doctors/{slug}
- Search bar: edit and re-search inline

---

### Screen: SCR-003 — Doctor Profile

**URL:** /doctors/{slug}
**Purpose:** Display full doctor credentials and available appointment slots for the next 7 days.
**Persona:** Priya (public, unauthenticated or authenticated)
**User Stories:** US-005, US-006

#### Layout (Desktop — 1440px)

```
+------------------------------------------------------------+
| HEADER (sticky)                                            |
+------------------------------------------------------------+
| LEFT PANEL (1/3 width)                                     |
|   [Doctor Avatar Placeholder]                              |
|   Dr. Arjun Mehta                                          |
|   Cardiologist  ✓ MCI Verified                             |
|   MCI Reg: MCI-2009-KA-12345                               |
|   Heart Care Clinic                                        |
|   Banjara Hills, Hyderabad                                 |
|   [Book Appointment CTA — prominent]                       |
|                                                            |
| RIGHT PANEL (2/3 width)                                    |
|   "Available Slots — Next 7 Days"                          |
|   [ Mon 9 Jun ] [ Tue 10 Jun ] [ Wed 11 Jun ] ...         |
|   (date tabs)                                              |
|   09:30  10:00  10:30  11:00  (slot chips)                |
|   [Book This Slot] on hover/click                          |
+------------------------------------------------------------+
```

#### States
- **Default:** Profile loaded; slot grid shows next 7 days with available slots as teal chips
- **Loading:** Left panel: text skeletons; Right panel: slot grid skeleton (gray chip placeholders)
- **Empty:** No slots available — "Dr. Arjun has no available slots in the next 7 days. You can still check back later."
- **Error:** "We couldn't load this doctor's profile. Try refreshing the page."

#### Interactions
- Slot chip: click → if unauthenticated → redirect to /auth/patient with return_url=/doctors/{slug}&slot={id}; if authenticated → opens booking confirmation modal
- "Book Appointment" CTA → scrolls to slot grid
- "Book This Slot" → same as slot chip click

---

### Screen: SCR-004 — Appointment Booking Flow

**URL:** /book/{slot_id}
**Purpose:** Patient confirms booking details before committing; shows booking summary.
**Persona:** Priya (authenticated)
**User Stories:** US-006

#### Layout (Desktop — 1440px)

```
+------------------------------------------------------------+
| HEADER                                                     |
+------------------------------------------------------------+
| BOOKING SUMMARY CARD (max-w-lg mx-auto, white card)        |
|   "Confirm Your Appointment"                               |
|   ┌──────────────────────────────────┐                    |
|   | Dr. Arjun Mehta                   |                    |
|   | Cardiologist  ✓ MCI Verified      |                    |
|   | Heart Care Clinic, Banjara Hills  |                    |
|   | Hyderabad - 500034                |                    |
|   | Date: Thursday, 11 June 2026      |                    |
|   | Time: 10:30 AM                    |                    |
|   └──────────────────────────────────┘                    |
|   [ Confirm Appointment ]  [ ← Back ]                      |
+------------------------------------------------------------+
```

#### States
- **Default:** Booking summary with all details populated
- **Loading:** Spinner on "Confirm Appointment" button; button disabled; "Processing your booking..."
- **Error:** "This slot is no longer available. Please choose another time." + link back to doctor profile
- **Success:** Redirects to SCR-005 (Booking Confirmation)

#### Validation Rules
| Scenario | Error Message |
|----------|---------------|
| Slot taken by concurrent booking | "This slot was just taken by another patient. Please choose a different time." |
| Same doctor + same date conflict | "You already have an appointment with Dr. Arjun on this date." |

---

### Screen: SCR-005 — Booking Confirmation

**URL:** /book/confirmed
**Purpose:** Show confirmed appointment details; reassure patient booking succeeded.
**Persona:** Priya (authenticated)
**User Stories:** US-006

#### Layout

```
+------------------------------------------------------------+
| HEADER                                                     |
+------------------------------------------------------------+
| CONFIRMATION PANEL (max-w-lg mx-auto, centered)            |
|   ✓ (large green checkmark icon)                           |
|   "Appointment Confirmed!"                                 |
|   [Appointment details card]                               |
|   "A confirmation email has been sent to priya@email.com"  |
|   [ View My Appointments ] [ Book Another Doctor ]         |
+------------------------------------------------------------+
```

#### States
- **Default:** Success confirmation with appointment details and email notice
- **Loading:** Spinner while fetching appointment details (brief)
- **Error:** "Your booking was processed but we couldn't load the confirmation. Check 'My Appointments' for details." — with link to /dashboard

---

### Screen: SCR-006 — Patient OTP Authentication

**URL:** /auth/patient
**Purpose:** OTP-based login and registration for patients.
**Persona:** Priya
**User Stories:** US-001, US-002

#### Layout (Desktop — 1440px)

```
+------------------------------------------------------------+
| HEADER (minimal — logo only)                               |
+------------------------------------------------------------+
| AUTH CARD (max-w-sm mx-auto, centered, white card)         |
|                                                            |
|   Step 1 — Enter Mobile Number:                            |
|   [+91  | 98765 43210          ]                           |
|   [Send OTP]                                               |
|                                                            |
|   Step 2 — Enter OTP (shown after step 1):                 |
|   [ _ ] [ _ ] [ _ ] [ _ ] [ _ ] [ _ ]  (6 boxes)         |
|   "Resend OTP in 30s"                                      |
|   [Verify OTP]                                             |
|                                                            |
|   Step 3 — Complete Profile (new users only):              |
|   Full Name: [                ]                            |
|   Date of Birth: [DD/MM/YYYY  ]                            |
|   Gender: ( ) Male ( ) Female ( ) Other                    |
|   Email: [                    ]                            |
|   [Create Account]                                         |
+------------------------------------------------------------+
```

#### States
- **Default:** Step 1 (phone entry) active
- **Loading:** "Send OTP" button → spinner; "OTP Sent" state → resend timer
- **Error:** Invalid OTP: "Incorrect OTP. 2 attempts remaining."; Lockout: "Too many failed attempts. Try again in 15 minutes."
- **Success:** OTP verified → auto-redirect to dashboard (returning user) or step 3 (new user)

#### Validation Rules
| Field | Required | Format | Error Message |
|-------|----------|--------|---------------|
| Phone | Yes | +91 prefix, 10 digits | "Please enter a valid Indian mobile number" |
| OTP | Yes | 6 digits | "Incorrect OTP. X attempts remaining." |
| Full Name | Yes | Non-empty string | "Please enter your full name" |
| Date of Birth | Yes | Valid date, user must be ≥ 18 | "Please enter a valid date of birth" |
| Gender | Yes | One of: Male/Female/Other | "Please select your gender" |
| Email | Yes | RFC 5322 email format | "Please enter a valid email address" |

---

### Screen: SCR-007 — Patient Dashboard / My Appointments

**URL:** /dashboard
**Purpose:** Central hub for patient to view all appointments, access prescriptions, and cancel upcoming ones.
**Persona:** Priya (authenticated)
**User Stories:** US-007, US-008, US-010, US-011

#### Layout (Desktop — 1440px)

```
+------------------------------------------------------------+
| HEADER: MedSlot Logo | Find Doctors | My Appointments* |   |
|                       My Records | [Priya v]              |
+------------------------------------------------------------+
| PAGE TITLE: "My Appointments"                              |
| TABS: [Upcoming (2)] [Past (8)]                            |
|                                                            |
| APPOINTMENT CARD (one per row):                            |
| +----------------------------------------------------+    |
| | Dr. Arjun Mehta · Cardiologist                      |    |
| | Heart Care Clinic · Banjara Hills, Hyderabad         |    |
| | Thu, 11 June 2026 · 10:30 AM                        |    |
| | Status: SCHEDULED (teal badge)                       |    |
| | [View Details] [Cancel]                              |    |
| +----------------------------------------------------+    |
|                                                            |
| Completed appointment card:                                |
| | Status: COMPLETED (green badge)                     |    |
| | [View Prescription] [Download PDF]                  |    |
+------------------------------------------------------------+
```

#### States
- **Default:** Appointments list with both upcoming and past; teal badge for Scheduled; green for Completed; red for Cancelled
- **Loading:** Skeleton cards (3 rows)
- **Empty:** "You have no appointments yet. Find a doctor to get started." + [Find a Doctor] CTA
- **Error:** "We couldn't load your appointments. Try refreshing the page." + Retry

#### Interactions
- Cancel button: only visible for Scheduled appointments; if < 2h before start → disabled with tooltip "Cancellation not allowed within 2 hours"
- "View Prescription" → navigates to SCR-009
- "Download PDF" → GET /api/v1/prescriptions/{id}/download/ → browser download

---

### Screen: SCR-008 — Health Records

**URL:** /records
**Purpose:** Patient manages uploaded health documents — view, upload, download, delete.
**Persona:** Priya (authenticated)
**User Stories:** US-009, US-027

#### Layout (Desktop — 1440px)

```
+------------------------------------------------------------+
| HEADER                                                     |
+------------------------------------------------------------+
| PAGE TITLE: "My Health Records"                            |
| [+ Upload Record] button (top-right)                       |
|                                                            |
| UPLOAD PANEL (collapsible, shown when button clicked):     |
| Drag & drop zone / [Browse Files]                          |
| Accepted: PDF, JPEG, PNG · Max 10MB                        |
| [Upload] button                                            |
|                                                            |
| RECORDS TABLE:                                             |
| File Name | Type | Uploaded | Actions                     |
| blood_test.pdf | PDF | 20 May 2026 | [Download] [Delete]  |
+------------------------------------------------------------+
```

#### States
- **Default:** Records table populated; upload panel collapsed
- **Loading:** File upload → progress bar with percentage; table → skeleton rows
- **Empty:** "You haven't uploaded any health records yet." + [Upload Your First Record] CTA
- **Error:** Upload error (size/format): inline message below file input; API failure: "Upload failed. Try again."
- **Success:** File appears at top of table; success toast: "blood_test.pdf uploaded successfully"

#### Validation Rules
| Field | Constraint | Error Message |
|-------|-----------|---------------|
| File type | PDF, JPEG, PNG only | "Only PDF, JPEG, and PNG files are supported." |
| File size | ≤ 10MB | "File size exceeds the 10MB limit. Please upload a smaller file." |

---

### Screen: SCR-009 — Prescription View

**URL:** /prescriptions/{id}
**Purpose:** Patient views their received prescription details and downloads the PDF.
**Persona:** Priya (authenticated)
**User Stories:** US-010, US-011

#### Layout (Desktop — 1440px)

```
+------------------------------------------------------------+
| HEADER                                                     |
+------------------------------------------------------------+
| PRESCRIPTION CARD (max-w-2xl mx-auto)                      |
|   MedSlot [logo]          Generated: 10 Jun 2026           |
|   Dr. Arjun Mehta, Cardiologist                            |
|   Heart Care Clinic, Banjara Hills, Hyderabad              |
|   MCI Reg: MCI-2009-KA-12345                               |
|   ─────────────────────────────────────────                |
|   Patient: Priya Sharma          Date: 11 Jun 2026         |
|   Chief Complaint: Chest pain on exertion                  |
|   Diagnosis: Stable Angina                                 |
|   ─────────────────────────────────────────                |
|   MEDICINES:                                               |
|   Amlodipine 5mg | Once daily | 30 days                   |
|   ─────────────────────────────────────────                |
|   Instructions: Avoid strenuous activity                   |
|   Follow-up: 8 July 2026                                   |
|                                                            |
|   [ Download PDF ]                                         |
+------------------------------------------------------------+
```

#### States
- **Default:** Full prescription rendered from API data
- **Loading:** Content skeleton while fetching prescription + regenerating pre-signed URL
- **Error:** "We couldn't load this prescription. Try refreshing." + support contact

---

### Screen: SCR-010 — Doctor OTP Authentication

**URL:** /auth/doctor
**Purpose:** OTP-based login for approved doctors; registration form for new doctors.
**Persona:** Dr. Arjun
**User Stories:** US-012, US-013

#### Layout (Desktop — 1440px)

```
+------------------------------------------------------------+
| HEADER (minimal)                                           |
+------------------------------------------------------------+
| TWO TABS: [Login] [Register as a Doctor]                   |
|                                                            |
| LOGIN TAB:                                                 |
|   [Same OTP flow as SCR-006 — phone → OTP → dashboard]    |
|                                                            |
| REGISTER TAB (multi-field form):                           |
|   Full Name* | Mobile Number* | Specialty* (dropdown)     |
|   MCI Registration Number*                                 |
|   Clinic Name* | Clinic Area* | Clinic City*              |
|   Credential Document (PDF/image, ≤10MB)*                 |
|   [Submit Application]                                     |
|   "After verification, you'll receive an email (48h)"      |
+------------------------------------------------------------+
```

#### States
- **Default:** Login tab active (phone entry)
- **Loading:** Form submission → "Submitting your application..."
- **Error:** Missing fields → inline field errors; pending account login → "Your application is under review. You'll be notified once approved."
- **Success:** Registration submitted → "Application submitted successfully! We'll notify you within 48 hours."

#### Validation Rules (Registration)
| Field | Required | Format | Error Message |
|-------|----------|--------|---------------|
| Full Name | Yes | Non-empty | "Full name is required" |
| Mobile | Yes | +91, 10 digits | "Please enter a valid Indian mobile number" |
| Specialty | Yes | Select from 13 | "Please select your specialty" |
| MCI Number | Yes | Non-empty | "MCI Registration Number is required" |
| Clinic Name | Yes | Non-empty | "Clinic name is required" |
| Clinic Area | Yes | Non-empty | "Clinic area is required" |
| Clinic City | Yes | Non-empty | "Clinic city is required" |
| Credential Document | Yes | PDF/JPG/PNG, ≤10MB | "Please upload your credential document (PDF or image, max 10MB)" |

---

### Screen: SCR-011 — Doctor Dashboard

**URL:** /doctor/dashboard
**Purpose:** Primary work screen for doctors — view today's appointments and manage their status.
**Persona:** Dr. Arjun (authenticated, approved)
**User Stories:** US-015, US-016, US-020, US-021

#### Layout (Desktop — 1440px)

```
+------------------------------------------------------------+
| HEADER: MedSlot Dr. | Dashboard | Availability | Profile | |
+------------------------------------------------------------+
| TRIAL BANNER (conditional — shown during trial period):    |
| "Free trial: 12 days remaining. Subscribe to continue."   |
|                                                            |
| LEFT SECTION (2/3):                                        |
|   "Today's Appointments — Thursday, 11 June 2026"         |
|   +--------------------------------------------------+    |
|   | 09:00 AM   Rahul Kumar      SCHEDULED            |    |
|   | [Start Consultation]                              |    |
|   +--------------------------------------------------+    |
|   | 09:30 AM   Sunita Rao       IN CONSULTATION       |    |
|   | [Continue Consultation]                            |    |
|   +--------------------------------------------------+    |
|   | 10:00 AM   Anil Sharma      COMPLETED ✓           |    |
|   +--------------------------------------------------+    |
|                                                            |
| RIGHT SECTION (1/3):                                       |
|   "Upcoming (Next 7 Days)"                                 |
|   [mini list of next 5 appointments]                       |
|   [View All Upcoming →]                                    |
+------------------------------------------------------------+
```

#### States
- **Default:** Today's schedule with correct appointment status badges
- **Loading:** Skeleton rows for appointment list
- **Empty:** "No appointments scheduled for today. Your first appointment will appear here." + [Set Up Availability] CTA if no calendar configured
- **Error:** "We couldn't load your appointments. Try refreshing."

#### Interactions
- "Start Consultation" → only shown on Scheduled appointments for today; navigates to SCR-013
- "Mark No-Show" → shown on Scheduled appointments past their start time; confirmation modal → status=No-Show
- "Cancel Appointment" → confirmation modal with doctor cancel (any time before start)

---

### Screen: SCR-012 — Availability Calendar Management

**URL:** /doctor/availability
**Purpose:** Doctor configures working days, hours, slot duration, and blocks leave dates.
**Persona:** Dr. Arjun (authenticated)
**User Stories:** US-014

#### Layout (Desktop — 1440px)

```
+------------------------------------------------------------+
| HEADER (doctor nav)                                        |
+------------------------------------------------------------+
| PAGE: "My Availability"                                    |
|                                                            |
| SECTION 1 — WORKING DAYS & HOURS:                          |
| Day      | Working? | Start Time | End Time | Slots/Day   |
| Monday   | [✓]      | 09:00      | 13:00    | 8           |
| Tuesday  | [✓]      | 09:00      | 13:00    | 8           |
| Wednesday| [ ]      | —          | —        | —           |
| Thursday | [✓]      | 09:00      | 13:00    | 8           |
| Friday   | [✓]      | 09:00      | 13:00    | 8           |
| Saturday | [ ]      | —          | —        | —           |
| Sunday   | [ ]      | —          | —        | —           |
|                                                            |
| Slot Duration: ( )15min (●)30min ( )45min ( )60min        |
|                                                            |
| SECTION 2 — BLOCK DATES:                                   |
| [+ Add Blocked Date]                                       |
| 15 Jun 2026 — Leave  [Remove]                             |
|                                                            |
| PREVIEW: "This generates 32 slots this week"              |
| [Save Availability]                                        |
+------------------------------------------------------------+
```

#### States
- **Default:** Current availability configuration loaded
- **Loading:** Skeleton form rows
- **Empty:** No availability set — "You haven't configured your availability yet. Set up your working hours so patients can book you."
- **Error:** Save fails → "Couldn't save your availability. Please try again."
- **Success:** "Availability updated. Patients can book you for the next 30 days." (inline success banner)

#### Validation Rules
| Scenario | Error Message |
|----------|---------------|
| End time ≤ start time | "End time must be after start time." |
| No working days selected but save clicked | "Please select at least one working day." |

---

### Screen: SCR-013 — Consultation View

**URL:** /doctor/consultation/{appointment_id}
**Purpose:** Doctor writes structured consultation notes and proceeds to prescription issuance.
**Persona:** Dr. Arjun (authenticated)
**User Stories:** US-017, US-018

#### Layout (Desktop — 1440px)

```
+------------------------------------------------------------+
| HEADER (doctor nav + "← Back to Dashboard")               |
+------------------------------------------------------------+
| LEFT SIDEBAR (1/4 width):                                  |
|   Patient Information                                      |
|   Name: Priya Sharma                                       |
|   DOB: 5 Mar 1992 (Age 34)                                 |
|   Gender: Female                                           |
|   Email: priya@email.com                                   |
|   ─────────────────────                                    |
|   Appointment                                              |
|   11 Jun 2026 · 10:30 AM                                   |
|   Status: IN CONSULTATION                                  |
|                                                            |
| MAIN CONTENT (3/4 width):                                  |
|   "Consultation Notes"                                     |
|                                                            |
|   Chief Complaint* (required):                             |
|   [Textarea — "Describe the patient's main complaint"]     |
|                                                            |
|   History of Present Illness:                              |
|   [Textarea — "Duration, onset, associated symptoms..."]   |
|                                                            |
|   Examination Findings:                                    |
|   [Textarea — "Vital signs, physical examination..."]      |
|                                                            |
|   Diagnosis* (required):                                   |
|   [Textarea — "Primary and secondary diagnoses"]           |
|                                                            |
|   Plan / Treatment Instructions:                           |
|   [Textarea — "Treatment plan, referrals, lifestyle..."]   |
|                                                            |
|   [Save Draft]   [Issue Prescription →]                    |
+------------------------------------------------------------+
```

#### States
- **Default:** Empty form for new consultation; draft-saved form if returning to in-progress
- **Loading:** Spinner on "Save Draft" button; loading skeleton on initial load
- **Error:** Required fields empty when "Issue Prescription" clicked → inline red error on Chief Complaint and Diagnosis fields
- **Success:** Draft saved → "Notes saved." inline confirmation (no redirect)

#### Validation Rules
| Field | Required | Error Message |
|-------|----------|---------------|
| Chief Complaint | Yes | "Chief Complaint is required before issuing a prescription." |
| Diagnosis | Yes | "Diagnosis is required before issuing a prescription." |

---

### Screen: SCR-014 — Prescription Issuance

**URL:** /doctor/prescription/{appointment_id}
**Purpose:** Doctor creates prescription with medicine rows; issues final PDF.
**Persona:** Dr. Arjun (authenticated)
**User Stories:** US-019

#### Layout (Desktop — 1440px)

```
+------------------------------------------------------------+
| HEADER (doctor nav + "← Back to Consultation Notes")       |
+------------------------------------------------------------+
| LEFT SIDEBAR: Patient summary (same as SCR-013)            |
|                                                            |
| MAIN CONTENT:                                              |
|   "Prescription"                                           |
|   Consultation summary (read-only):                        |
|   Chief Complaint: Chest pain on exertion                  |
|   Diagnosis: Stable Angina                                 |
|                                                            |
|   MEDICINES TABLE:                                         |
|   # | Medicine Name | Dosage | Frequency | Duration | [✕] |
|   1 | Amlodipine    | 5mg    | Once daily| 30 days  | [✕] |
|   [+ Add Medicine Row]                                     |
|                                                            |
|   Additional Instructions (optional):                      |
|   [Textarea]                                               |
|                                                            |
|   Follow-up Date (optional):                               |
|   [Date picker — DD/MM/YYYY]                               |
|                                                            |
|   [Issue Prescription]  (primary action, prominent)        |
+------------------------------------------------------------+
```

#### States
- **Default:** One empty medicine row; consultation notes summary shown read-only
- **Loading:** "Issue Prescription" → spinner on button + "Generating your prescription..." full button state
- **Error:** Empty medicine name/dosage/frequency/duration → inline errors per row; PDF generation failure → "Prescription generation failed. Please try again."
- **Success:** "Prescription issued! Priya will receive the PDF by email." → redirect to SCR-011

#### Validation Rules
| Field | Required | Error Message |
|-------|----------|---------------|
| Medicine Name (per row) | Yes | "Medicine name is required" |
| Dosage (per row) | Yes | "Dosage is required" |
| Frequency (per row) | Yes | "Frequency is required" |
| Duration (per row) | Yes | "Duration is required" |
| At least one medicine row | Yes | "At least one medicine is required" |

---

### Screen: SCR-015 — Doctor Profile / Settings

**URL:** /doctor/profile
**Purpose:** Doctor manages their public profile, clinic details, and subscription status.
**Persona:** Dr. Arjun (authenticated)
**User Stories:** US-012 (profile), US-025 (subscription)

#### Layout (Desktop — 1440px)

```
+------------------------------------------------------------+
| HEADER (doctor nav)                                        |
+------------------------------------------------------------+
| TWO COLUMN LAYOUT:                                         |
|                                                            |
| LEFT (1/3): Profile preview card                          |
|   (how profile appears publicly to patients)              |
|                                                            |
| RIGHT (2/3): Edit sections                                 |
|   PUBLIC PROFILE:                                          |
|   Full Name: (read-only — MCI locked)                      |
|   Specialty: (read-only — admin locked)                    |
|   MCI Number: (read-only — cannot self-edit)               |
|                                                            |
|   CLINIC DETAILS (editable):                               |
|   Clinic Name: [Heart Care Clinic        ]                 |
|   Clinic Area: [Banjara Hills            ]                 |
|   Clinic City: [Hyderabad                ]                 |
|   [Save Changes]                                           |
|                                                            |
|   SUBSCRIPTION:                                            |
|   Status: Active ✓ / Trial (X days remaining)             |
|   [Manage Subscription via Razorpay]                       |
+------------------------------------------------------------+
```

#### States
- **Default:** Profile loaded with current data; subscription status shown
- **Loading:** Save button spinner
- **Error:** "Couldn't save your changes. Please try again."
- **Success:** "Your profile has been updated." inline banner

---

### Screen: SCR-016 — Admin Doctor Approval Queue

**URL:** /admin/doctors/pending/ (Django Admin Panel)
**Purpose:** Admin reviews pending doctor applications and takes approve/reject/suspend actions.
**Persona:** Admin User
**User Stories:** US-022, US-023, US-024

#### Layout (Desktop — 1440px)

```
+------------------------------------------------------------+
| DJANGO ADMIN HEADER: MedSlot Administration                |
+------------------------------------------------------------+
| BREADCRUMB: Home > Accounts > Doctor Applications          |
|                                                            |
| "Pending Verification (5)"                                 |
| FILTER: [Status: Pending v] [Specialty: All v] [Search...]|
|                                                            |
| TABLE:                                                     |
| Name | Specialty | MCI Number | City | Submitted | Actions|
| Dr. Ananya Shah | Dermatologist | MCI-KA-2018-54321 | Pune | 25 May | [Review] |
| ...                                                        |
|                                                            |
| DETAIL VIEW (on Review click):                             |
|   All fields displayed                                     |
|   Credential document: [View Document]                     |
|   [Approve] [Reject (with reason)] [Suspend]               |
+------------------------------------------------------------+
```

#### States
- **Default:** Queue table with pending applications
- **Loading:** Standard Django admin loading
- **Empty:** "No applications pending verification."
- **Error:** Action failure → Django admin error message display

---

## Responsive Breakpoints

All screens are designed desktop-first at 1440px. Responsive behavior at two additional breakpoints:

**768px (Tablet):**
- Single column layouts replace two-column layouts
- Doctor profile: slots calendar scrollable horizontally
- Navigation: full horizontal nav remains; may wrap

**375px (Mobile):**
- Navigation collapses to hamburger menu revealing full nav in dropdown
- Search card: stacked vertically (specialty above city)
- Doctor cards: full width
- Appointment cards: full width
- Consultation notes form: full width, stacked
- Medicine table: horizontally scrollable

---

## Navigation Paths (No Dead Ends Verification)

| From | To | How |
|------|----|-----|
| SCR-001 | SCR-002 | Search submit |
| SCR-001 | SCR-006 | Login nav link |
| SCR-002 | SCR-003 | Click doctor card |
| SCR-002 | SCR-001 | Modify search / back |
| SCR-003 | SCR-004 | Click slot → authenticated |
| SCR-003 | SCR-006 | Click slot → unauthenticated |
| SCR-006 | SCR-004 | After auth, booking resumed |
| SCR-006 | SCR-007 | After auth, no pending booking |
| SCR-004 | SCR-005 | Successful booking |
| SCR-004 | SCR-003 | Slot taken → back to profile |
| SCR-005 | SCR-007 | "View My Appointments" |
| SCR-007 | SCR-009 | "View Prescription" |
| SCR-007 | SCR-003 | "Find Doctors" CTA |
| SCR-008 | SCR-007 | Nav link |
| SCR-010 | SCR-011 | Successful login |
| SCR-011 | SCR-013 | "Start Consultation" |
| SCR-013 | SCR-014 | "Issue Prescription" |
| SCR-014 | SCR-011 | After prescription issued |
| SCR-011 | SCR-012 | "Availability" nav |
| SCR-011 | SCR-015 | "Profile" nav |
