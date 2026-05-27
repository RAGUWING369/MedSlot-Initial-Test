# Task Dependency Map — MedSlot
**Last Updated:** 2026-05-27

---

## Critical Path

The critical path is the longest sequential chain of dependent tasks from project start to MVP (first working end-to-end flow: patient books appointment, doctor issues prescription).

```
TASK-001 (Monorepo Scaffold)
  → TASK-002 (Docker Compose)
    → TASK-007 (Django Config)
      → TASK-010 (CustomUser Model)
        → TASK-011 (OTP Service)
          → TASK-012 (JWT + Permissions)
            → TASK-013 (Auth API Endpoints)
              → TASK-014 (Patient OTP Auth Screen)
                → [Patient can register and log in]

TASK-010 → TASK-026 (Slot Models)
  → TASK-027 (Slot Generation Service)
    → TASK-020 (Search API) → TASK-021 (Profile API)
      → TASK-024 (Doctor Profile Screen, SSR)
        → [Patient can discover doctors]

TASK-026 → TASK-030 (Appointment Model)
  → TASK-031 (Booking API, row-lock)
    → TASK-032 (Booking Flow Screen)
      → [Patient can book an appointment]

TASK-030 → TASK-040 (Consultation Note Model)
  → TASK-050 (Consultation API)
    → TASK-051 (Consultation View Screen)
      → TASK-052 (Prescription Issuance Screen) [requires TASK-070]

TASK-040 → TASK-060 (Prescription Model + Template)
  → TASK-070 (Prescription API + Celery PDF Task)
    → [Doctor can issue prescription → PDF → email → patient]

TOTAL CRITICAL PATH LENGTH: ~11 sequential sprint-weeks
MVP EARLIEST COMPLETION: End of Sprint 5 (2026-08-08)
```

---

## Full Dependency Graph (ASCII)

