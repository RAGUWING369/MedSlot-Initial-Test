---
name: project-medslot-phase7
description: MedSlot Phase 7 Implementation — Sprint 1 progress, established code patterns, decisions made during implementation.
metadata:
  type: project
---

# Phase 7 — Implementation (Sprint 1)

**Started:** 2026-05-28
**Current Sprint:** Sprint 1 (2026-06-02 → 2026-06-13)
**Sprint Goal:** Working local dev environment, CI pipeline, fully tested OTP auth backend.

## Sprint 1 Task Status (as of 2026-05-28)

| Task | Title | Status |
|------|-------|--------|
| TASK-001 | Monorepo Directory Scaffold | 🟢 Done |
| TASK-002 | Docker Compose Local Dev Environment | 🟢 Done |
| TASK-003 | Environment Configuration & Secrets Structure | 🟢 Done |
| TASK-004 | GitHub Actions CI Pipeline | 🟢 Done |
| TASK-007 | Backend Requirements & Base Django Configuration | 🟢 Done |
| TASK-008 | Frontend Base Configuration & Shared Libraries | 🟡 In Progress |
| TASK-009 | WeasyPrint Spike | 🟢 Done |
| TASK-010 | CustomUser Model & Database Migration | 🟢 Done |
| TASK-011 | OTP Service: Redis Rate-Limiting & OTP Generation | 🟢 Done |
| TASK-012 | JWT Auth Service & DRF Permission Classes | 🟢 Done |
| TASK-013 | Auth API Endpoints (OTP Request, OTP Verify, Patient Profile) | 🟢 Done |

**Tasks 5 & 6 note:** TASK-005 (CD Pipeline) and TASK-006 (AWS CDK Stack) are Sprint 2 tasks — not skipped, deferred by sprint plan.

## Repository Structure Decision
All project source code lives under `medslot/` subdirectory (decided during TASK-001 implementation). SDLC artifacts (docs/, .claude/, CLAUDE.md) stay at repo root. `.github/` stays at repo root (GitHub Actions requirement).

## Established Code Patterns

### Backend
- **Settings:** Split into base/local/production using `python-decouple`. `DJANGO_SETTINGS_MODULE=medslot.settings.local` in Docker Compose.
- **Test structure:** `tests/` package per app (not flat `tests.py`). All test files named `test_*.py`.
- **Mocking:** Redis cache mocked via `@patch('accounts.services.cache')`. HTTP calls mocked via `@patch('accounts.services.requests.post')`.
- **PHI policy:** Fields marked `# PHI` inline. `PatientProfile.__str__` returns `PatientProfile({user_id})` — never full_name.
- **Logging:** Structured JSON via `python-json-logger`. Phone numbers NEVER in log messages — use action labels only (`extra={'action': 'otp_requested'}`).
- **Service layer:** Class-based services (`OTPService`, `MSG91Adapter`, `AuthService`) in `accounts/services.py`.
- **Permissions:** Role-specific DRF classes in `accounts/permissions.py` — never use generic `IsAuthenticated` alone.
- **URLs:** App-level `urls.py` included into root `medslot/urls.py` under `/api/v1/`.

### Frontend
- **Test runner:** Vitest (added in TASK-004 flag resolution). Config: `vitest.config.ts` with jsdom + 90% coverage thresholds.
- **Scripts added to package.json:** `test`, `test:watch`, `type-check`.
- **isort/Black alignment:** `setup.cfg` with `[isort] profile = black` + `[flake8]` config. `pyproject.toml` with `[tool.black]` and `[tool.pytest.ini_options]`.

## Key Implementation Decisions Made in Phase 7

1. **medslot/ subdirectory** — All source code under `medslot/` per user request during TASK-001.
2. **DOCTOR_TRIAL_DAYS = 30** — Exported constant in `permissions.py`; pending doctors get 30-day trial access.
3. **is_new_user flag in OTP verify** — `/api/v1/auth/otp/verify/` returns `{token, is_new_user}` so frontend knows whether to redirect to profile completion.
4. **409 for duplicate profile** — `POST /api/v1/patient/profile/` returns 409 (not 400) on duplicate — semantically correct resource conflict.
5. **Failure counter sliding TTL** — OTP failure counter resets TTL on each failure (Django cache limitation — no partial TTL). Documented in code; future hardening via Redis Lua.
6. **API-SPEC.md discrepancies** — `role_intent` → `role`, `/patients/` → `/patient/` — flagged for reconciliation in TASK-017.

## WeasyPrint Spike Result (TASK-009)
- **Status:** ✅ PASSED — WeasyPrint 60.2 confirmed viable
- **P95:** ~680ms (threshold: 4000ms) — well within NFR-PE-004
- **Key files:** `prescriptions/tasks.py`, `prescriptions/spike/benchmark.py`
- **Benchmark run:** `docker-compose run backend python prescriptions/spike/benchmark.py`
- **Assumption resolved:** A-06-005 in `docs/assumptions/06-task-breakdown-assumptions.md`
- **TASK-075 unblocked:** Celery PDF generation task structure established; full implementation in Sprint 4/5

## Open Tech Debt (from Sprint 1)
- `accounts/services.py` has AuthService appended below MSG91Adapter — could split into `auth_service.py` (cosmetic, low priority)
- API-SPEC.md field name mismatches to fix in TASK-017
- `python manage.py check` and `pytest` must be run inside Docker (no local Python env)
- **TASK-113 created:** Next.js 15 migration (Sprint 10) — resolves 5 remaining npm audit CVEs in next@14
