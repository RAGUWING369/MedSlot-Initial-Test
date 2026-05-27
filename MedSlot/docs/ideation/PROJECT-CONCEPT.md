# Project Concept — MedSlot

**Phase:** 1 — Ideation
**Version:** 1.0
**Date:** 2026-05-25

---

## Vision Statement

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

---

## Problem Statement

### Patient-Side
Urban Indian adults aged 22–55 who need medical consultations **struggle with discovering and booking appointments with verified independent doctors** because the existing channels — phone calls, walk-ins, and fragmented online options primarily designed for large hospitals — are opaque, time-consuming, and entirely disconnected from any health record system. The result: delayed care decisions, wasted waiting-room time, and zero continuity of health documentation between visits.

### Doctor-Side
Independent doctors running solo or small clinics in India **struggle to manage their appointment calendar, conduct structured consultations, and deliver prescriptions digitally** because they have no affordable, focused tool — enterprise EMR systems are cost-prohibitive, and consumer appointment platforms (Practo, Lybrate) provide patient discovery but not a complete consultation workflow. The result: scheduling chaos managed via phone and WhatsApp, handwritten prescriptions with no digital record, and patient data trapped on paper.

---

## Unique Insight

India's independent doctor market (~910,000 practitioners in private practice) is structurally caught between two solutions that don't serve them: enterprise EMR/HIS systems designed for 50-bed hospitals, and patient-facing appointment aggregators built to generate traffic for large chains.

Post-COVID behavioural shifts have normalised digital-first healthcare interactions for both patients and doctors across urban India. MSG91's OTP infrastructure makes frictionless, secure authentication achievable without passwords or social login. WeasyPrint and AWS S3 make server-side PDF prescription delivery a solved engineering problem.

The independent doctor segment will pay a focused, affordable subscription for a tool that makes their daily consultation workflow faster — without the complexity of telehealth, pharmacy integration, or hospital-network billing. No incumbent is building this product for them.

---

## Target Opportunity

### Primary: OPP-003
Doctors waste significant time and effort on appointment scheduling logistics (phone tag, no-shows, manual reminders) and have no structured digital tool for conducting consultations and issuing prescriptions.

- **Severity:** High
- **Frequency:** Daily (affects every working day for every doctor on the platform)

### Enabling: OPP-001
Patients cannot discover verified independent doctors by specialty and location in a trustworthy, filterable way.

- **Severity:** High
- **Frequency:** 2–6 times per year per patient (high aggregate across the platform)

### Why These Two Are Inseparable
OPP-003 and OPP-001 are the two halves of the same two-sided marketplace. Solving OPP-001 (patient discovery) creates the patient volume that justifies solving OPP-003 (doctor workflow) — and vice versa. Both sides must be launched together for either to deliver value.

---

## Opportunity Map

| Opportunity ID | Unmet Need / Pain | User Type | Severity | Frequency |
|---------------|-------------------|-----------|----------|-----------|
| OPP-001 | Cannot discover verified doctors by specialty + location in a trustworthy, filterable way | Patient | High | Per-care-need |
| OPP-002 | No single place to store health records, prescriptions, and consultation history | Patient | Medium | Per-visit |
| OPP-003 | Appointment scheduling consumes disproportionate time (phone tag, manual reminders, no-show management) | Doctor | High | Daily |
| OPP-004 | No structured, digital way to issue prescriptions and deliver them to patients | Doctor | High | Per-consultation |
| OPP-005 | No transparent view of doctor availability — walk-in uncertainty persists | Patient | High | Per-care-need |
| OPP-006 | No affordable, focused practice tool for independent doctors — EMRs are overengineered and expensive | Doctor | Medium | Adoption-stage |

---

## Solution Summary

MedSlot is a **two-sided appointment marketplace with an integrated doctor consultation workflow**. The platform operates across two distinct roles:

**Patients** register via SMS OTP, search and filter verified doctors by specialty and location, view a doctor's profile and available calendar slots, and book a specific appointment time. They receive an email confirmation and can upload personal health records to their account. After a consultation, they receive their prescription as a PDF by email and can view it in their appointments history.

**Doctors** complete a self-registration with credential submission; after admin verification and approval, they configure their availability calendar (working days, hours, slot duration), view their appointment queue, and conduct consultations with structured note-taking. When ready, they issue a prescription that is automatically formatted as a PDF and emailed directly to the patient, stored in S3 with a time-limited pre-signed download URL. The appointment is then marked complete.

