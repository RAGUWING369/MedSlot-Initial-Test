# Product Requirements Document (PRD) — MedSlot

- **Product:** MedSlot
- **Version:** 1.0 — Draft
- **Status:** Draft
- **Product Owner:** Product Owner (role placeholder — assign before Phase 4)
- **Tech Lead:** Tech Lead (role placeholder — assign before Phase 4)
- **Last Updated:** 2026-05-25
- **Living Document:** Yes — changes require version increment and owner sign-off

---

## Document Control

| Version | Date | Author | Change Summary | Approved By |
|---------|------|--------|----------------|-------------|
| 1.0 | 2026-05-25 | PRD Agent — Phase 3 | Initial draft synthesising Phase 1 + Phase 2 artifacts | Pending |

---

## Synthesis Review Log (Phase 3 — Pre-PRD)

### Conflict Resolution

| ID | Source A | Claim | Source B | Contradicting Claim | Resolution |
|----|----------|-------|----------|---------------------|-----------|
| C-001 | `docs/ideation/FEASIBILITY-REPORT.md` | Recommended a permanent freemium tier (basic = free; paid = consultation workflow) as a churn-mitigation strategy | `docs/requirements/REQUIREMENTS.md` FR-SUB-001 | Defines only a 30-day trial period — no permanent free tier | **Phase 2 (approved requirements) takes precedence.** v1 has a 30-day trial; permanent freemium is deferred to post-v1. Rationale: a freemium tier complicates the subscription data model, creates mixed signals about product value, and was a suggestion rather than a confirmed decision. |

### Gap Log
No capabilities implied by ideation that were not captured in requirements. All Phase 1 scope items trace to Phase 2 FRs.

### Ambiguity Resolutions
- **Platform timezone:** All appointment times, slot generation, and cancellation window calculations operate in IST (India Standard Time, UTC+5:30).
- **30-day slot window:** Exactly 30 calendar days from current date in IST.
- **Admin panel implementation:** Deferred to Phase 4 (Architecture) decision — Django admin framework is the default assumption per `docs/assumptions/02-requirements-assumptions.md` A-02-011.

---

## 1. Executive Summary

MedSlot is a web-first healthcare appointment and consultation management platform built for the Indian independent doctor market. It solves a two-sided problem: urban Indian patients struggle to find and book verified independent doctors without phone calls or walk-ins; independent doctors lack an affordable, focused tool to manage their appointment calendar, conduct structured consultations, and deliver digital prescriptions.

MedSlot addresses this with a two-sided appointment marketplace paired with an integrated doctor consultation workflow — combining patient discovery with doctor-side practice management in one product, at a subscription price point designed for the solo practitioner.

The platform is built for web-first use (desktop at 1280px+, responsive to 375px mobile), generates revenue from a doctor SaaS subscription, and does not process consultation fees. It targets independent MBBS+ doctors running solo clinics in urban Indian Tier 1 and Tier 2 cities.

### 1.1 Background & Context

**Market driver:** India has approximately 910,000 independent doctors in private practice. This segment is structurally underserved: enterprise EMR systems are cost-prohibitive for solo practitioners, and consumer appointment aggregators (Practo, Lybrate) are built for hospital networks, leaving independent doctors with inadequate workflow tools.

**Competitive landscape:** Practo's 2022–2024 pivot toward enterprise health systems created a visible gap in the independent practitioner segment. Apollo 247 is a closed ecosystem; 1mg's primary value is pharmacy, not appointment management. No current platform combines patient discovery, appointment booking, structured consultation notes, and PDF prescription delivery for independent doctors at a solo-clinic price point. Full competitive analysis: `docs/ideation/COMPETITIVE-ANALYSIS.md`.

**Why now — five converging factors:**
1. **Behaviour shift:** Post-COVID India has normalised digital-first healthcare interactions in urban markets. Patients in Tier 1 cities now expect to book medical appointments online; doctors who adopted WhatsApp-based scheduling during COVID are ready to move to purpose-built tools.
2. **Infrastructure shift:** MSG91 OTP delivery penetration >95% in urban India makes passwordless, frictionless authentication achievable without social login complexity. Patients and doctors accept OTP-based auth as standard.
3. **Technology shift:** AWS managed services (ECS Fargate, RDS, S3) allow a 3-person team to deploy and operate a production-grade platform within a $2,000/month cloud budget — a constraint that would have required a larger ops team five years ago.
4. **Regulatory shift:** India's Digital Personal Data Protection Act 2023 (DPDPA) creates urgency for small clinic software to implement foundational data protection practices. Clinics using paper or WhatsApp face increasing compliance exposure; a platform that is encrypted-by-default from day one becomes a compliance-positive choice.
5. **Competitive window:** Lybrate's declining platform investment and Practo's enterprise refocus are simultaneously reducing the quality of the independent doctor experience on existing platforms — the window to offer a better alternative is open now and may close as incumbents respond.

**What success looks like:** 170 paying doctor subscribers (covering AWS infrastructure costs) by Month 12 post-launch, with ≥ 1,000 completed appointments/month and ≥ 80% of subscribed doctors completing at least one full consultation workflow per week. Full metrics: `docs/ideation/SUCCESS-METRICS.md`.

---

## 2. Problem Statement

> *"Urban Indian adults aged 22–55 who need medical consultations struggle with discovering and booking appointments with verified independent doctors because the existing channels — phone calls, walk-ins, and fragmented online options primarily designed for large hospitals — are opaque, time-consuming, and entirely disconnected from any health record system. The result: delayed care decisions, wasted waiting-room time, and zero continuity of health documentation between visits."*

> *"Independent doctors running solo or small clinics in India struggle to manage their appointment calendar, conduct structured consultations, and deliver prescriptions digitally because they have no affordable, focused tool — enterprise EMR systems are cost-prohibitive, and consumer appointment platforms provide patient discovery but not a complete consultation workflow. The result: scheduling chaos managed via phone and WhatsApp, handwritten prescriptions with no digital record, and patient data trapped on paper."*

— `docs/ideation/PROJECT-CONCEPT.md`

### 2.1 Product Vision

```
For independent doctors and small-clinic medical practitioners in India
Who need a faster, more organised way to manage their appointment calendar,
  conduct consultations, and issue digital prescriptions
MedSlot is a web-based healthcare appointment and consultation management platform
That enables patients to discover verified doctors and book time-slotted appointments
  instantly, while giving doctors a zero-friction workflow — from calendar management
  to structured consultation notes to auto-formatted PDF prescription delivery.
Unlike Practo and Apollo 247, which are built around large hospital and corporate
  clinic networks,
MedSlot is purpose-built for the independent practitioner — offering full ownership
  of patient data, a lightweight subscription model with no per-booking transaction
  fee, and a consultation workflow designed around the speed of a solo clinic.
```

