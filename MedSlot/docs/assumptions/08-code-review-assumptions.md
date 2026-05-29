# Code Review — Assumption Log
**Phase:** 08 — Code Review
**Agent:** 08_code_review_agent.md
**Generated:** 2026-05-29
**Session:** Branch review of feature/TASK-006-aws-cdk-infrastructure-stack covering Sprint 1 + Sprint 2 tasks (TASK-002, TASK-004, TASK-005, TASK-006, TASK-007, TASK-008, TASK-010, TASK-011, TASK-012, TASK-013, TASK-014)

---

## Tier 3 Inferences Made This Phase

| ID | Inference | Basis | Confidence | Must Validate Before Phase |
|----|-----------|-------|------------|---------------------------|
| A-08-001 | `random.choices(string.digits, k=6)` uses Python's Mersenne Twister PRNG which is not cryptographically secure. For a 6-digit OTP in a security-sensitive context, `secrets.choice` or `secrets.randbelow` is the correct primitive. The current implementation is functionally correct at low threat models but does not meet cryptographic best practice. | Python stdlib docs — `random` module is documented as "not suitable for security use"; `secrets` module is the Python-recommended alternative for OTPs and tokens. | High | Phase 10 (Security Review) |
| A-08-002 | The OTP hash comparison in `services.py` line 188 (`submitted_hash != stored_hash`) uses Python's `!=` operator on hex strings. While SHA-256 hex digests are constant-length (64 chars) which eliminates length-based timing side-channels, Python's string `!=` may still have non-constant comparison characteristics at the CPU instruction level. `hmac.compare_digest()` is the standard defensive practice for all secret comparisons. The practical risk is very low given OTP attempt limits, but the code falls short of best practice. | Python docs — `hmac.compare_digest()` explicitly recommended for all security-sensitive string comparison. | High | Phase 10 (Security Review) |
| A-08-003 | The `DoctorProfile.__str__` method returns `Dr. {self.full_name}` which contains a PHI field (full_name). While Django admin uses `__str__` for display, if any code path passes `str(doctor_profile)` into a log statement, PHI would leak. The current implementation is not annotated with the PHI risk. The other profile type (`PatientProfile`) correctly avoids PHI in its `__str__`. | Code pattern inference — consistent with the PHI-in-str-antipattern that is common in Django models. | High | Phase 8 (this review) — already flagged |
| A-08-004 | The S3 records bucket CORS `allowedOrigins: ['*']` has an inline comment stating the CD pipeline narrows it to the production domain at deploy time via CDK context parameters. This mechanism is not verified in this review (no CDK context file examined). Assumed correct as documented. | Inline code comment in `s3-stack.ts` lines 78–80. | Medium | Phase 12 (Deployment) |
| A-08-005 | The Razorpay secret is injected into ECS task definitions via `makeSecrets()` in `ecs-stack.ts` but RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAY_WEBHOOK_SECRET env var names are not present in `makeSecrets()`. The razorpaySecret Secret Manager entry is granted `grantRead()` to the task role, but the key/value structure of the secret (bundled vs separate fields) is not specified in the CDK code. Assumed the application code reads the full secret JSON and parses it. | Inferred from comment in `s3-stack.ts` — "Razorpay credentials — key_id, key_secret, webhook_secret bundled in one secret." | Medium | Phase 7 (TASK-089 Subscriptions implementation) |
| A-08-006 | The `NEXT_PUBLIC_API_URL` is set to the ALB DNS name (`https://${alb.loadBalancerDnsName}`) in the ECS frontend task definition. At runtime this points to the ALB FQDN, not the custom `medslot.in` domain. This is intentional for internal ECS-to-ECS communication but means the frontend will use the ALB hostname for API calls rather than the CDN or custom domain. This is an accepted infrastructure design at this stage. | Inferred from ECS stack comments and architecture design — CloudFront setup deferred to Phase 13. | High | Phase 13 (Monitoring — CloudFront setup) |

---

## Open Flags (Tier 2 — Unconfirmed Suggestions)