```
TASK-001 ─────────────────────┬──────────────────────────────────────┐
(Monorepo Scaffold)            │                                      │
                               ▼                                      ▼
                         TASK-002                               TASK-004
                       (Docker Compose)                      (CI Pipeline)
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
         TASK-007          TASK-008          TASK-003
       (Django Config)  (Frontend Base)   (Env/Secrets)
              │                │
    ┌─────────┼────────┐       ├──────────────────────────────────────────┐
    ▼         ▼        ▼       ▼                                          ▼
TASK-010  TASK-009  TASK-091  TASK-102                               TASK-103
(User    (Spike)  (AuditLog) (UI Lib)                             (Route Guards)
 Model)              │
    │                │
    ├────────┬────────┤
    ▼        ▼        ▼
TASK-011  TASK-026  TASK-080
(OTP Svc) (Slot    (Record
           Models)  Model)
    │        │         │
    ▼        │         ▼
TASK-012    │      TASK-081
(JWT+Perms) │    (Records API)
    │        │         │
    ▼        │         ▼
TASK-013    │      TASK-082
(Auth API)  │    (Records Screen)
    │        │
    ├────────┼──────────────────────────────────────┐
    ▼        ▼                                      │
TASK-014  TASK-016                                  │
(Patient  (Doctor                                   │
 Auth     Reg API)                                  │
 Screen)      │                                     │
    │         ▼                                     │
    │     TASK-018                                  │
    │   (Django Admin)                              │
    │         │                                     │
    │         ▼                                     │
    │     TASK-019                                  │
    │  (Approval Emails)                            │
    │                                               │
    │   TASK-026 (Slot Models)                      │
    │         │                                     │
    │         ▼                                     │
    │    TASK-027 (Slot Gen)                        │
    │         │                                     │
    │    ┌────┴──────────────┐                      │
    │    ▼                   ▼                      │
    │ TASK-020            TASK-028                  │
    │ (Search API)      (Calendar API)              │
    │    │                   │                      │
    │    ├──────────┐         ▼                     │
    │    ▼          ▼    TASK-029                   │
    │ TASK-022  TASK-021  (Calendar Screen)         │
    │ (Landing)  (Profile                           │
    │            API)                               │
    │    │          │                               │
    │    ▼          ▼                               │
    │ TASK-023  TASK-024                            │
    │ (Results) (Profile                            │
    │            Screen)                            │
    │               │                               │
    │               │   TASK-030 (Appt Model)       │
    │               │        │                      │
    │               │        ▼                      │
    │               └──► TASK-031 (Booking API) ────┘
    │                        │
    │               ┌────────┴─────────┐
    │               ▼                  ▼
    │          TASK-032            TASK-035
    │        (Booking Screen)    (Patient Appt
    │               │             List API)
    │               ▼                  │
    │          TASK-033            TASK-036
    │       (Confirmation       (Doctor Appt
    │          Screen)           Mgmt API)
    │                                  │
    │                         ┌────────┴─────────┐
    │                         ▼                   ▼
    │                    TASK-037            TASK-038
    │                 (Patient               (Doctor
    │                  Dashboard)             Dashboard)
    │
    │   TASK-040 (Consultation Note Model)
    │        │
    │        ▼
    │   TASK-050 (Consultation API)
    │        │
    │   ┌────┴─────────────┐
    │   ▼                   ▼
    │ TASK-051           TASK-053
    │ (Consultation      (Consult
    │  Screen)            Tests)
    │   │
    │   ▼                TASK-060 (Prescription Model + Template)
    │ TASK-052                │
    │ (Rx Screen) ◄───────────┤
    │                         ▼
    │                    TASK-070 (Rx API + PDF Celery)
    │                         │
    │                    ┌────┴─────────────────┐
    │                    ▼                       ▼
    │               TASK-054               TASK-055
    │             (Rx View Screen)       (Rx Tests)
    │
    │   TASK-044 (Subscription Model)
    │        │
    │        ▼
    │   TASK-045 (Razorpay Webhook)
    │        │
    │   ┌────┴──────────────┐
    │   ▼                    ▼
    │ TASK-046          TASK-048
    │ (Dr Profile        (Sub Tests)
    │  Screen)
    │
    └──► TASK-041 (Booking/Cancel Emails)
             │
             ▼
         TASK-042 (Reminder Email)
             │
             ▼
         TASK-043 (Notification Tests)


  PARALLEL TRACKS (can run simultaneously):
  Track A (Backend): TASK-010 → TASK-011 → TASK-012 → TASK-013 → TASK-016 → TASK-020 → TASK-031 → TASK-050 → TASK-070
  Track B (Frontend): TASK-008 → TASK-102 → TASK-103 → TASK-014 → TASK-022 → TASK-023 → TASK-024 → TASK-032 → TASK-051 → TASK-052
  Track C (Infra): TASK-001 → TASK-002 → TASK-004 → TASK-005 → TASK-006
  Track D (Data/Models): TASK-010 → TASK-026 → TASK-030 → TASK-040 → TASK-060
```

---

## Parallel Work Streams

The following groups of tasks can be worked on simultaneously by different developers:

| Sprint | Developer A (Backend Dev) | Developer B (Frontend Dev) | Developer C (Full-stack Lead) |
|--------|--------------------------|---------------------------|------------------------------|
| Sprint 1 | TASK-010, TASK-011, TASK-012, TASK-013 | TASK-008 | TASK-001, TASK-002, TASK-004 |
| Sprint 2 | TASK-016, TASK-018, TASK-020, TASK-021, TASK-026 | TASK-014, TASK-015, TASK-102 | TASK-017 (support), CDK planning |
| Sprint 3 | TASK-027, TASK-028, TASK-031, TASK-041 | TASK-022, TASK-023, TASK-024 | TASK-025 tests + TASK-103 |
| Sprint 4 | TASK-035, TASK-036, TASK-040, TASK-050 | TASK-032, TASK-033, TASK-037 | TASK-092 + TASK-034 |
| Sprint 5 | TASK-053, TASK-060, TASK-070, TASK-080 | TASK-038, TASK-051, TASK-052, TASK-054 | Support + Review |
| Sprint 6 | TASK-042, TASK-043, TASK-044, TASK-047, TASK-055 | TASK-082, TASK-104 | TASK-090, TASK-091, TASK-083 |
| Sprint 7 | TASK-045, TASK-048 | TASK-029, TASK-046, TASK-106 | TASK-019, TASK-105, TASK-005 |
| Sprint 8 | TASK-096 | TASK-095, TASK-097 | TASK-006 (CDK) |
| Sprint 9 | TASK-099 | TASK-100 | TASK-006 deploy, TASK-098 |

