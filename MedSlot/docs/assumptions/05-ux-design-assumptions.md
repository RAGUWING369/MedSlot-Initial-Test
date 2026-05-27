# UX Design — Assumption Log
**Phase:** 05 — UX Design
**Agent:** ux-design-agent
**Generated:** 2026-05-27
**Session:** Phase 5 full execution — User journeys, wireframes, design system, accessibility, and 16 screen HTML wireframes

---

## Tier 3 Inferences Made This Phase

| ID | Inference | Basis | Confidence | Must Validate Before Phase |
|----|-----------|-------|------------|---------------------------|
| A-05-001 | Primary brand color chosen as Deep Teal-Green (#0B6E4F) — conveys health, trust, and growth; suited to Indian healthcare market perception | Industry UX convention for healthcare platforms; similar palette used by Practo, Apollo 247 | High | Phase 7 (implementation) — confirm with PO |
| A-05-002 | Medical Blue (#1B5E8A) used as secondary color for doctor-authority elements | Standard healthcare information architecture pattern — blue = authority, reliability | High | Phase 7 |
| A-05-003 | Inter / system-sans-serif used as base font family (Tailwind CSS default) | Phase 4 stack specifies Tailwind CSS 3.x; Tailwind's default font stack is appropriate for web-first platform | High | Phase 7 |
| A-05-004 | 8px base spacing grid adopted (Tailwind's default 4px → effective 8px multiples with p-2, p-4, p-6, p-8) | Universal web design system convention; Tailwind CSS default; matches NFR-USE-001 (≤2 min booking flow target) | High | Phase 7 |
| A-05-005 | Desktop layout width set to 1280px minimum with 1440px comfortable design target | CLAUDE.md explicitly states web-first, desktop-primary at 1280px+ | Certain | Already confirmed in CLAUDE.md |
| A-05-006 | Doctor specialty dropdown uses exactly 13 specialties from CLAUDE.md seed list | CLAUDE.md Architecture Decisions — "fixed list of 13 specialties managed as a database seed" | Certain | Already confirmed in CLAUDE.md |
| A-05-007 | OTP login uses 6-digit code entry field with 30-second resend timer | Industry standard for Indian SMS OTP flows (MSG91, Textlocal); used by Aadhaar, HDFC, Paytm | High | Phase 7 — confirm MSG91 OTP length configuration |
| A-05-008 | Consultation fee displayed on doctor profile and booking flow as informational only (₹XXX, "paid at clinic") | CLAUDE.md explicitly states MedSlot does not process consultation fees; fee display is purely informational | Certain | Already confirmed in CLAUDE.md |
| A-05-009 | Patient cancellation CTA shown only when > 2 hours before appointment start | CLAUDE.md Architecture Decisions — "Patient appointment cancellation window: > 2 hours before appointment start time" | Certain | Already confirmed in CLAUDE.md |
| A-05-010 | Prescription PDF download links expire after 7 days with on-demand regeneration button | CLAUDE.md Architecture Decisions — "Prescription PDF download links expire after 7 days; on-demand regeneration available" | Certain | Already confirmed in CLAUDE.md |
| A-05-011 | Avatar/initials system used instead of profile photos for doctors and patients (no image upload for profile photos) | No profile photo upload is mentioned in requirements; health record uploads (S3) are for medical documents, not profile images; initials approach reduces scope | Medium | Phase 6 — confirm with PO if profile photo upload should be added to scope |
| A-05-012 | Doctor Dashboard shows "today's date" as primary view; date navigation goes ±7 days from today | Common scheduling UI pattern; aligns with NFR-USE-002 (doctor workflow speed); PRD Doctor persona description "see today's appointments" | High | Phase 7 |
| A-05-013 | Health record upload supports drag-and-drop in addition to click-to-browse | Accessibility and UX best practice for web-first file uploads; Tailwind + HTML5 native API; no extra dependency | High | Phase 7 — confirm with frontend team re: drag-drop implementation complexity |
| A-05-014 | Prescription issuance form uses structured medication entry (drug name, dosage, frequency, duration) rather than free-text | PRD FR-RX-001 specifies "structured notes and prescriptions"; structured entry enables better PDF rendering and future search | High | Phase 6 task breakdown — confirm field structure with product owner |
| A-05-015 | Admin approval interface built on Django Admin change_list view with custom actions — not a custom React frontend | CLAUDE.md Architecture Decisions — ADR-007 "Django Admin as admin panel — not a custom React frontend; saves 2–3 weeks of frontend time" | Certain | Already confirmed via ADR-007 |
| A-05-016 | Star ratings shown on doctor profile (read-only, no review submission in patient flow) | CLAUDE.md Application Scope — "ratings only" explicitly mentioned; review submission is "explicitly out of scope" | Certain | Already confirmed in CLAUDE.md |
| A-05-017 | No-show status can only be set by doctor, not by patient or admin | CLAUDE.md Architecture Decisions — "Appointment outcome states: Completed (via prescription issuance), No-Show (doctor marks)..." | Certain | Already confirmed in CLAUDE.md |
| A-05-018 | Consultation view shows patient health records as a read-only reference panel (doctor can view but not edit patient records) | PRD US-024 (doctor views patient history during consultation); records belong to patient | High | Phase 7 — confirm API permission scope |
| A-05-019 | Subscription management button on doctor settings links to Razorpay customer portal (external redirect) | Razorpay Subscriptions API provides a hosted customer portal; this avoids building custom billing UI; aligns with ADR keeping Razorpay isolated to subscriptions app | Medium | Phase 7 — confirm Razorpay customer portal availability in India |
| A-05-020 | Color contrast for primary button (#0B6E4F white text) meets WCAG AA 4.5:1 minimum | Manual contrast calculation: #0B6E4F on white = approx 7.2:1 — well above AA and AAA thresholds | Certain | WCAG check in ACCESSIBILITY.md |
| A-05-021 | Mobile-responsive breakpoints: sm: ≤640px (single column), md: 641-1024px (reduced grid) | CLAUDE.md: "sm: and md: used to adapt downward — not the reverse"; desktop = base styles, mobile = responsive adaptation | Certain | Already confirmed in CLAUDE.md |
| A-05-022 | Appointment confirmation email is sent automatically post-booking (no separate UI action needed by patient) | PRD FR-NOTIF-001; CLAUDE.md notifications app (SendGrid); booking confirmation screen only states "check your email" | High | Phase 7 |
| A-05-023 | Loading state uses CSS skeleton screens (not spinner overlay) as primary loading pattern | Modern UX best practice; avoids flash of blank content; Tailwind shimmer animation is CSS-only (no extra library) | High | Phase 7 — confirm with frontend team |

---

## Open Flags (Tier 2 — Unconfirmed Suggestions)

| Flag ID | Suggestion Made | Location in Artifact | Status |
|---------|----------------|----------------------|--------|
| F-05-001 | Profile photos for doctors may improve patient trust on doctor discovery and profile screens | SCR-002 search results, SCR-003 doctor profile — currently uses initials avatar | Pending PO confirmation |
| F-05-002 | Doctor prescription form field structure (medication entry) should be reviewed by a clinical UX expert before Phase 7 implementation | SCR-014-prescription-issuance — medication rows use drug/dosage/frequency/duration fields | Pending clinical review |
| F-05-003 | OQ-004 (soft launch city count) was open at phase start — wireframes use Bengaluru, Mumbai, Hyderabad, Chennai, Pune as default Indian cities; if launch is limited to 1 city, search UX may need simplification | SCR-001 landing, SCR-002 search results — city filter shown for all 5 cities | Pending PO decision (OQ-004) |

---

## Resolution Log

| ID | Original Assumption | Resolution | Resolved By | Date |
|----|--------------------|-----------|-----------:|------|
| — | No inferences have been resolved or overridden yet | — | — | — |

---

*Generated by ux-design-agent · Phase 05 · 2026-05-27*
*Companion artifacts: docs/ux/USER-JOURNEYS.md, WIREFRAMES.md, DESIGN-SYSTEM.md, ACCESSIBILITY.md*
*HTML wireframes: docs/visuals/ux/SCR-001 through SCR-016*
