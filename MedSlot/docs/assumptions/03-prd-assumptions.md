# PRD — Assumption Log

**Phase:** 03 — Product Requirements Document
**Agent:** 03_prd_agent.md
**Generated:** 2026-05-25
**Session:** MedSlot Phase 3 — PRD authoring; all Phase 1 and Phase 2 artifacts available and approved

---

## Tier 3 Inferences Made This Phase

| ID | Inference | Basis | Confidence | Must Validate Before Phase |
|----|-----------|-------|------------|---------------------------|
| A-03-001 | Analytics events stored in a dedicated `analytics_events` PostgreSQL table; no third-party analytics SDK (Mixpanel, Amplitude, Segment, GA4) used in v1 | Tech stack (CLAUDE.md) uses PostgreSQL as the primary data store; no third-party analytics vendor appears in the tech stack; using the existing database avoids additional vendor cost and keeps PII within MedSlot-controlled infrastructure | High | Phase 4 (Architecture) — confirm analytics table placement and index strategy |
| A-03-002 | Analytics events retain `user_id` (UUID) as the sole user identifier; no personal identifiers (name, phone, email) stored in event properties | Derived from BR-019 (PHI not in logs) and MedSlot's PHI classification policy; UUIDs are necessary for funnel stitching while being non-identifying | High | Phase 7 — analytics event write implementation; ensure no PII leaks in client-side event dispatch |
| A-03-003 | Analytics event retention = 24 months from `server_ts`; purged via monthly scheduled DELETE job | Industry standard for product analytics data; medical record retention (10 years, BR-022) is a separate, longer obligation; 24 months covers two full seasonal cycles for trend analysis without indefinite storage | Medium | Phase 4 (Architecture) — confirm retention policy is acceptable; Phase 7 — implement purge job |
| A-03-004 | Client-side analytics events sent to a dedicated `POST /api/v1/analytics/events` endpoint; `user_id` is injected server-side from JWT (client never sends user_id directly) | Standard security pattern to prevent user_id spoofing on analytics events; consistent with the existing JWT-based auth architecture | High | Phase 4 (Architecture) — API contract for analytics endpoint |
| A-03-005 | Prescription PDF `generation_time_ms` is measured from job dequeue time (not from HTTP request time) to align with the ≤ 4s P95 NFR (NFR-PE-004) defined as end-to-end prescription delivery | Inferred from A-02-009 (async PDF generation) and NFR-PE-004 definition; the 4s window covers WeasyPrint rendering + S3 upload + pre-signed URL generation, not the async queue wait time | Medium-High | Phase 7 — PDF analytics event implementation; confirm measurement boundary with NFR-PE-004 |
| A-03-006 | `slot_time_bucket` in booking events uses three buckets: morning (06:00–11:59 IST), afternoon (12:00–16:59 IST), evening (17:00–22:59 IST) | Standard time-of-day bucketing for healthcare analytics; avoids storing exact slot times in analytics events while enabling demand pattern analysis | Medium | Phase 7 — analytics event helper function implementation |
| A-03-007 | Funnel analysis denominators use `server_ts` for all cohort calculations; `client_ts` is stored but used only for latency debugging, not for funnel entry/exit | Server timestamp is authoritative for cohort analysis to avoid clock skew from client devices; consistent with analytics industry practice | High | Phase 7 — dashboard query implementation |
| A-03-008 | OQ-001 (launch city selection) defaulting to Bengaluru, Hyderabad, Pune as illustrative examples in PRD text; no commitment made | PRD illustrative examples only; actual launch city decision requires team confirmation per OQ-001 before Phase 7 marketing content is written | Medium | Pre-Phase 7 — resolve OQ-001 with team before soft launch planning |
| A-03-009 | Conflict C-001 resolution: freemium tier (suggested in FEASIBILITY-REPORT.md) overridden by trial-only model (defined in approved REQUIREMENTS.md Phase 2 artifacts) | Per Rule 7 (context source hierarchy): Phase 2 approved requirements outrank Phase 1 ideation suggestions; user approved Phase 2 artifacts on 2026-05-25 which contain only trial-not-freemium | High — user confirmed Phase 2 approval | Phase 7 — subscription model implementation must not include freemium tier |
| A-03-010 | Timezone reference for all PRD time-based statements (cancellation window, reminder timing, slot generation) = IST (UTC+5:30), inferred from India market context and doctor/patient base | CLAUDE.md declares Indian market; MSG91 OTP is India-focused; no timezone ambiguity was raised in Phase 1 or Phase 2; all timestamp storage will use UTC (database layer) with IST display (application layer) | High | Phase 4 (Architecture) — confirm UTC storage + IST display pattern; Phase 7 — all datetime comparisons must use IST-aware calculation |
| A-03-011 | Analytics Dashboard 1 (Executive KPI) and Dashboard 2 (Product Health) are implemented as direct SQL queries against `analytics_events` in v1; no separate BI tool or data warehouse | Team size = 3 developers (CLAUDE.md); a separate BI tool adds operational overhead disproportionate to scale at launch; PostgreSQL with JSONB indexes can serve dashboard queries at sub-1000 doctor scale | Medium | Phase 4 (Architecture) — confirm no BI tool in v1; flag if query performance requires materialized views |
| A-03-012 | `session_id` for analytics is generated client-side on page load and stored in `sessionStorage` (not `localStorage`); it expires when the browser tab is closed | sessionStorage provides automatic session boundary without requiring server-side session tracking; aligns with JWT-based stateless auth; no additional server infrastructure needed | High | Phase 7 — frontend analytics session management implementation |