---

## Blocking Task Analysis

Tasks that block the most downstream work — these are the highest-priority tasks in each sprint. A delay on any of these delays multiple downstream tasks.

| Task | Directly Blocks | Downstream Impact |
|------|----------------|------------------|
| TASK-001 (Monorepo Scaffold) | TASK-002, TASK-003, TASK-004, TASK-005, TASK-006 | Blocks entire project start — Priority 0 |
| TASK-010 (CustomUser Model) | TASK-011, TASK-012, TASK-026, TASK-030, TASK-040, TASK-044, TASK-080, TASK-090, TASK-091 | Foundation of data model — blocks all user-related work |
| TASK-012 (JWT + Permissions) | TASK-013, TASK-020, TASK-030, TASK-050, TASK-060, TASK-070, TASK-080 | Blocks all authenticated API endpoints |
| TASK-030 (Appointment Model) | TASK-031, TASK-035, TASK-036, TASK-040 | Blocks all booking and consultation work |
| TASK-050 (Consultation API) | TASK-051, TASK-053, TASK-060, TASK-070 | Blocks prescription generation — critical path |
| TASK-070 (Prescription API + Celery) | TASK-052, TASK-054, TASK-055, TASK-096 | Core value delivery — prescription is the primary consultation outcome |
| TASK-006 (AWS CDK) | TASK-005 (CD pipeline), staging deployment, TASK-098 (load test) | Blocks production deployment |
| TASK-008 (Frontend Base Config) | TASK-014, TASK-015, TASK-022 through TASK-054, TASK-082, TASK-102, TASK-103, TASK-104 | Blocks all frontend screen work |

---

## Dependency Rules (Invariants)

The following dependencies are hard constraints — violating them creates broken builds or runtime errors:

1. **No backend endpoint task before its model task.** Every API task that reads or writes a model requires the model migration to be applied first.
2. **No frontend screen task before its API task.** Frontend screens make API calls; the API must exist and return the expected schema before the screen can be tested end-to-end.
3. **No Celery task before Celery broker is configured.** Redis must be running (TASK-002) and configured in Django settings (TASK-007) before any Celery task is runnable.
4. **No prescription API (TASK-070) before WeasyPrint spike (TASK-009) is resolved.** If the spike reveals P95 > 4s, the prescription architecture must be re-evaluated.
5. **No E2E tests before all screens in the test path are complete.** TASK-095 requires SCR-001 through SCR-007 to be implemented; TASK-096 requires SCR-010 through SCR-014.
6. **No production CDK deploy before CDK stack passes `cdk synth` with zero errors.** TASK-006 must be complete before TASK-005 (CD pipeline) can deploy to ECS.

---

## Float Analysis (Non-Critical Tasks)

Tasks with float (can be delayed without affecting the critical path):

| Task | Float | Latest Start Without Impact |
|------|-------|----------------------------|
| TASK-005 (CD Pipeline) | ~4 sprints | Can start Sprint 7 — needed before Sprint 10 production deploy |
| TASK-006 (CDK Stack) | ~3 sprints | Can start Sprint 7 — needed before Sprint 9 staging |
| TASK-042 (Reminder Email) | ~2 sprints | Should Have story — no impact on core booking/prescription MVP |
| TASK-044 (Subscription Model) | ~1 sprint | Needed before Sprint 7 Razorpay integration |
| TASK-090 (Analytics Events) | ~2 sprints | Cross-cutting concern — can be instrumented after core flows |
| TASK-091 (AuditLog Signals) | ~1 sprint | Compliance requirement — must be in before production deploy |
| TASK-099 (PHI Log Audit) | 1 sprint | Must be done before Sprint 10 production deploy |
| TASK-100 (Accessibility Audit) | 1 sprint | Must be done before Sprint 10 production deploy |
