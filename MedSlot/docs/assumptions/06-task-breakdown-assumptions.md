# Task Breakdown — Assumption Log
**Phase:** 06 — Task Breakdown & Sprint Planning
**Agent:** Phase 6 — Task Breakdown Agent
**Generated:** 2026-05-27
**Session:** Full sprint plan decomposition for MedSlot v1 core release

---

## Tier 3 Inferences Made This Phase

| ID | Inference | Basis | Confidence | Must Validate Before Phase |
|----|-----------|-------|------------|---------------------------|
| A-06-001 | 1 story point = ~4 developer-hours; S task ~1 day, M ~2 days, L ~3 days | Mike Cohn *Agile Estimating and Planning* (2005); standard industry calibration for 3-person teams | High | Sprint 1 velocity review |
| A-06-002 | Team net daily capacity = 6 hours/developer (8 hours minus meetings, reviews, context-switch overhead) | Cohn capacity planning; accounts for 1-hour standup/sync per day and 30 min/day context switching | High | Sprint 1 retrospective |
| A-06-003 | Sprint 1 ramp-up discount of 20% applied, reducing committable SP from 30 to 24 | Empirical industry observation for first sprints on new greenfield projects (Cohn, 2005); environment setup, tooling calibration | High | Sprint 1 retrospective — measure actual velocity |
| A-06-004 | 80% sprint capacity load cap applied (leaving 20% buffer per sprint) | Scrum Guide (2020) sprint loading principles; buffer absorbs unplanned work and review overhead | High | Monitor per sprint — adjust if buffer consistently unused |
| A-06-005 | WeasyPrint spike (TASK-009) timeboxed at 1 day (2 SP) | OQ-005 from CLAUDE.md explicitly flags this as a required risk mitigation before Sprint 5 prescription work | High | Sprint 1 — spike result must be documented |
| A-06-006 | Django Admin used for SCR-016 (Admin Approval Queue) — no custom React frontend | ADR-007 explicitly confirms this decision: "Django Admin as admin panel — saves 2–3 weeks of frontend time" | High | Architecture is confirmed — no validation needed |
| A-06-007 | Client-direct S3 presigned PUT used for health record uploads (TASK-081) — file bytes never route through Django API | ADR-003 and NFR-PE-005 explicitly specify this pattern to meet ≤5s P95 upload time | High | Architecture is confirmed |
| A-06-008 | All 16 screens (SCR-001 through SCR-016) have corresponding HTML wireframe directories in docs/visuals/ux/ — confirmed by file glob | Direct filesystem observation during context loading | High | No validation needed — files confirmed present |
| A-06-009 | Celery Beat `regenerate_all_slots` task configured at `crontab(hour=18, minute=30)` UTC = midnight IST | IST = UTC+5:30; midnight IST = 18:30 UTC; confirmed IST timezone requirement in PRD §2 ambiguity resolution | High | No validation needed — IST offset is fixed |
| A-06-010 | `send_appointment_reminders` Celery Beat runs hourly and queries for appointments starting in 23h45m–24h15m window | FR-NOTIF-006 requires 24h ±15 minutes; hourly scan is the simplest approach meeting this requirement without per-appointment scheduling complexity | High | Test in Sprint 6 with boundary cases |
| A-06-011 | Razorpay integration tasks (TASK-044, TASK-045, TASK-046) placed in Sprints 6–7 (lower priority than core booking/prescription flows) | Explicit instruction in task specification: "Razorpay subscription integration is Phase 2 scope — include it but flag as lower priority than core booking/consultation/prescription flows" | High | No validation needed |
| A-06-012 | E2E test framework assumed to be Cypress or Playwright (task spec lists both); Playwright preferred for modern Next.js 14 App Router compatibility | Neither is explicitly mandated; Playwright has better support for Next.js SSR testing and concurrent user simulation; Cypress is acceptable alternative | Medium | Team to confirm in Sprint 8 test task kickoff |
| A-06-013 | Frontend unit test framework is Vitest (not Jest) based on CLAUDE.md architecture section and `npm run test` convention | CLAUDE.md Key Commands: `npm run test` with `@vitest/coverage-v8`; consistent with Next.js 14 modern toolchain | High | No validation needed |
| A-06-014 | Total project story points estimated at ~247 SP across 112 tasks | Bottom-up estimation from individual task SP assignments; actual velocity may differ; sprint plan built with 80% load cap to accommodate variance | Medium | Calibrate against actual Sprint 1 and Sprint 2 velocity |
| A-06-015 | Sprint 11 designated as buffer/hardening sprint (no feature commitments) | 22-week timeline from 2026-05-27 to 2026-10-31 allows for 11 two-week sprints; reserving the last sprint as buffer is standard practice for high-stakes delivery deadlines | High | No validation needed — deliberate planning decision |
| A-06-016 | OpenAPI schema task (TASK-092) assigned Sprint 4 — after enough endpoints exist to make schema generation meaningful | drf-spectacular generates schema from existing views; no value in setting it up before any views exist | High | No validation needed |
| A-06-017 | PHI log filter (`LogFilter`) implemented as a custom Python logging filter that redacts known PHI field names — not a blanket regex scan | NFR-SEC-011 and NFR-MAIN-005 specify the `# PHI` annotation convention; the filter uses the annotated field name list as its redaction target | High | Code review in TASK-091 must verify filter covers all `# PHI` fields |
| A-06-018 | `ProcessedWebhookEvent` model added as part of TASK-045 (Razorpay webhook handler) to support idempotent event processing | ARCHITECTURE.md explicitly specifies: "Idempotent external integrations. Razorpay webhooks are deduplicated via ProcessedWebhookEvent." | High | No validation needed — architecture is confirmed |

---

## Open Flags (Tier 2 — Unconfirmed Suggestions)

| Flag ID | Suggestion Made | Location in Artifact | Status |
|---------|----------------|----------------------|--------|
| F-06-001 | Playwright recommended over Cypress for E2E tests (TASK-095, TASK-096) | TASKS.md TASK-095 acceptance criteria | Pending team confirmation at Sprint 8 kickoff |
| F-06-002 | Sprint 1 committed at 25 SP (slightly over 24 SP cap) — justified by WeasyPrint spike being timeboxed at max 1 day with no carry-over risk | SPRINT-PLAN.md Sprint 1 | Acceptable — spike timebox enforces the cap in practice |
| F-06-003 | TASK-006 (AWS CDK, 8 SP) deferred to Sprint 8/9 — this means staging environment is not available until Sprint 9 (2026-09-22); E2E tests in Sprint 8 must run against Docker Compose local environment, not staging | SPRINT-PLAN.md Sprint 8 note | Team must confirm E2E tests can run against local Docker Compose; if not, CDK must move earlier |
| F-06-004 | OQ-002 (Razorpay subscription plan — monthly vs annual) flagged as must-be-resolved before Sprint 7 | SPRINT-PLAN.md Sprint 7 risks | Remains open — product owner must answer before 2026-08-25 |
| F-06-005 | OQ-003 (doctor pricing ₹1,000/month validation) flagged as must-be-resolved before Sprint 7 | SPRINT-PLAN.md Sprint 7 risks | Remains open — product owner must answer before 2026-08-25 |

---

## Resolution Log

| ID | Original Assumption | Resolution | Resolved By | Date |
|----|--------------------|-----------|-----------:|------|
| — | No assumptions resolved yet — this is Phase 6 initial generation | — | — | — |