### 2.2 Proposed Solution

MedSlot is a two-sided appointment marketplace with an integrated doctor consultation workflow. Both sides launch simultaneously: the patient-facing discovery and booking layer creates the volume that justifies the doctor subscription; the consultation workflow differentiates the subscription from free aggregator tiers.

**Patient experience:** Register via OTP, search verified doctors by specialty and city, view available slots, book in under 2 minutes, receive email confirmation, upload health records, and receive prescriptions as PDFs by email — all from a single web interface.

**Doctor experience:** Register with credentials (manually admin-verified), configure an availability calendar, view the appointment queue, conduct structured consultations with note-taking, issue prescriptions that auto-generate as PDFs and are delivered to the patient by email, and manage their subscription — all without leaving the platform.

The two rejected alternatives — a doctor-only practice management tool (no patient network effect) and a health-records-first platform (longer time-to-value, higher data liability) — are documented in `docs/ideation/PROJECT-CONCEPT.md §Alternatives Considered`.

### 2.3 Current Challenges

| Challenge | Affects | Current Workaround | MedSlot's Solution |
|-----------|---------|-------------------|-------------------|
| Opaque doctor availability | Patients | Phone calls, walk-ins | Real-time slot calendar on doctor profile |
| No verified doctor discovery by specialty + city | Patients | Google search, word-of-mouth | Verified doctor search with specialty + city filter |
| No digital health record continuity | Patients | Paper files, WhatsApp forwards | Centralized health record uploads + prescription history |
| Appointment scheduling via phone/WhatsApp | Doctors | Manual diary, WhatsApp groups | Digital calendar + slot auto-generation |
| Paper prescriptions — no digital delivery | Doctors, Patients | Handwritten, photographed, WhatsApp | Auto-generated PDF emailed to patient |
| No structured consultation record | Doctors | Paper notes | Structured note-taking form (Chief Complaint → Diagnosis → Plan) |
| Enterprise EMR too expensive/complex | Doctors | Spreadsheets, paper | Focused SaaS subscription at solo-clinic price |

### 2.4 Strategic Alignment

**OKR framework:** Not applicable — the team does not use formal OKRs at this stage. The product goals in §3 and success metrics in `docs/ideation/SUCCESS-METRICS.md` serve as the measurable objective framework.

### 2.5 Four Product Risks Assessment

| Risk | Level | Specific Risk | Evidence of Mitigation | Remaining Mitigation |
|------|-------|--------------|----------------------|---------------------|
| **Value** | Medium | Independent doctors may not find sufficient value in the subscription to switch from free Practo tier + paper workflow | Competitive gap is documented and validated (Phase 1); 5 specific daily workflow pains identified in problem discovery; beachhead segment has acknowledged Practo workflow limitations | **Must-do before Phase 7:** 5-doctor pricing interview to validate subscription willingness-to-pay at ₹1,000/month |
| **Usability** | Medium | Doctors are not tech-native; a complex onboarding or consultation flow risks immediate churn | Desktop-first design philosophy; OTP auth is familiar in India; Phase 5 UX Design produces wireframes with usability review; < 2-minute booking flow target defined | **Must-do before launch:** Moderated usability test with ≥ 5 participants (doctors and patients); booking flow must complete in < 2 minutes |
| **Feasibility** | Low | WeasyPrint PDF generation under concurrent load may not meet the ≤ 4s P95 target; schedule is tight (22 weeks) | Proven stack; NFR-PE-004 (4s target) is measurable; dedicated ECS task for PDF generation designed from Phase 4 | **Must-do before Sprint 5:** WeasyPrint load test POC — generate 50 concurrent PDFs and measure P95 time |
| **Business Viability** | Medium | Doctor subscription willingness-to-pay is unvalidated; cash-flow negative period may extend beyond 12 months | Market sizing shows 170 doctors = infrastructure break-even (achievable within SAM); feasibility confirmed; $2,000/month cloud budget is defined | **Must-do before Phase 7:** Pricing interview (same as value risk mitigation); confirm ₹1,000/month is achievable or revise pricing before building subscription billing |

---

## 3. Product Goals & Success Metrics

### 3.1 Goals

1. Enable any patient to find and book a verified Indian doctor in < 2 minutes, end-to-end, from any browser.
2. Enable any approved doctor to conduct a full consultation workflow (appointment → notes → PDF prescription emailed) in < 5 minutes of total platform time.
3. Achieve 170 paying doctor subscribers by Month 12 post-launch (AWS infrastructure break-even).
4. Maintain ≥ 99.9% platform uptime from launch day.
5. Ensure zero PHI data exposure incidents from day one — foundational data privacy is non-negotiable.

### 3.2 Business Goals

| Goal | Metric | Baseline | Target | Timeline |
|------|--------|----------|--------|----------|
| Infrastructure cost coverage | MRR from doctor subscriptions | ₹0 | ₹170,000/month (~170 doctors at ₹1,000/month) | Month 12 post-launch |
| Subscription growth | Paying doctor subscribers | 0 | 170 | Month 12 |
| Subscription health | Monthly doctor churn rate | Unknown | < 5%/month | From Month 3 |
| Trial conversion | Trial-to-paid conversion rate | Unknown | ≥ 30% | From Month 3 |
| Platform utilisation | Completed appointments/month | 0 | 1,000 | Month 12 |
| Patient network | Monthly Active Patients | 0 | 500 | Month 6 |

### 3.3 User Goals

| Goal | Metric | Baseline | Target | Timeline |
|------|--------|----------|--------|----------|
| Booking funnel | Search-to-confirmed booking completion rate | Unknown | ≥ 60% | Month 3 |
| Time-to-first-value (patient) | End-to-end booking time (P50, new patient) | Unknown | ≤ 2 minutes | From launch |
| Registration | OTP registration completion rate | Unknown | ≥ 75% | Month 1 |
| Prescription access | Prescription PDF download rate post-consultation | Unknown | ≥ 80% | Month 3 |
| Patient retention | Return booking rate (2nd booking within 6 months) | Unknown | ≥ 40% | Month 9 |
| Doctor activation | Calendar setup completion within 48h of approval | Unknown | ≥ 90% | From launch |
| Doctor engagement | Doctor weekly active rate (≥ 1 appointment managed/week) | Unknown | ≥ 80% of subscribed doctors | Month 3 |
| Consultation completion | Appointments resulting in issued prescription / total opened consultations | Unknown | ≥ 70% | Month 3 |
| Doctor time-to-value | Days from approval to first completed appointment | Unknown | ≤ 7 days | Month 3 |

### 3.4 Technical Goals

