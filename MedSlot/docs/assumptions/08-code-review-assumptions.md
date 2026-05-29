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
