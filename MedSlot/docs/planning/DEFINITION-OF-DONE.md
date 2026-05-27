# Definition of Done — MedSlot
**Version:** 1.0
**Date:** 2026-05-27
**Applies To:** All tasks across all sprints (Sprint 1–11)
**Authority:** This DoD is the binding agreement between engineering, QA, and the product team. A task is either Done (all criteria met) or Not Done. There is no "mostly done."

---

## Universal DoD — Applies to Every Task

A task is **DONE** when ALL of the following are true:

- [ ] **Code implemented:** All acceptance criteria from the task definition are satisfied
- [ ] **Self-reviewed:** Author has re-read their own diff and removed: commented-out debug code, `TODO` comments without issue references, console.log/print statements left from debugging, unused imports
- [ ] **Tests written:** New code has unit tests; test coverage for the modified module(s) is ≥ 90% (measured by `pytest --cov` for backend, `npm run test -- --coverage` for frontend)
- [ ] **All existing tests pass:** `pytest` (backend) and `npm run test` (frontend) pass with zero failures — no regressions introduced
- [ ] **Linting passes:** `npm run lint` returns zero errors (frontend); `black --check` + `isort --check` + `flake8` return zero errors (backend)
- [ ] **Type checking passes:** `npm run type-check` (TypeScript strict mode) returns zero errors (frontend); Django `manage.py check` passes (backend)
- [ ] **Code reviewed:** At least 1 peer has reviewed and approved the pull request; all review comments are resolved or explicitly deferred with a linked follow-up task
- [ ] **PR requirements met:** CI pipeline is green (lint + tests + coverage gate); no open review comments; branch is `feature/xxx` merging to `develop`
- [ ] **TASKS.md updated:** Task status updated to Done (🟢); any newly discovered tasks added as ⬜ Pending with estimates
- [ ] **No critical/high defects introduced:** New code does not introduce P0 or P1 bugs as identified during code review or testing
- [ ] **PHI compliance verified (if applicable):** Any new Django model field containing health information is annotated with `# PHI`; no PHI appears in any log statement — confirmed by code review

---

## DoD Extension: Backend API Tasks

In addition to the Universal DoD, all backend API tasks must also satisfy:

- [ ] **DRF serializer validation:** All request inputs validated via DRF serializer before reaching the service layer; invalid input returns 400 with field-level error messages (not a generic 500)
- [ ] **RBAC permission enforced:** The correct DRF permission class (`IsPatient`, `IsApprovedDoctor`, `IsAdmin`, `IsApprovedOrTrialDoctor`) is applied at the view level; cross-role access tested (wrong role returns 403)
- [ ] **Integration tests written:** At least one integration test per endpoint covering: happy path, validation failure (400), unauthorized access (401 or 403), and the primary edge case
- [ ] **API documented:** `drf-spectacular` schema annotations added; `GET /api/schema/` validates without errors after this task
- [ ] **No raw SQL:** All database queries use Django ORM exclusively; no `cursor.execute()` raw SQL calls
- [ ] **PHI fields never logged:** Any PHI field returned in serializer output is verified absent from all log statements in the new code
- [ ] **Idempotent where required:** Celery tasks use appointment/prescription/record IDs as natural idempotency keys; re-running the same task twice produces the same outcome

---

## DoD Extension: Frontend Screen Tasks

In addition to the Universal DoD, all frontend screen tasks must also satisfy:

- [ ] **Wireframe states implemented:** All states defined in the task's Wireframe Reference are implemented (default, loading, empty, error, success — as applicable); no state left as a placeholder
- [ ] **Desktop-first layout verified:** Screen renders correctly at 1280px and above; Tailwind base (unprefixed) styles target desktop
- [ ] **Responsive verified:** Screen is functional at 768px (tablet) and 375px (mobile) breakpoints; tested via browser DevTools device emulation
- [ ] **Loading states present:** Every API call has a corresponding loading state (spinner on buttons, skeleton cards, or progress bar) — no bare "loading..." text unless specified in wireframe
- [ ] **Error states handled:** Every API call has a corresponding error state; errors surface to the user with the exact message specified in the wireframe (not a generic "Error")
- [ ] **Form validation inline:** All forms use React Hook Form + Zod; validation errors appear inline at the field level without full page reload
- [ ] **Route guard applied:** Authenticated screens redirect unauthenticated users to the correct auth page; role-mismatched users are redirected to their correct dashboard
- [ ] **Accessibility baseline:** Screen has no axe-core critical violations (`@axe-core/react` or equivalent run in test); semantic HTML used (headings in correct order, form labels bound to inputs, buttons have accessible text)
- [ ] **Zustand integration:** Auth state (token, user, role) is read from Zustand `authStore`, not from local component state or cookies directly
- [ ] **Axios API client used:** All API calls go through `frontend/lib/api.ts` (the configured Axios instance with JWT interceptor); no raw `fetch()` calls to `/api/v1/`

