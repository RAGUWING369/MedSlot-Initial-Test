# Success Metrics — MedSlot

**Phase:** 1 — Ideation
**Version:** 1.0
**Date:** 2026-05-25

---

## Desired Outcome

**Primary Outcome:** Increase the number of doctors who are active, paying MedSlot subscribers completing at least one full consultation workflow (appointment → notes → prescription) per week.

This metric is the north star because it proves two things simultaneously: (1) the platform is generating real patient demand (appointments are being booked), and (2) the doctor's subscription delivers tangible daily value (they use the consultation workflow, not just the calendar).

---

## Business KPIs

| Metric | Baseline | Target | Timeline | Measurement Method |
|--------|----------|--------|----------|--------------------|
| Monthly Recurring Revenue (MRR) | ₹0 (launch) | ₹170,000/month (~$2,050 USD) — covers AWS infrastructure | Month 12 post-launch | Subscription billing system |
| Number of paying doctor subscribers | 0 | 170 paying doctors | Month 12 post-launch | Subscription billing system |
| Doctor monthly churn rate | Unknown | < 5% per month | From Month 3 | Subscription billing system: (doctors who cancelled) / (total active at start of month) |
| Doctor trial-to-paid conversion rate | Unknown | ≥ 30% | From Month 3 | Cohort analysis: (doctors who converted from trial) / (doctors who started trial) |
| Monthly Active Patients (MAP) | 0 | 500 registered + active patients | Month 6 post-launch | Platform analytics: patients who completed ≥ 1 booking in trailing 30 days |
| Completed appointments / month | 0 | 1,000 completed appointments | Month 12 post-launch | Appointment records: status = completed |

---

## User KPIs

### Patient-Side

| Metric | Baseline | Target | Timeline | Measurement Method |
|--------|----------|--------|----------|--------------------|
| Booking funnel completion rate (search → confirmed booking) | Unknown | ≥ 60% | Month 3 post-launch | Funnel analytics: users who reach search → users who confirm booking |
| OTP registration completion rate | Unknown | ≥ 75% | Month 1 post-launch | Auth logs: OTP sent vs. registration completed |
| End-to-end booking time | Unknown | ≤ 2 minutes (p50) | From Month 1 | Session timestamp analytics: registration/login → booking confirmation |
| Prescription download rate post-consultation | Unknown | ≥ 80% of issued prescriptions downloaded by patient | Month 3 post-launch | S3 access logs: pre-signed URL accessed / prescriptions issued |
| Patient return rate | Unknown | ≥ 40% of patients book a second appointment within 6 months | Month 9 post-launch | Cohort analysis: patients with ≥ 2 bookings within 6-month window |

### Doctor-Side

| Metric | Baseline | Target | Timeline | Measurement Method |
|--------|----------|--------|----------|--------------------|
| Consultation workflow completion rate | Unknown | ≥ 70% of opened consultations result in a prescription issued | Month 3 post-launch | Appointment records: consultation opened vs. prescription issued vs. marked complete |
| Doctor weekly active rate | Unknown | ≥ 80% of subscribed doctors log in and manage ≥ 1 appointment per week | Month 3 post-launch | Session logs: unique doctor logins + appointment action in trailing 7 days |
| Availability calendar setup rate | Unknown | ≥ 90% of approved doctors complete calendar setup within 48h of approval | From launch | Doctor profile records: approval_date vs. first_slot_configured_date |
| Doctor time-to-first-appointment | Unknown | ≤ 7 days from account approval to first completed appointment | Month 3 post-launch | Records: account_approved_date vs. first_completed_appointment_date |

---

## Technical KPIs

| Metric | Baseline | Target | Timeline | Measurement Method |
|--------|----------|--------|----------|--------------------|
| API P95 response time | Unknown | < 200ms | From Phase 7 implementation | AWS CloudWatch + application APM |
| Page LCP — Doctor discovery / search | Unknown | < 2.5s | From Phase 7 implementation | Lighthouse / RUM (Real User Monitoring) |
| Page LCP — Dashboard views | Unknown | < 3.0s | From Phase 7 implementation | Lighthouse / RUM |
| Prescription PDF generation time (end-to-end) | Unknown | < 4s from prescription submit to S3 storage confirmation | From Phase 7 implementation | Application timestamp logging (prescription created → S3 write confirmed) |
| OTP delivery success rate | Unknown | ≥ 98% | From Phase 7 integration testing | MSG91 delivery reports |
| Platform uptime | Unknown | ≥ 99.9% monthly | From launch | AWS CloudWatch + uptime monitoring |
| Health record upload time (≤ 10MB file) | Unknown | < 5s | From Phase 7 implementation | Client-side timing + S3 upload confirmation |

---

## Leading Indicators

Early signals that MedSlot is on track — these are measurable well before full KPIs are available:

| Indicator | What It Signals | How to Measure | When to Check |
|-----------|----------------|----------------|--------------|
| Doctor application submission rate (verification queue volume) | Early GTM is working; doctors are discovering and applying | Admin panel: applications/week | Weekly from Phase 7 Sprint 1 |
| Doctor application → approval conversion (% approved vs. rejected) | Quality of doctor targeting; clarity of registration instructions | Admin panel: approved / total submitted | Weekly from first approvals |
| Patient OTP registration completion rate | Onboarding UX is not introducing abandonment friction | Auth logs: OTP sent / registration confirmed | Weekly from launch |
| Doctor "first calendar slot configured" within 48h of approval | Onboarding flow is clear enough for doctors to activate without support | Doctor profile records | Weekly from first approvals |
| First booking by a new doctor's patient within 7 days of approval | Time-to-value is short enough to demonstrate worth before trial expires | Booking records cross-referenced with doctor approval date | From first approved doctors |
| Prescription PDF delivery email open rate | Patients are engaging with the delivery mechanism — email is reaching them | SendGrid delivery and open analytics | From first prescriptions issued |