| Goal | Metric | Baseline | Target |
|------|--------|----------|--------|
| API performance | P95 response time (500 concurrent users) | Unknown | ≤ 200ms |
| Page load (discovery) | Largest Contentful Paint — doctor search page | Unknown | ≤ 2.5s |
| Page load (dashboards) | LCP — authenticated dashboard pages | Unknown | ≤ 3.0s |
| PDF generation | End-to-end prescription PDF generation time (P95) | Unknown | ≤ 4s |
| Availability | Monthly uptime | Unknown | ≥ 99.9% |
| Data safety | OTP delivery success rate | Unknown | ≥ 98% |
| Test quality | Code line coverage | 0% | ≥ 90% |

### 3.5 Definition of Success

**At launch (Day 1):** Platform is live on AWS ap-south-1; at least 1 approved doctor can receive bookings; at least 1 patient can complete an end-to-end booking; at least 1 full consultation workflow (notes → prescription PDF → patient email) can be completed without manual intervention.

**At 30 days (leading indicators):** ≥ 5 approved doctors with configured availability calendars; ≥ 20 registered patients; ≥ 10 completed appointments; doctor approval turnaround ≤ 48 hours; no P0 bugs open; OTP delivery success rate ≥ 98%.

**At 90 days (KPI validation):** Booking funnel completion ≥ 60%; doctor weekly active rate ≥ 80%; consultation workflow completion ≥ 70%; prescription PDF download rate ≥ 80%; first doctor subscriptions converted from trial.

**At 12 months (outcome targets):** 170 paying doctors; MRR ≥ ₹170,000; 1,000 completed appointments/month; 500 monthly active patients; doctor monthly churn < 5%.

---

## 4. Scope

### 4.1 In-Scope — v1 Core Release

**Patient capabilities:**
- OTP-based registration and login
- Doctor search and filter by specialty (from 13-specialty fixed taxonomy) and city
- Doctor profile view with available slot calendar (next 7 days)
- Appointment booking with confirmation
- Appointment management: view upcoming + past, cancel (> 2h before start)
- Health record upload (PDF/JPEG/PNG, ≤ 10MB per file)
- Received prescription view and PDF download (7-day pre-signed URL, on-demand regeneration)

**Doctor capabilities:**
- OTP-based registration with credential submission (MCI number, specialty, clinic info, credential document)
- Admin-gated account approval before going live
- Availability calendar configuration (working days, hours, slot duration: 15/30/45/60 min)
- Date blocking (leave/holiday management)
- Today's appointments and upcoming appointments dashboard (30-day window)
- Consultation session: structured notes (Chief Complaint, History, Examination, Diagnosis, Plan)
- Prescription issuance: multi-medicine form → auto-generated PDF → emailed to patient
- Appointment outcome management: Completed (via prescription), No-Show, or doctor-initiated Cancelled
- Subscription management via Razorpay Subscriptions (30-day trial → paid)

**Platform operations:**
- Admin panel: doctor verification queue, approve/reject/suspend/reactivate
- Email notifications via SendGrid: booking confirmation, prescription delivery, cancellation, reminder (24h before)
- SMS OTP via MSG91 for all authentication
- AWS S3 for encrypted file storage; AWS CloudFront for CDN

### 4.2 Out of Scope — This Release

| Exclusion | Future Roadmap Target |
|-----------|----------------------|
| Video / telehealth consultations | v2 — post-launch, once booking flow is proven |
| In-app messaging / patient-doctor chat | v2 — requires real-time infrastructure |
| Pharmacy integration / medicine ordering | v3 — post-launch partnership opportunity |
| Insurance billing / claim submission | Future — requires regulated integration |
| Multi-doctor clinic accounts | v2 — single-doctor accounts only in v1 |
| Guest / anonymous booking | Future — mandatory OTP registration in v1 |
| Consultation fee processing | Not planned — doctor handles fees directly with patient |
| Patient ratings / reviews | v2 — trust-safety governance required first |
| Push notifications | v2 — email + SMS only in v1 |
| Native mobile app (iOS/Android) | v2 — responsive web only in v1 |
| Lab test ordering / integration | Future — separate value chain |
| Permanent freemium tier | v2 consideration — 30-day trial only in v1 |

---

## 5. Market Context

### 5.1 Target Beachhead Segment

**Who:** Independent MBBS/MD doctors running solo or two-doctor clinics in Tier 1 and Tier 2 Indian cities (initial focus: Bengaluru, Hyderabad, Pune — to be confirmed in open question OQ-001). Currently using Practo's free tier for patient discovery but managing consultations, notes, and prescriptions via paper, WhatsApp, or Google Docs.

**Why this segment first:** Largest segment in acute daily pain (appointment scheduling + prescription workflow friction); already attempting digital solutions (Practo) but abandoning them for the workflow gap; willing to pay a modest subscription if the tool demonstrably reduces daily overhead; high word-of-mouth within the medical community — doctor networks are trusted and tight-knit.

**Why winning this segment creates momentum:** Solo doctor ARR funds building multi-doctor clinic features (v2); a growing verified doctor roster creates compounding patient discovery value; medical community trust transfers across specialties and geographies.

Full beachhead analysis: `docs/ideation/COMPETITIVE-ANALYSIS.md §Beachhead Segment`.

### 5.2 Market Size

| Market | Definition | Size | Calculation |
|--------|-----------|------|------------|
| TAM | All independent private-practice doctors in India | ~₹10.9B/year (~$131M USD) | 910,000 doctors × ₹12,000/year |
| SAM | Urban/semi-urban doctors with web access | ~₹4.37B/year (~$53M USD) | 364,000 doctors × ₹12,000/year |
| SOM (12-month base case) | 1.5% capture in 3 target cities | ~₹10.8M/year (~$130K USD) | 900 doctors × ₹12,000/year |
| SOM (min viable) | Infrastructure break-even | ₹2.04M/year (~$24.5K USD) | 170 doctors × ₹12,000/year |

Key assumption: ₹1,000/month (₹12,000/year) subscription price point — **HIGH RISK — must validate via pricing interview before Phase 7.** Full sizing: `docs/ideation/MARKET-SIZING.md`.

### 5.3 Competitive Position

MedSlot's differentiated position: the only platform in the Indian independent doctor market combining **patient appointment discovery** with a **complete consultation workflow** (structured notes + PDF prescription generation + email delivery) on a **solo-practitioner subscription model** with no per-booking transaction fee.

**Winning statement:** "All existing solutions fall short at serving the independent doctor's full consultation workflow because their business models are built around patient traffic aggregation for large hospital networks, not practice management for solo practitioners. MedSlot puts the independent doctor in control of their practice, their patient data, and their daily workflow."