---

## DoD Extension: Database Migration Tasks

In addition to the Universal DoD, all database migration tasks must also satisfy:

- [ ] **Migration is reversible:** `python manage.py migrate <app> zero` runs without error; migration can be rolled back
- [ ] **Migration tested in CI:** CI pipeline runs `python manage.py migrate --run-syncdb` on a fresh database; no errors
- [ ] **No data-destructive changes without approval:** Any migration that drops a column, renames a column, or changes a column type is flagged in the PR description and approved explicitly by the tech lead before merge
- [ ] **PHI fields annotated:** Every model field containing personally identifiable health information has `# PHI` inline comment in `models.py`
- [ ] **Index strategy applied:** Frequently-queried columns (as specified in task) have database indexes created in the migration

---

## DoD Extension: DevOps / Infrastructure Tasks

In addition to the Universal DoD, all devops/infrastructure tasks must also satisfy:

- [ ] **Infrastructure as Code only:** All AWS resource changes are in CDK TypeScript; no manual console changes; `npx cdk diff` shows only the intended changes
- [ ] **No static credentials:** No API keys, database passwords, or JWT secrets are committed to any file in the repository; all secrets reference AWS Secrets Manager or environment variable names
- [ ] **CDK synth passes:** `npx cdk synth` produces valid CloudFormation with zero errors or warnings
- [ ] **Secrets documented:** Any new secret added to the system is documented in `.env.example` with a descriptive comment
- [ ] **Rollback procedure documented:** For any deployment change that is difficult to revert, a rollback procedure is added to the PR description

---

## DoD Extension: Test Tasks

In addition to the Universal DoD, all dedicated test tasks must also satisfy:

- [ ] **Tests are independent:** Each test can run in isolation (no shared mutable state between tests); tests use `pytest` fixtures or `beforeEach` for setup
- [ ] **External services mocked:** No test makes real calls to MSG91, SendGrid, Razorpay, or AWS S3; all external adapters are mocked at the adapter boundary
- [ ] **Coverage gate passes:** `pytest --cov=. --cov-fail-under=90` passes for backend; `npm run test -- --coverage --coverageThreshold='{"global":{"lines":90}}'` passes for frontend
- [ ] **Edge cases covered:** Happy path + at least 2 error/edge cases per endpoint or component
- [ ] **E2E tests (where specified):** Run against staging environment with seeded test data; no production data used in tests

---

## Sign-Off Requirements

Before a PR is merged to `develop`:
1. **Author** self-review completed (checklist above)
2. **At least 1 reviewer** has approved the PR in GitHub
3. **CI pipeline** is fully green: lint + type-check + unit tests + coverage gate
4. **No open review comments** — all discussions resolved or linked to a follow-up task

Before a sprint is closed as complete:
1. All tasks in the sprint have status 🟢 Done in TASKS.md
2. Sprint deliverable (the sprint goal) is demonstrable in the staging environment
3. No P0 or P1 bugs introduced by sprint work are open
4. `docs/planning/TASKS.md` is up to date with final task statuses

---

## What "Done" Is NOT

The following do not constitute Done on their own:
- "Code is written but tests are pending" — Not Done
- "Works on my machine" without CI passing — Not Done
- "PR is open but not yet reviewed" — Not Done
- "Mostly meets acceptance criteria" — Not Done (a task either meets all criteria or it does not)
- "Coverage is 87%" — Not Done (the threshold is 90%)
- "I'll fix the lint errors in the next task" — Not Done