---

## Open Flags (Tier 2 — Confirmed Suggestions)

All Tier 2 suggestions in Phase 3 were pre-answered by the user in the Phase 3 gap scan:

| Flag ID | Suggestion Made | User Response | Status |
|---------|----------------|---------------|--------|
| F-03-001 | OKRs not applicable for a 3-person startup at launch stage; use PRD goals + SUCCESS-METRICS.md KPIs directly | YES — confirmed | ✅ Resolved |
| F-03-002 | No feature flags for v1 — greenfield, single deployment, no A/B testing complexity needed | YES — confirmed | ✅ Resolved |
| F-03-003 | Staged rollout: Internal (team) → Soft Launch (5-10 doctors, 1 city) → Public Launch | YES — confirmed | ✅ Resolved |

---

## Conflict Resolution Log

| Conflict ID | Description | Phase 1 Position | Phase 2 Position | Resolution | Authority |
|------------|-------------|-----------------|-----------------|------------|-----------|
| C-001 | Business model: freemium tier vs. trial-only | FEASIBILITY-REPORT.md suggested permanent freemium tier as monetisation risk mitigation | REQUIREMENTS.md FR-SUB-001 defines only a 30-day trial; no freemium tier specified | Phase 2 (approved requirements) is authoritative. Freemium deferred to post-v1 roadmap. | User approval of Phase 2 on 2026-05-25 |

---

## Ambiguity Resolution Log

| Ambiguity ID | Description | Resolution | Impact |
|-------------|-------------|------------|--------|
| AM-001 | Timezone for appointment calculations — IST vs UTC | All user-visible times are IST; all database timestamps are UTC; application layer handles conversion | Phase 4 architecture must enforce UTC storage + IST display; noted in GLOSSARY.md under IST |
| AM-002 | Analytics event `user_id` for pre-login funnel steps | `user_id` is null for anonymous events (pre-OTP verification); `session_id` links anonymous-to-authenticated events within a session | Phase 7 — analytics endpoint must handle null user_id gracefully |

---

## Resolution Log

| ID | Original Assumption | Resolution | Resolved By | Date |
|----|--------------------|-----------|-----------:|------|
| A-03-009 | Freemium vs. trial-only conflict | Trial-only is authoritative (Phase 2 approved); freemium deferred post-v1 | User (Phase 2 approval) | 2026-05-25 |
| A-03-010 | Timezone ambiguity | IST for display, UTC for storage | Phase 3 synthesis (no Phase 2 conflict) | 2026-05-25 |