Full competitive matrix: `docs/ideation/COMPETITIVE-ANALYSIS.md`.

---

## 6. Target User Personas

### Persona 1: Priya — The Urban Indian Patient

- **Background:** 34 years old, Bengaluru, works in IT, books appointments from her laptop or mobile browser. Comfortable with web apps; uses Swiggy, HDFC NetBanking, and government e-services without friction.
- **Primary job (functional):** Book a medical appointment with a specialist without calling a clinic or taking time off work to walk in.
- **Frustrations with current solutions:** Practo redirects her to large hospital chains, not the neighbourhood specialist her friend recommended. Calling clinics results in busy signals, incorrect availability information, and appointments that aren't confirmed. She has prescription papers from 3 different doctors, none organised.
- **Switching moment:** When she wastes 45 minutes and an afternoon off to visit a clinic only to be told the doctor is fully booked for the day.
- **Success scenario:** Finds Dr. Arjun's profile in 30 seconds, sees his next available slot, books it in under 2 minutes, receives email confirmation, and later gets the prescription PDF — all from her laptop during a lunch break.
- **Environment:** Desktop browser (Chrome) primarily; sometimes mobile (Safari iOS). IST timezone. Indian phone number for OTP. Email used daily.

### Persona 2: Dr. Arjun — The Independent Practitioner

- **Background:** Cardiologist, 42 years old, Hyderabad. Solo clinic, sees 15–20 patients/day. MBBS + MD. Moderate tech proficiency — uses WhatsApp fluently, has tried Practo but finds the clinic management tools either too expensive or designed for multi-doctor practices. His receptionist keeps a paper diary.
- **Primary job (functional):** See today's appointments, open a consultation, record notes, issue a prescription, move to the next patient — with minimal platform friction.
- **Frustrations with current solutions:** Practo gives him patient bookings but zero consultation workflow. Paper prescriptions require him to keep copies, and patients frequently ask for duplicates via WhatsApp. He loses time daily to phone-scheduling and reminder calls.
- **Switching moment:** When a patient asks him for a prescription that was lost and he has no digital record. Or when he misses a booking because the phone wasn't answered.
- **Success scenario:** Logs in, sees 6 appointments lined up, opens consultation for the first patient, adds notes in 2 minutes, clicks "Issue Prescription", knows the patient got a PDF by email. All done. Move to next patient. No paper. No WhatsApp chasing.
- **Environment:** Desktop browser in his clinic (Chrome/Edge). Moderate internet (Jio broadband). SMS OTP is familiar. IST timezone. Expects a tool that works as fast as he talks.

### Persona 3: Admin User — MedSlot Operations

- **Background:** MedSlot team member responsible for doctor verification and account management. Reviews 5–20 doctor applications per week.
- **Primary job:** Review credential documents, cross-check MCI registration numbers, approve or reject applications within 48 hours. Suspend accounts if issues arise.
- **Environment:** Internal tool (Django admin panel); desktop browser; admin-only access.

---

## 7. Functional Requirements Reference

Full functional requirements specification (88 requirements across 13 functional areas) is in `docs/requirements/REQUIREMENTS.md §2`.

Functional areas:
- FR-AUTH: Authentication & Authorization (7 requirements)
- FR-REG-PAT: Patient Registration (3 requirements)
- FR-REG-DOC: Doctor Registration & Approval (4 requirements)
- FR-SEARCH: Doctor Search & Discovery (5 requirements)
- FR-PROFILE: Doctor Profile (5 requirements)
- FR-CAL: Availability Calendar Management (6 requirements)
- FR-BOOK: Appointment Booking (6 requirements)
- FR-APPT: Appointment Management (7 requirements)
- FR-CONSULT: Consultation Workflow (5 requirements)
- FR-RX: Prescription Generation & Delivery (8 requirements)
- FR-RECORD: Health Record Management (5 requirements)
- FR-NOTIF: Notifications (6 requirements)
- FR-ADMIN: Admin Panel (6 requirements)
- FR-SUB: Subscription Management (6 requirements)

Business Rules catalog (30 rules across 8 categories): `docs/requirements/BUSINESS-RULES.md`

---

## 8. Non-Functional Requirements Summary

Full specification: `docs/requirements/REQUIREMENTS.md §4`. Key targets:

| ISO 25010 Category | Requirement | Target | Reference |
|-------------------|-------------|--------|-----------|
| Performance Efficiency | API P95 response time | ≤ 200ms (500 concurrent users) | NFR-PE-001 |
| Performance Efficiency | Doctor discovery LCP | ≤ 2.5s | NFR-PE-002 |
| Performance Efficiency | Dashboard LCP | ≤ 3.0s | NFR-PE-003 |
| Performance Efficiency | Prescription PDF generation | ≤ 4s end-to-end P95 | NFR-PE-004 |
| Reliability | Monthly uptime | ≥ 99.9% | NFR-REL-001 |
| Reliability | RTO | ≤ 1 hour | NFR-REL-002 |
| Reliability | RPO | ≤ 30 minutes | NFR-REL-003 |
| Security | Authentication | SMS OTP only (no password) | NFR-SEC-004 |
| Security | Encryption in transit | TLS 1.2+ | NFR-SEC-001 |
| Security | Encryption at rest | AES-256 (RDS + S3 SSE) | NFR-SEC-002, NFR-SEC-003 |
| Security | Authorization | RBAC (Patient / Doctor / Admin) | NFR-SEC-005 |
| Security | PHI in logs | Zero PHI in plaintext logs | NFR-SEC-011 |
| Usability | Booking flow time | ≤ 2 minutes P50 (new patient) | NFR-USE-001 |
| Usability | Accessibility | WCAG 2.1 Level AA | NFR-USE-002 |
| Maintainability | Test coverage | ≥ 90% line coverage | NFR-MAIN-001 |
| Compatibility | API standard | REST, versioned at /api/v1/, snake_case JSON | NFR-COMPAT-001/002 |
| Portability | Containerization | Docker OCI images, ECS Fargate | NFR-PORT-001/002 |

---

## 9. Feature Specifications

> Features are organized by user journey. For each feature: user stories, key acceptance criteria, feature-level success metric, business rules, and dependencies. Full FR details in `docs/requirements/REQUIREMENTS.md`.
> Wireframe links: TBD — produced in Phase 5 (UX Design).

---

### Feature 1: Authentication & OTP Onboarding

**One-line description:** Passwordless SMS OTP login and registration for patients and doctors, enforced with rate limiting and lockout protection.

**User Job:** Gain secure access to the platform without creating or remembering a password — a friction point that causes abandonment in health apps.

**User Stories:** US-001 (patient registration), US-002 (patient login), US-012 (doctor registration), US-013 (doctor login)

