# Requirements Traceability Matrix — MedSlot

**Phase:** 2 — Requirements Engineering
**Version:** 1.0
**Date:** 2026-05-25

> Every requirement traces to a business goal from SUCCESS-METRICS.md.
> Test Case column is populated in Phase 9 (Testing).
> Assumption column references docs/assumptions/01-ideation-assumptions.md and 02-requirements-assumptions.md.

---

## Traceability Matrix

| Business Goal (SUCCESS-METRICS.md) | User Story | Functional Req | Business Rule | Use Case | Test Case | Assumption Validated | Status |
|--------------------------------------|-----------|----------------|--------------|----------|-----------|---------------------|--------|
| OTP registration completion rate ≥ 75% | US-001, US-002 | FR-AUTH-001, FR-AUTH-002, FR-AUTH-003, FR-AUTH-004, FR-REG-PAT-001, FR-REG-PAT-002, FR-REG-PAT-003 | BR-001, BR-002, BR-003, BR-004, BR-005 | UC-001 | TC-001 (Phase 9) | — | Defined |
| Booking funnel completion ≥ 60% | US-003, US-004, US-005, US-006 | FR-SEARCH-001, FR-SEARCH-002, FR-SEARCH-003, FR-SEARCH-004, FR-SEARCH-005, FR-PROFILE-001, FR-PROFILE-002, FR-PROFILE-005, FR-BOOK-001, FR-BOOK-002, FR-BOOK-003, FR-BOOK-005 | BR-006, BR-007, BR-008, BR-009 | UC-003 | TC-002 (Phase 9) | A-01-009 (patient booking rate) | Defined |
| End-to-end booking time ≤ 2 minutes (P50) | US-003, US-004, US-005, US-006 | FR-SEARCH-001–005, FR-PROFILE-001–005, FR-BOOK-001–006 | BR-006, BR-007 | UC-003 | TC-003 (Phase 9) | — | Defined |
| Completed appointments/month target 1,000 | US-006, US-007, US-015, US-016, US-019, US-020 | FR-BOOK-001–006, FR-APPT-001–007, FR-CONSULT-001–005, FR-RX-001–008 | BR-012, BR-023, BR-024 | UC-003, UC-004 | TC-004 (Phase 9) | — | Defined |
| Consultation workflow completion ≥ 70% | US-017, US-018, US-019, US-020 | FR-CONSULT-001–005, FR-RX-001–008 | BR-021, BR-023, BR-024 | UC-004 | TC-005 (Phase 9) | — | Defined |
| Doctor weekly active rate ≥ 80% | US-013, US-014, US-015, US-016, US-017 | FR-AUTH-004, FR-CAL-001–006, FR-APPT-002, FR-APPT-003, FR-CONSULT-001 | BR-004, BR-015, BR-017, BR-018 | UC-002, UC-006 | TC-006 (Phase 9) | — | Defined |
| Prescription download rate ≥ 80% | US-010, US-011 | FR-RX-005, FR-RX-006, FR-RX-007, FR-NOTIF-005 | BR-023, BR-024 | UC-004 | TC-007 (Phase 9) | A-02-001 (prescription URL expiry) | Defined |
| Availability calendar setup ≥ 90% within 48h | US-014 | FR-CAL-001–006 | BR-008 | UC-006 | TC-008 (Phase 9) | — | Defined |
| Doctor trial-to-paid conversion ≥ 30% | US-025 | FR-SUB-001–006 | BR-024, BR-025, BR-026 | — | TC-009 (Phase 9) | A-02-003 (trial period = 30 days) | Defined |
| Doctor churn < 5%/month | US-025 | FR-SUB-001–006 | BR-024, BR-025 | — | TC-010 (Phase 9) | A-02-002 (Razorpay subscription) | Defined |
| MRR target ₹170,000/month by Month 12 | US-025 | FR-SUB-001–006 | BR-024, BR-025, BR-026 | — | TC-011 (Phase 9) | A-01-003 (₹1,000/month price point) | Defined |
| Monthly Active Patients ≥ 500 by Month 6 | US-001, US-002, US-003–006 | FR-AUTH-001–007, FR-REG-PAT-001–003, FR-SEARCH-001–005, FR-BOOK-001–006 | BR-003, BR-006, BR-007 | UC-001, UC-003 | TC-012 (Phase 9) | — | Defined |
| Doctor time-to-first-appointment ≤ 7 days | US-012, US-013, US-014, US-023 | FR-REG-DOC-001–004, FR-ADMIN-002, FR-CAL-001–002 | BR-016, BR-017, BR-018, BR-029 | UC-002 | TC-013 (Phase 9) | — | Defined |
| Patient appointment cancellation UX | US-008 | FR-APPT-004, FR-APPT-007, FR-NOTIF-004 | BR-010, BR-012 | UC-005 | TC-014 (Phase 9) | A-02-004 (2h cancellation window) | Defined |
| Doctor cancels appointment | US-021 | FR-APPT-005, FR-APPT-007, FR-NOTIF-004 | BR-011, BR-012 | UC-005 | TC-015 (Phase 9) | — | Defined |
| Health record upload (≤ 10MB < 5s) | US-009 | FR-RECORD-001–005, NFR-PE-005 | BR-019, BR-020, BR-022 | — | TC-016 (Phase 9) | — | Defined |
| Platform uptime ≥ 99.9% | — | — | — | — | NFR-REL-001 | TC-017 (Phase 9) | — | Defined |
| API P95 < 200ms | — | — | — | — | NFR-PE-001 | TC-018 (Phase 9) | — | Defined |
| OTP delivery < 10s (≥ 98% success) | US-001, US-002, US-012 | FR-AUTH-001, FR-NOTIF-001 | BR-001 | UC-001, UC-002 | TC-019 (Phase 9) | — | Defined |
| Prescription PDF generation < 4s | US-019 | FR-RX-003, FR-RX-004, NFR-PE-004 | BR-023, BR-024 | UC-004 | TC-020 (Phase 9) | — | Defined |
| PHI protection / zero plaintext in logs | — | NFR-SEC-011, NFR-MAIN-003, NFR-MAIN-004, NFR-MAIN-005 | BR-019, BR-020 | — | TC-021 (Phase 9) | — | Defined |
| RBAC — role separation | US-001–025 | FR-AUTH-005, FR-AUTH-007, FR-BOOK-006, FR-CONSULT-005, FR-ADMIN-006 | BR-013, BR-014, BR-015 | All UCs | TC-022 (Phase 9) | — | Defined |
| Admin doctor verification workflow | US-022, US-023, US-024 | FR-ADMIN-001–006, FR-REG-DOC-002–004 | BR-016, BR-017, BR-018 | UC-002 | TC-023 (Phase 9) | — | Defined |
| WCAG 2.1 AA compliance | US-003, US-005, US-006 | NFR-USE-002 | — | UC-003 | TC-024 (Phase 9) | — | Defined |
| Appointment reminder email 24h before | US-026 | FR-NOTIF-006 | — | — | TC-025 (Phase 9) | A-02-005 (reminder timing ±15min) | Defined |
| Booking confirmation emails | US-006 | FR-NOTIF-002, FR-NOTIF-003 | — | UC-003 | TC-026 (Phase 9) | — | Defined |
| Doctor registration — specialty fixed taxonomy | US-012, US-003 | FR-REG-DOC-001, FR-SEARCH-001, FR-SEARCH-002 | BR-029, BR-030 | UC-002 | TC-027 (Phase 9) | A-02-006 (specialty list) | Defined |
| No-show tracking | US-020 | FR-APPT-006, FR-APPT-007 | BR-012 | UC-004 | TC-028 (Phase 9) | A-02-007 (no-show state) | Defined |
| Razorpay webhook security | US-025 | FR-SUB-006 | BR-026 | — | TC-029 (Phase 9) | A-02-002 | Defined |
| Doctor profile — location by city/area text | US-003, US-004, US-005 | FR-PROFILE-001, FR-SEARCH-002 | — | UC-003 | TC-030 (Phase 9) | A-02-008 (no GPS) | Defined |