**MedSlot earns revenue through a monthly or annual subscription charged to doctors.** The platform does not process consultation fees or handle any financial transaction between doctor and patient — fee arrangements remain entirely between doctor and patient, handled outside the platform.

---

## Value Propositions

- **Zero-friction discovery (Patient):** Find and book a verified doctor by specialty and proximity in under 2 minutes — no phone calls, no walk-in queue uncertainty.
- **Persistent health continuity (Patient):** A single health record — uploaded documents, received prescriptions, full appointment history — accessible from any device.
- **Owned consultation workflow (Doctor):** Calendar, notes, and prescription delivery in one tool — the complete daily workflow without switching between a diary, a paper pad, and WhatsApp.
- **Full data ownership (Doctor):** Patient data belongs to the doctor's account, not to a hospital network or aggregator platform — no revenue sharing, no lock-in.
- **Verified online presence (Doctor):** A structured public profile that drives patient discovery without requiring the doctor to manage separate SEO, listings, or social media.

---

## Scope

### In Scope — v1 Core Release

**Patient Flow:**
- OTP-based registration and login (MSG91)
- Doctor discovery: search and filter by specialty and location
- Doctor profile view: credentials, specialty, clinic address, available slots
- Appointment booking: select available slot, confirm
- Booking confirmation via email (SendGrid)
- My Appointments: upcoming and past appointment history
- Health record upload: PDF and image files, ≤10MB per file, stored in AWS S3
- Received prescriptions: view and PDF download via pre-signed S3 URL

**Doctor Flow:**
- OTP-based registration with credential submission
- Admin-gated approval before account goes live
- Availability calendar configuration: working days, hours, slot duration
- Today's appointments and upcoming appointments dashboard
- Consultation session: open appointment, write structured notes
- Prescription issuance: structured form → auto-generated PDF → emailed to patient, stored in S3
- Mark appointment complete

**Platform Operations:**
- MedSlot admin panel: doctor verification queue, account status management
- Email notifications: booking confirmation, prescription delivery, appointment reminders (SendGrid)
- SMS OTP for all authentication events (MSG91)
- AWS S3 for health record and prescription PDF storage
- AWS CloudFront for static assets and S3-served documents

### Out of Scope — v1

| Exclusion | Reason / Revisit Trigger |
|-----------|--------------------------|
| Video / telehealth consultations | Requires WebRTC infrastructure; post-launch once booking flow is proven |
| In-app messaging / chat | Adds real-time complexity; not in core workflow |
| Pharmacy integration / medicine ordering | Separate value chain; post-launch partnership opportunity |
| Insurance billing / claim submission | Requires extensive integration; not in initial scope |
| Multi-doctor clinic accounts | Single-doctor accounts only; clinic grouping is post-v1 |
| Guest / anonymous booking | Mandatory OTP registration for all patients |
| Consultation fee processing (Razorpay) | Doctor handles fees directly with patient outside platform |
| Patient ratings / reviews | Trust-safety and legal complexity; post-launch |
| Push notifications | Email and SMS only in v1 |
| Native mobile app | Responsive web only; mobile app is post-launch if demand confirmed |
| Lab test ordering / integration | Out of defined application scope |

---

## Recommended Solution Approach

**Selected: Two-Sided Appointment Marketplace with Integrated Consultation Workflow**

The subscription revenue model only generates value when doctors see demonstrable patient volume flowing through the platform — which requires the patient-facing discovery side to be fully functional from day one. Both sides must launch together.

The integrated consultation workflow (structured notes + PDF prescription delivery) is what differentiates MedSlot from a pure calendar booking tool and justifies the subscription fee by delivering real, daily-workflow value that Practo's free tier does not provide to independent doctors.

---

## Alternatives Considered

### Approach B — Doctor-First Practice Management Tool (Rejected)
A pure B2B SaaS for doctors (no patient-facing discovery) would reduce frontend scope but creates an unsolvable bootstrapping problem: doctors won't pay for a tool with no patient volume, and patients have no reason to join a platform with no discovery layer. Eliminates the network effect central to long-term platform defensibility.

### Approach C — Health Records-First Platform (Rejected)
Longer time-to-value (patients must accumulate records before the platform becomes sticky), harder to monetise from doctors, and higher data regulatory surface area (primary health record storage). Does not address the acute doctor-side workflow pain that justifies subscription revenue.