**Key Acceptance Criteria:**
- [ ] 6-digit OTP delivered via MSG91 within 10 seconds; valid for 5 minutes
- [ ] 3 failed attempts within 10 minutes → 15-minute lockout; clear user message displayed
- [ ] Successful OTP → JWT issued (24h expiry); user redirected to correct dashboard by role
- [ ] Rate limit: max 5 OTP requests per phone per 60 minutes; excess returns HTTP 429

**Feature-Level Success Metric:** OTP registration completion rate ≥ 75% (OTP sent → profile completed). Measured: auth logs, monthly from Day 1.

**Business Rules:** BR-001 (5min OTP expiry), BR-002 (lockout), BR-003 (one phone = one account), BR-004 (24h session), BR-005 (rate limit)

**Dependencies:** MSG91 production account provisioned; Redis deployed for rate-limit counters.

**Applicable NFRs:** NFR-SEC-004, NFR-SEC-006, NFR-SEC-007, NFR-REL via FR-NOTIF-001

---

### Feature 2: Doctor Search & Discovery

**One-line description:** Public-facing, SEO-indexable search that lets patients find verified independent doctors by specialty and city with available-slot visibility.

**User Job:** Discover the right verified doctor for my health need, in my city, with confidence — without calling clinics or relying on word-of-mouth alone.

**User Stories:** US-003 (search by specialty), US-004 (filter by city)

**Key Acceptance Criteria:**
- [ ] Search is accessible without authentication (public page; doctor results are SSR for SEO)
- [ ] Specialty filter: single select from 13-specialty fixed taxonomy
- [ ] City filter: text match on `clinic_city` field
- [ ] Only Approved doctor accounts appear in results
- [ ] Each result card: name, specialty, clinic name, area, city, next available slot date
- [ ] No results for invalid filter combination shows helpful empty state message

**Feature-Level Success Metric:** Search-to-profile click-through rate ≥ 50%. Measured: `doctor_search_performed` + `doctor_profile_viewed` events in analytics_events table.

**Business Rules:** BR-016 (only Approved doctors visible), BR-029 (fixed taxonomy)

**Dependencies:** Doctor profiles with Approved status exist; SSR rendering configured in Next.js for SEO.

**Applicable NFRs:** NFR-PE-002 (LCP ≤ 2.5s), NFR-USE-002 (WCAG 2.1 AA)

---

### Feature 3: Doctor Profile & Slot View

**One-line description:** Verified doctor's public profile displaying credentials, clinic information, and interactive 7-day slot calendar.

**User Job:** Evaluate a specific doctor's credentials and availability before committing to a booking.

**User Stories:** US-005 (view doctor profile)

**Key Acceptance Criteria:**
- [ ] Profile shows: name, specialty, "MCI Verified" indicator, clinic name, clinic address (area + city), available slots for next 7 calendar days
- [ ] Only available (unbooked, non-blocked) slots are displayed
- [ ] Profile accessible without authentication
- [ ] Unauthenticated user clicking "Book" redirects to OTP flow; slot selection preserved

**Feature-Level Success Metric:** Profile-to-booking attempt rate ≥ 40%. Measured: `doctor_profile_viewed` → `slot_selected` in analytics.

**Business Rules:** BR-016 (only Approved doctors), BR-008 (30-day slot window; profile shows next 7 days subset)

**Dependencies:** Feature 6 (Doctor Availability Calendar) must be configured for slots to appear.

**Applicable NFRs:** NFR-PE-002 (LCP ≤ 2.5s), NFR-USE-005 (inline validation)

---

### Feature 4: Appointment Booking

**One-line description:** Patient selects an available slot, reviews booking summary, confirms, and receives email confirmation — with race-condition protection against double-booking.

**User Job:** Secure a specific appointment time with certainty, without any ambiguity about whether the booking went through.

**User Stories:** US-006 (book appointment)

**Key Acceptance Criteria:**
- [ ] Booking summary shown before confirmation: doctor name, specialty, clinic address, date, time
- [ ] Slot locked via database row-level transaction; concurrent booking resolved deterministically (one succeeds, one receives "slot no longer available")
- [ ] Appointment created with status = Scheduled; slot removed from available view immediately
- [ ] Patient receives booking confirmation email within 60 seconds
- [ ] Doctor receives new booking notification email within 60 seconds
- [ ] Only Patient-role users can book; Doctor/Admin roles receive 403

**Feature-Level Success Metric:** Booking confirmation rate (slot selected → booking confirmed) ≥ 80%. Measured: `slot_selected` → `appointment_booked` event delta.

**Business Rules:** BR-006 (one slot / one patient), BR-007 (one patient / one doctor / one date), BR-009 (patients only book)

**Dependencies:** Feature 3 (Doctor Profile), Feature 1 (Authentication), SendGrid provisioned.

**Applicable NFRs:** NFR-PE-001 (P95 ≤ 200ms), NFR-USE-001 (≤ 2 min end-to-end)

---

### Feature 5: Appointment Management

**One-line description:** Patient views all appointments (upcoming + past); patient and doctor can cancel; doctor can mark outcome (Completed / No-Show / Cancelled).

**User Job (Patient):** Know exactly what appointments I have coming up, and cancel if my plans change — without calling the clinic.
**User Job (Doctor):** See my queue, manage outcomes, and keep records accurate.

**User Stories:** US-007 (view appointments), US-008 (patient cancel), US-020 (doctor mark outcome), US-021 (doctor cancel)

**Key Acceptance Criteria:**
- [ ] Patient: all appointments sorted by date descending; each shows doctor name, specialty, date, time, clinic, status
- [ ] Patient cancel: allowed only if appointment is Scheduled AND current time > appointment start − 2 hours; cancellation email sent to doctor within 60 seconds
- [ ] Doctor cancel: allowed any time before appointment start; cancellation email sent to patient within 60 seconds
- [ ] Doctor mark No-Show: allowed only after appointment start time has passed
- [ ] Terminal statuses (Completed, No-Show, Cancelled) are immutable

**Feature-Level Success Metric:** Cancellation success rate (cancel attempted → cancel confirmed, within window) ≥ 95%. Measured: `appointment_cancelled` events vs. cancellation errors.

**Business Rules:** BR-010 (2h patient window), BR-011 (doctor anytime), BR-012 (terminal immutability)

**Dependencies:** Feature 4 (Appointment Booking), SendGrid.

**Applicable NFRs:** NFR-PE-001

---

### Feature 6: Doctor Availability Calendar

**One-line description:** Doctor configures working days, working hours, slot duration, and blocked dates; system auto-generates a rolling 30-day bookable slot window.

**User Job:** Control exactly when patients can book me — without manually entering each slot.

**User Stories:** US-014 (configure calendar)