---

## Assumption Coverage

| Assumption ID | Assumption | Covered By | Phase Validated |
|--------------|------------|-----------|----------------|
| A-01-003 | ₹1,000/month subscription price | FR-SUB-001–006, US-025 | Before Phase 7 (pricing interview) |
| A-01-009 | Patient booking rate 1–2/month | FR-BOOK-001–006, US-006 | Phase 5 (UX usability testing) |
| A-02-001 | 7-day prescription URL expiry | FR-RX-005, FR-RX-007 | Phase 7 (implementation) |
| A-02-002 | Razorpay Subscriptions for billing | FR-SUB-002–006 | Phase 4 (architecture) + Phase 7 |
| A-02-003 | 30-day trial period | FR-SUB-001 | Phase 7 (implementation) |
| A-02-004 | 2-hour cancellation window | FR-APPT-004, BR-010 | Phase 7 (integration test) |
| A-02-005 | Appointment reminder ±15min tolerance | FR-NOTIF-006 | Phase 7 (scheduled job test) |
| A-02-006 | Fixed 13-specialty taxonomy | FR-REG-DOC-001, FR-SEARCH-001 | Phase 7 (data seed test) |
| A-02-007 | Three appointment outcome states | FR-APPT-006 | Phase 7 (state machine test) |
| A-02-008 | City + area text (no GPS) | FR-PROFILE-001, FR-SEARCH-002 | Phase 4 (architecture) |