| Flag ID | Suggestion Made | Location in Artifact | Status |
|---------|----------------|----------------------|--------|
| F-08-001 | Replace `random.choices` with `secrets.randbelow` or `secrets.choice` for OTP generation | `medslot/backend/accounts/services.py:89` | Flagged as Warning in review — author justification or fix required |
| F-08-002 | Replace `!=` string comparison with `hmac.compare_digest()` in OTP verification | `medslot/backend/accounts/services.py:188` | Flagged as Warning in review — author justification or fix required |
| F-08-003 | `DoctorProfile.__str__` exposes PHI (full_name) which could leak via log interpolation | `medslot/backend/accounts/models.py:218` | Flagged as Warning in review — author justification or fix required |

---

## Resolution Log

| ID | Original Assumption | Resolution | Resolved By | Date |
|----|--------------------|-----------|-----------:|------|
| — | — | — | — | — |


---

## Re-Review Pass — REM-001 (Cycle 2)

**Date:** 2026-05-29
**Commit verified:** 86d79bb (fix(security): apply REM-001 code review remediation)
**Branch:** feature/TASK-006-aws-cdk-infrastructure-stack
**Result:** ALL 12 ITEMS RESOLVED — RE-REVIEW STATUS: APPROVED

### Item-by-item verification

| Item | File | Status | What was verified |
|------|------|--------|-------------------|
| REM-C1 | accounts/services.py | PASS | `import secrets` present; `import random` and `import string` absent; OTP uses `secrets.choice` in a loop |
| REM-C2 | accounts/services.py | PASS | `import hmac` present; `hmac.compare_digest(submitted_hash, stored_hash)` used for OTP hash comparison |
| REM-C3 | accounts/models.py | PASS | `DoctorProfile.__str__` returns `f"DoctorProfile(id={self.pk})"` — no `full_name`, no `specialty` |
| REM-C4 | infra/lib/s3-stack.ts | PASS | `corsOrigins` populated from `tryGetContext` with explicit domain default; no wildcard `*` present |
| REM-C5 | infra/lib/ecs-stack.ts | PASS | Separate `addToPrincipalPolicy` calls for logs and metrics; logs ARN scoped to `/medslot/ecs/*` |
| REM-W1 | infra/lib/ecs-stack.ts | PASS | `makeSecrets()` includes `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| REM-W2 | infra/lib/ecs-stack.ts | PASS | `NEXT_PUBLIC_API_URL` uses `tryGetContext("apiUrl")` with ALB DNS as fallback — context-overridable |
| REM-W3 | infra/lib/vpc-stack.ts | PASS | VPC flow log group uses `cdk.RemovalPolicy.RETAIN` |
| REM-W4 | accounts/services.py | PASS | MSG91 payload has no `"authkey"` field; API key sent as `Authorization` header |
| REM-W5 (views) | accounts/views.py | PASS | `except DoctorProfile.DoesNotExist` and `except PatientProfile.DoesNotExist`; no bare `except Exception` |
| REM-W5 (perms) | accounts/permissions.py | PASS | `except DoctorProfile.DoesNotExist` in `IsApprovedDoctor` and `IsApprovedOrTrialDoctor` |
| REM-W6 | accounts/views.py | PASS | `hasattr(user, "patient_profile")` replaces `PatientProfile.objects.filter().exists()` |
| REM-W7 | accounts/services.py | PASS | `_record_failure` uses `cache.add` then `cache.incr` atomically; get-then-set race eliminated |

### Prior open flags resolved by this remediation

| Flag | Original Issue | Resolution |
|------|---------------|------------|
| F-08-001 / A-08-001 | `random.choices` used for OTP generation | Fixed: `secrets.choice` used (REM-C1) |
| F-08-002 / A-08-002 | `!=` string comparison on OTP hash | Fixed: `hmac.compare_digest` used (REM-C2) |
| F-08-003 / A-08-003 | `DoctorProfile.__str__` exposed `full_name` PHI | Fixed: returns id-only string (REM-C3) |
| A-08-004 | CORS wildcard assumed narrowed at deploy | Fixed: `corsOrigins` variable with explicit domain defaults (REM-C4) |
| A-08-005 | Razorpay keys not mapped as individual env vars in `makeSecrets` | Fixed: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` added (REM-W1) |

No new issues introduced by remediation commit 86d79bb.