**Key Acceptance Criteria:**
- [ ] Doctor selects working days (Mon–Sun checkboxes), start/end time per day, slot duration (15/30/45/60 min)
- [ ] System generates all slots within working hours for selected days, 30-day rolling window
- [ ] Doctor can block specific dates (no slots generated for blocked dates)
- [ ] Calendar changes do not modify or cancel existing Scheduled appointments
- [ ] End time ≤ start time returns inline validation error; not saved
- [ ] Slot window regenerates daily at midnight IST

**Feature-Level Success Metric:** Calendar setup completion rate within 48h of account approval ≥ 90%. Measured: `doctor_calendar_configured` event vs. `doctor_approved` event delta.

**Business Rules:** BR-008 (30-day window), BR-015 (non-Approved cannot configure)

**Dependencies:** Feature 10 (Doctor Registration & Approval) — account must be Approved.

---

### Feature 7: Consultation Workflow

**One-line description:** Doctor opens a consultation for today's appointment, records structured clinical notes (Chief Complaint, Diagnosis, Plan), and saves drafts before issuing a prescription.

**User Job:** Document the clinical encounter accurately and efficiently, without the structure of an EMR and without the chaos of a notepad.

**User Stories:** US-017 (open consultation), US-018 (write notes)

**Key Acceptance Criteria:**
- [ ] Consultation can only be opened for Scheduled appointments on today's date (IST)
- [ ] Opening consultation transitions appointment → In Consultation
- [ ] Note form: Chief Complaint (required), History (optional), Examination Findings (optional), Diagnosis (required), Plan (optional)
- [ ] Draft save persists notes; doctor can continue to prescription without losing work
- [ ] Notes immutable after appointment status = Completed; edit attempt returns 403
- [ ] Only the assigned doctor can access consultation form; other roles return 403

**Feature-Level Success Metric:** Consultation-open-to-prescription-issued rate ≥ 70%. Measured: `consultation_opened` → `prescription_issued` event rate.

**Business Rules:** BR-021 (notes = doctor + patient read-only via prescription)

**Dependencies:** Feature 5 (Appointment Management — must have Scheduled appointment for today).

**Applicable NFRs:** NFR-SEC-005 (RBAC), NFR-MAIN-004 (PHI audit log)

---

### Feature 8: Prescription Generation & Delivery

**One-line description:** Doctor issues a structured prescription; system auto-generates a formatted PDF, stores it in S3, and emails the patient a 7-day download link within 60 seconds.

**User Job (Doctor):** Issue a prescription to the patient without printing, writing, or managing paper. Know it reached them.
**User Job (Patient):** Have a digital copy of my prescription, accessible whenever I need it.

**User Stories:** US-019 (issue prescription), US-010 (view prescription), US-011 (download PDF)

**Key Acceptance Criteria:**
- [ ] Prescription form: ≥ 1 medicine entry (name, dosage, frequency, duration — all required per entry); additional instructions (optional); follow-up date (optional)
- [ ] PDF generated by WeasyPrint containing: MedSlot header, doctor details, patient name, appointment date, Chief Complaint, Diagnosis, medicines table, instructions, follow-up date, generation timestamp
- [ ] PDF stored at `prescriptions/{patient_id}/{appointment_id}.pdf` in S3 with SSE-S3 encryption
- [ ] Appointment status transitions to Completed on successful prescription issuance
- [ ] Patient receives prescription email with 7-day pre-signed URL within 60 seconds
- [ ] Patient can regenerate a fresh 7-day URL via My Appointments at any time
- [ ] Prescription records are permanently immutable (no edit or delete by any role)

**Feature-Level Success Metric:** Prescription PDF delivery success rate ≥ 98% (prescription issued → patient email delivered with working link). Measured: SendGrid delivery events + `prescription_pdf_downloaded` analytics event.

**Business Rules:** BR-023 (only for In-Consultation appointments), BR-024 (immutability), BR-019/020 (PHI protection)

**Dependencies:** AWS S3 bucket configured with SSE-S3; WeasyPrint installed on dedicated ECS task; SendGrid provisioned; Feature 7 (Consultation Workflow).

**Applicable NFRs:** NFR-PE-004 (≤ 4s PDF generation), NFR-SEC-003 (S3 SSE), NFR-SEC-008 (no public S3 access), NFR-REL-004/005 (retry on failure)

---

### Feature 9: Patient Health Records

**One-line description:** Patient uploads personal health documents (PDFs, images) to their encrypted S3 folder; views list; downloads; soft-deletes.

**User Job:** Keep all my health history in one place — lab reports, scans, prescriptions from other clinics — so I never have to search through WhatsApp or physical files again.

**User Stories:** US-009 (upload records), US-027 (soft delete — Should Have)

**Key Acceptance Criteria:**
- [ ] Supported formats: PDF, JPEG, PNG; max 10MB per file
- [ ] Files stored at `records/{patient_id}/{uuid}.{ext}` in S3 with SSE-S3 encryption
- [ ] Patient list: original filename, file type, upload date; sorted by upload date descending
- [ ] 7-day pre-signed URL for download
- [ ] Soft delete: record marked deleted in DB; S3 object retained (10-year compliance)

**Feature-Level Success Metric:** Health record upload success rate ≥ 95%. Measured: `health_record_uploaded` events vs. upload errors.

**Business Rules:** BR-019 (PHI protection), BR-022 (10-year retention), BR-023 (soft delete only)

**Dependencies:** AWS S3 bucket with SSE-S3; Feature 1 (Patient authentication).

**Applicable NFRs:** NFR-PE-005 (upload ≤ 5s P95), NFR-SEC-003 (S3 SSE), NFR-SEC-008 (no public access)

---

### Feature 10: Doctor Registration & Admin Verification

**One-line description:** Self-service doctor registration form with credential submission; admin verification queue with approve/reject/suspend/reactivate actions.

**User Job (Doctor):** Join MedSlot and start receiving patient bookings without navigating a complex sales process.
**User Job (Admin):** Verify that only legitimate, licensed practitioners are on the platform — quickly and systematically.

**User Stories:** US-012 (register), US-022 (admin reviews), US-023 (admin approves/rejects), US-024 (admin suspends)

**Key Acceptance Criteria:**
- [ ] Registration form: name, mobile, specialty (from taxonomy), MCI number, clinic name, area, city, credential document (PDF/image ≤ 10MB)
- [ ] Account created with status = Pending Verification; admin email sent within 60 seconds
- [ ] Admin queue: all Pending applications with document link; approve/reject with reason
- [ ] Approval → 30-day trial starts; doctor receives approval email; can now log in
- [ ] Rejection → rejection email with admin-entered reason; doctor cannot log in
- [ ] Suspend → profile removed from search; doctor login blocked; patient data readable for 90 days
- [ ] Reactivate → full access restored

**Feature-Level Success Metric:** Doctor application → approval conversion rate ≥ 80% (of legitimate applications). Measured: admin panel approval/rejection ratio.

**Business Rules:** BR-016 (only Approved visible), BR-017 (non-Approved blocked), BR-018 (MCI number mandatory), BR-029 (specialty taxonomy)

**Dependencies:** SendGrid; AWS S3 (credential document storage, admin-only); Django admin panel.

---

### Feature 11: Subscription Management

**One-line description:** Doctor 30-day trial, Razorpay Subscriptions integration for recurring billing, webhook-driven subscription status management, and payment failure handling with 7-day grace period.

**User Job (Doctor):** Subscribe to MedSlot with minimal friction; receive clear notice if my payment fails before losing access.

**User Stories:** US-025 (subscribe, trial, payment)

**Key Acceptance Criteria:**
- [ ] 30-day trial from approval date; dashboard fully accessible; trial expiry banner shown from day 25
- [ ] Subscription created via Razorpay Subscriptions API; subscription_id stored on DoctorSubscription
- [ ] Webhook "subscription.activated" → status = Active; trial banner removed
- [ ] Webhook payment failure → status = Payment Failed; doctor email with payment link sent
- [ ] Payment Failed > 7 days → dashboard access suspended (HTTP 402); existing patient appointment records readable for 90 days
- [ ] All Razorpay webhooks validated via HMAC-SHA256 before processing; invalid signatures logged as security alerts

**Feature-Level Success Metric:** Trial-to-paid conversion rate ≥ 30%. Measured: DoctorSubscription status transitions, monthly cohort analysis.

**Business Rules:** BR-024 (30-day trial), BR-025 (Payment Failed grace period), BR-026 (webhook validation)

**Dependencies:** Razorpay Subscriptions account provisioned; webhook endpoint secured; ECS environment variables for Razorpay API keys.

**Applicable NFRs:** NFR-SEC-009 (webhook HMAC validation)

---

## 10. Technical Architecture Overview

### 10.1 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MedSlot Platform                     │
│                                                         │
│  ┌──────────────────┐      ┌────────────────────────┐  │
│  │  Next.js 14      │      │  Django 5 + DRF 3.15  │  │
│  │  TypeScript 5    │◄────►│  Python 3.12          │  │
│  │  Tailwind CSS 3  │      │  /api/v1/             │  │
│  │  Zustand 4       │      │  PostgreSQL 16 (RDS)  │  │
│  └──────────────────┘      │  Redis 7              │  │
│                             └────────────────────────┘  │
│  AWS ECS Fargate (ap-south-1)                           │
│  AWS CloudFront CDN ← Static assets + S3 documents      │
└─────────────────────────────────────────────────────────┘
         │                    │
    MSG91 (OTP)         SendGrid (Email)
    Razorpay Sub        AWS S3 (Files)
```

Full architecture design: `docs/design/ARCHITECTURE.md` (produced in Phase 4).

### 10.2 Integration Summary

| System | Purpose | Direction | Auth |
|--------|---------|-----------|------|
| MSG91 | OTP SMS delivery | Outbound | API Key |
| SendGrid | Transactional email | Outbound | API Key / Bearer |
| AWS S3 | File storage (records + PDFs) | Bidirectional | IAM Role (ECS task) |
| AWS CloudFront | CDN | Outbound to users | N/A |
| Razorpay Subscriptions | Doctor subscription billing | Bidirectional (API + webhook) | API Key + HMAC webhook |

Full integration contracts: `docs/requirements/REQUIREMENTS.md §6`.

### 10.3 Core Data Model (Entities)

| Entity | Sensitivity | Key Relationships |
|--------|-------------|-----------------|
| User | PII | 1:1 PatientProfile or DoctorProfile; role = patient / doctor / admin |
| PatientProfile | PII | 1:N Appointment, HealthRecord |
| DoctorProfile | PII | 1:1 AvailabilityCalendar; 1:N Appointment; FK Specialty |
| Specialty | None | Referenced by DoctorProfile; fixed seed table (13 rows) |
| AvailabilityCalendar | None | 1:N AppointmentSlot |
| AppointmentSlot | None | Generated; 1:1 Appointment when booked |
| Appointment | PII | FK Patient + Doctor + Slot; 1:1 ConsultationNote; 1:1 Prescription |
| ConsultationNote | **PHI** | FK Appointment; immutable post-Completed |
| Prescription | **PHI** | FK Appointment; FK ConsultationNote; 1:1 PrescriptionPDF path |
| HealthRecord | **PHI** | FK PatientProfile; soft-delete; S3-backed |
| DoctorSubscription | PII | 1:1 DoctorProfile; Razorpay subscription_id |

Full data entity inventory: `docs/requirements/REQUIREMENTS.md §5`.

---

## 11. Analytics & Instrumentation Plan

See full specification: `docs/prd/PRD-ANALYTICS-PLAN.md`.

### Summary — Core Events

| Event | Trigger | Goal Metric |
|-------|---------|-------------|
| `patient_registered` | Patient completes OTP + profile | OTP registration rate |
| `doctor_search_performed` | Patient submits search | Acquisition funnel |
| `doctor_profile_viewed` | Patient opens doctor profile | Discovery funnel |
| `appointment_booked` | Booking confirmed | Booking completion rate |
| `appointment_cancelled` | Either party cancels | Cancellation rate |
| `consultation_opened` | Doctor starts consultation | Consultation funnel |
| `prescription_issued` | Prescription created + PDF sent | Consultation completion rate |
| `prescription_pdf_downloaded` | Patient downloads PDF | Prescription delivery success |
| `health_record_uploaded` | Patient uploads record | Feature adoption |
| `doctor_approved` | Admin approves doctor | Verification funnel |
| `doctor_subscription_activated` | Razorpay webhook: activated | Trial-to-paid conversion |

### Instrumentation Approach

No third-party analytics platform in v1. Events stored in PostgreSQL `analytics_events` table (user_id hashed, event_type, properties JSONB, created_at). Queried via read replica by ops team. PHI never stored in analytics event properties.

---

## 12. Launch & Rollout Strategy

### 12.1 Feature Flag Strategy

No percentage-based feature flags for v1. Each feature is either shipped or not. The staged rollout below is the primary access control mechanism. The admin approval workflow provides natural doctor-side access control.

### 12.2 Staged Rollout Plan

| Stage | Access | Criteria to Advance | Rollback Trigger |
|-------|--------|---------------------|-----------------|
| **Stage 1 — Internal** | MedSlot team + 2–3 invited doctors (manually onboarded); no public registration link | No P0 bugs after 48h; 1 full end-to-end consultation workflow completed; PDF delivery confirmed | Any data loss or PHI exposure |
| **Stage 2 — Soft Launch** | 5–10 approved doctors in 1 city (Bengaluru); invite-only patient registration (shared link); doctor registration open by invite only | Doctor approval turnaround ≤ 48h; booking funnel completion ≥ 60%; OTP delivery rate ≥ 98%; zero data integrity issues after 2 weeks | Error rate > 1%; P95 > 200ms sustained; OTP failure > 5% |
| **Stage 3 — Public Launch** | All target cities; open doctor registration; open patient registration at public URL | Stage 2 criteria held for 2 weeks; load test passing at 120% expected peak; WeasyPrint POC result is ≤ 4s P95 | Any P0 bug; SLA breach |

### 12.3 Launch Readiness Checklist

- [ ] All Stage 1 and Stage 2 criteria met
- [ ] AWS infrastructure provisioned: ECS Fargate (ap-south-1), RDS PostgreSQL, Redis, S3, CloudFront
- [ ] MSG91 production account active; OTP delivery tested in production environment
- [ ] SendGrid domain verified; transactional email deliverability confirmed (< 2% spam rate)
- [ ] Razorpay Subscriptions production account; subscription plan created; webhooks registered
- [ ] WeasyPrint load test POC: 50 concurrent PDFs in ≤ 4s P95
- [ ] HTTPS certificate on all domains (TLS 1.2+); SSL Labs Grade A
- [ ] S3 buckets: public access blocked; SSE-S3 on all buckets
- [ ] RDS encryption enabled; automated backups on 30-minute interval
- [ ] CloudWatch alarms: API error rate > 1%, P95 > 400ms, disk > 80%
- [ ] Doctor verification SLA defined and documented: 48 business-hour target
- [ ] Admin panel operational: credential document review workflow tested
- [ ] Pricing interview with ≥ 5 target doctors completed; ₹1,000/month subscription price validated
- [ ] Performance load test: 500 concurrent users; P95 < 200ms
- [ ] PHI audit: no PHI in application logs confirmed via log scan
- [ ] OpenAPI spec at `/api/schema/` returns valid spec
- [ ] Test coverage ≥ 90% in CI pipeline

---

## 13. Constraints & Assumptions

### 13.1 Constraints

| Type | Constraint | Impact |
|------|-----------|--------|
| Budget | AWS cloud cost ≤ $2,000/month | ECS task sizing and RDS instance class must be reviewed in Phase 4; PDF generation task memory must be bounded |
| Timeline | Core flow complete by 2026-10-31 (22 weeks from start) | Scope freeze enforced at Phase 6; cut-scope protocol triggers at Sprint 3 if velocity is behind |
| Compliance | Encryption at rest (AES-256) and in transit (TLS 1.2+) from day one; no full HIPAA/DISHA required | Non-negotiable — cannot be retrofitted |
| Team | 3 developers (1 full-stack lead, 1 frontend, 1 backend) | Architecture complexity must match team throughput |
| Authentication | SMS OTP only — no password, no social login | No OAuth infrastructure needed |
| No payment processing | Razorpay used only for MedSlot's doctor subscription billing — not for consultation fees | Consultation fee collection is entirely outside the platform |
| Web-first | Desktop-primary (1280px+); responsive to 375px mobile | No native app; no mobile-first CSS patterns |

### 13.2 Assumptions Summary

High-risk assumptions requiring validation before Phase 7:

| ID | Assumption | Risk if Wrong | Validation Method | Owner | Due |
|----|-----------|--------------|-------------------|-------|-----|
| A-01-003 | Doctor subscription WTP = ₹1,000/month | Wrong price → subscription model fails; must revise before billing implementation | 5-doctor pricing interview | Product Owner | Before Phase 7 |
| A-02-009 | WeasyPrint PDF generation ≤ 4s P95 under concurrent load | PDF SLA miss → consultation workflow unusable at scale | Load test POC: 50 concurrent PDFs | Tech Lead | Before Sprint 5 |
| A-02-003 | 30-day trial is sufficient for doctors to see value before paying | Short trial → low trial-to-paid conversion | Pricing interview + Stage 1/2 conversion data | Product Owner | Month 3 |

Full assumption log: `docs/assumptions/01-ideation-assumptions.md`, `docs/assumptions/02-requirements-assumptions.md`.

---

## 14. Open Questions

| ID | Question | Owner | Due | Status |
|----|----------|-------|-----|--------|
| OQ-001 | Initial GTM launch cities — confirmed as Bengaluru, Hyderabad, Pune? | Product Owner | Phase 4 start | Open |
| OQ-002 | Doctor subscription plan configuration — monthly-only, annual option, or both? What is the annual discount? | Tech Lead | Before Phase 7 | Open |
| OQ-003 | Doctor pricing interview: is ₹1,000/month the right subscription price? What feature set justifies payment? | Product Owner | Before Phase 7 | **High Priority** |
| OQ-004 | Admin panel — Django admin framework (default) vs. custom-built internal tool? | Tech Lead | Phase 4 Architecture | Open |
| OQ-005 | Appointment reminder scheduler — Celery Beat (in-process) or AWS EventBridge scheduled rule? | Tech Lead | Phase 4 Architecture | Open |

---

## 15. Glossary Reference

See `docs/prd/GLOSSARY.md` for all domain-specific terms.

---

## Appendix A: Referenced Documents

| Document | Path | Phase |
|----------|------|-------|
| Project Concept | `docs/ideation/PROJECT-CONCEPT.md` | 1 |
| Feasibility Report | `docs/ideation/FEASIBILITY-REPORT.md` | 1 |
| Stakeholder Map | `docs/ideation/STAKEHOLDER-MAP.md` | 1 |
| Success Metrics | `docs/ideation/SUCCESS-METRICS.md` | 1 |
| Market Sizing | `docs/ideation/MARKET-SIZING.md` | 1 |
| Competitive Analysis | `docs/ideation/COMPETITIVE-ANALYSIS.md` | 1 |
| Ideation Assumptions | `docs/assumptions/01-ideation-assumptions.md` | 1 |
| Requirements Specification | `docs/requirements/REQUIREMENTS.md` | 2 |
| User Stories | `docs/requirements/USER-STORIES.md` | 2 |
| Use Cases | `docs/requirements/USE-CASES.md` | 2 |
| Business Rules | `docs/requirements/BUSINESS-RULES.md` | 2 |
| Traceability Matrix | `docs/requirements/TRACEABILITY-MATRIX.md` | 2 |
| Requirements Assumptions | `docs/assumptions/02-requirements-assumptions.md` | 2 |
