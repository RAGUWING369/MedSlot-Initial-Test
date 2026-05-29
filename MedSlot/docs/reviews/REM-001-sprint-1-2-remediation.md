# REMEDIATION BRIEF -- REM-001

**Branch:** feature/TASK-006-aws-cdk-infrastructure-stack
**Issued by:** Code Review Agent -- Phase 8
**Date:** 2026-05-29
**Remediation Mode:** CRITICAL_AND_WARNINGS
**Total items:** 5 Critical + 7 Warning = 12 total

---

> IMPLEMENTATION AGENT INSTRUCTION:
> This brief was produced by the Code Review Agent. You are in REMEDIATION MODE.
> Skip the normal session-start task selection gate (Human Gate #1) and proceed
> directly to implementation for each item below.
> Work through all items in priority order (Criticals first, then Warnings).
> After completing all items, present your Task Completion Gate (Human Gate #2)
> per normal process, then signal the Code Review Agent to re-review with:
> Re-review ready -- feature/TASK-006-aws-cdk-infrastructure-stack

---

## Items -- Critical (fix in this order)

### [REM-C1] Replace non-CSPRNG OTP generation with secrets module
**Source Finding:** CRITICAL-1
**File:** medslot/backend/accounts/services.py:89
**Category:** Security -- OWASP A02 Cryptographic Failures
**Problem Summary:** OTP codes are generated with Python random.choices() which uses the Mersenne Twister PRNG -- not cryptographically secure -- making OTP values statistically predictable.

**Required Fix:** Replace the random import and the OTP generation line.

Current (lines 19-20 and 89):
```python
import random
import string
# ...
otp_code = "".join(random.choices(string.digits, k=OTP_LENGTH))
```

Replacement:
```python
import secrets
# remove: import random
# remove: import string  (no longer needed)
# ...
otp_code = "".join(secrets.choice("0123456789") for _ in range(OTP_LENGTH))
```

Remove the now-unused imports random and string. The string module import may be used elsewhere in the file -- verify with grep before removing it.

**Acceptance:** grep -n "import random" services.py returns no matches. The generate_and_store method produces a 6-character all-digit string. All existing OTP tests pass under pytest.

---

### [REM-C2] Replace timing-unsafe OTP hash comparison with hmac.compare_digest
**Source Finding:** CRITICAL-2
**File:** medslot/backend/accounts/services.py:17-18 (imports) and 188 (comparison)
**Category:** Security -- OWASP A02 Cryptographic Failures
**Problem Summary:** The OTP hash comparison uses Python string != operator which may not execute in constant time at the CPU level, enabling timing side-channel attacks against the OTP hash.

**Required Fix:** Add hmac import and replace the comparison operator.

Add to imports at top of file:
```python
import hmac
```

Change line 188:
```python
# Before:
if submitted_hash != stored_hash:

# After:
if not hmac.compare_digest(submitted_hash, stored_hash):
```

**Acceptance:** grep -n "import hmac" services.py returns a match. The comparison on line 188 uses hmac.compare_digest. All OTP verification tests pass.

---

### [REM-C3] Remove PHI from DoctorProfile.__str__ to prevent log leakage
**Source Finding:** CRITICAL-3
**File:** medslot/backend/accounts/models.py:217-218
**Category:** Security -- OWASP A08 Security Logging and Monitoring Failures
**Problem Summary:** DoctorProfile.__str__ returns the doctor full name and specialty; any log statement passing str(doctor_profile) will write PHI (full_name) to application logs in plaintext, violating the data privacy coding standard.

**Required Fix:** Replace __str__ to return only the non-PHI primary key.

Current (lines 217-218):
```python
def __str__(self) -> str:
    return f"Dr. {self.full_name} ({self.specialty})"
```

Replacement:
```python
def __str__(self) -> str:
    # PHI-SAFE: returns only the primary key -- full_name and specialty are PHI
    # and must never appear in application logs via str(instance) interpolation.
    return f"DoctorProfile(id={self.pk})"
```

**Acceptance:** str(DoctorProfile()) no longer contains full_name or specialty. Django admin display continues to work (admin can use list_display fields directly). Existing model tests pass.

---

### [REM-C4] Replace hardcoded CORS wildcard with CDK context-driven origin list
**Source Finding:** CRITICAL-4
**File:** medslot/infra/lib/s3-stack.ts:87
**Category:** Security -- OWASP A05 Security Misconfiguration
**Problem Summary:** allowedOrigins: ['*'] is hardcoded in committed CDK source; any environment that deploys this stack without override will have a permanent CORS wildcard on the health records S3 bucket, allowing any web origin to initiate presigned PUT uploads.

**Required Fix:** Read allowed origins from CDK context with a safe default list.

Add near the top of the MedSlotS3Stack constructor (before bucket definitions):
```typescript
const corsOrigins: string[] = this.node.tryGetContext("corsOrigins") ?? [
  "https://medslot.in",
  "https://staging.medslot.in",
];
```

Change line 87:
```typescript
// Before:
allowedOrigins: ["*"],

// After:
allowedOrigins: corsOrigins,
```

**Acceptance:** The string literal "*" no longer appears in s3-stack.ts allowedOrigins. cdk synth produces AllowedOrigins defaulting to ["https://medslot.in","https://staging.medslot.in"]. npm run test in infra/ passes.
---

### [REM-C5] Scope CloudWatch Logs IAM policy to /medslot/ecs/* log groups
**Source Finding:** CRITICAL-5
**File:** medslot/infra/lib/ecs-stack.ts:197-202
**Category:** Security -- OWASP A01 Broken Access Control (over-privileged IAM)
**Problem Summary:** The ECS task role grants logs:CreateLogStream and logs:PutLogEvents against resources: ["*"], meaning a compromised container can write to any CloudWatch log group in the account -- not just MedSlot log groups.

**Required Fix:** Split into two policy statements -- one for cloudwatch:PutMetricData (must remain "*") and one for logs actions scoped to the /medslot/ecs/* ARN pattern.

Current (lines 196-202):

    taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["cloudwatch:PutMetricData", "logs:CreateLogStream", "logs:PutLogEvents"],
        resources: ["*"],
      }),
    );

Replacement -- split the statement so logs actions are resource-scoped:

    // CloudWatch Metrics -- no resource-level restriction available for PutMetricData
    taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["cloudwatch:PutMetricData"],
        resources: ["*"],
      }),
    );

    // CloudWatch Logs -- scoped to MedSlot ECS log groups only
    taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["logs:CreateLogStream", "logs:PutLogEvents"],
        resources: [
          "arn:" + this.partition + ":logs:" + this.region + ":" + this.account + ":log-group:/medslot/ecs/*",
        ],
      }),
    );

Note: The ARN is written with string concatenation above to avoid shell expansion of the TypeScript template literal in this document. In the actual TypeScript file use the template literal form.

**Acceptance:** The CloudFormation template from cdk synth shows two separate IAM policy statements on the task role. The statement containing logs:CreateLogStream uses the /medslot/ecs/* ARN, not "*". npm run test in infra/ passes.

---

## Items -- Warning (address after Criticals)

### [REM-W1] Wire Razorpay secrets into ECS task definitions via makeSecrets
**Source Finding:** WARNING-1
**File:** medslot/infra/lib/ecs-stack.ts:253-261
**Category:** Architecture -- missing secret injection for subscriptions feature
**Problem Summary:** The makeSecrets() function omits RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAY_WEBHOOK_SECRET; the subscriptions feature will fail at container start when implemented.

**Required Fix:** Add the three Razorpay fields to makeSecrets(). The razorpaySecret Secret Manager entry is already declared in the stack.

    const makeSecrets = (): { [key: string]: ecs.Secret } => ({
      SECRET_KEY: ecs.Secret.fromSecretsManager(jwtSecret, "value"),
      JWT_SECRET: ecs.Secret.fromSecretsManager(jwtSecret, "value"),
      OTP_PEPPER: ecs.Secret.fromSecretsManager(otpPepperSecret, "value"),
      MSG91_API_KEY: ecs.Secret.fromSecretsManager(msg91Secret),
      SENDGRID_API_KEY: ecs.Secret.fromSecretsManager(sendgridSecret),
      DATABASE_USER: ecs.Secret.fromSecretsManager(dbCredSecretImported, "username"),
      DATABASE_PASSWORD: ecs.Secret.fromSecretsManager(dbCredSecretImported, "password"),
      // Razorpay -- subscriptions app (TASK-089). Secret JSON contains
      // key_id, key_secret, and webhook_secret fields.
      RAZORPAY_KEY_ID: ecs.Secret.fromSecretsManager(razorpaySecret, "key_id"),
      RAZORPAY_KEY_SECRET: ecs.Secret.fromSecretsManager(razorpaySecret, "key_secret"),
      RAZORPAY_WEBHOOK_SECRET: ecs.Secret.fromSecretsManager(razorpaySecret, "webhook_secret"),
    });

Also confirm executionRole (not taskRole) has grantRead on razorpaySecret -- ECS secrets injection uses the execution role.

**Acceptance:** makeSecrets() includes all three RAZORPAY_* keys. cdk synth shows them in the Secrets array of api, worker, and beat task definitions. npm run test passes.

---

### [REM-W2] Replace hardcoded ALB DNS with CDK context key for NEXT_PUBLIC_API_URL
**Source Finding:** WARNING-2
**File:** medslot/infra/lib/ecs-stack.ts:396-398
**Category:** Architecture -- environment coupling
**Problem Summary:** NEXT_PUBLIC_API_URL is set directly to the ALB internal DNS name; when CloudFront or a custom domain is configured, a CDK redeploy is required just to update this value.

**Required Fix:**

    const apiUrl: string =
      this.node.tryGetContext("apiUrl") ?? "https://" + alb.loadBalancerDnsName;

    // In the frontend container environment:
    environment: {
      NODE_ENV: "production",
      NEXT_PUBLIC_API_URL: apiUrl,
    },

Note: The template literal is written with string concatenation above to avoid shell expansion. In the actual TypeScript file use the template literal form with backticks.

**Acceptance:** alb.loadBalancerDnsName no longer appears directly in the environment object. cdk synth --context apiUrl=https://api.medslot.in produces NEXT_PUBLIC_API_URL=https://api.medslot.in in the task definition. npm run test passes.

---

### [REM-W3] Change VPC flow log group removalPolicy from DESTROY to RETAIN
**Source Finding:** WARNING-3
**File:** medslot/infra/lib/vpc-stack.ts:70
**Category:** Architecture -- compliance audit log preservation
**Problem Summary:** removalPolicy: DESTROY on the VPC flow log group permanently deletes all network security audit logs if the stack is torn down; flow logs are compliance evidence and must survive stack lifecycle.

**Required Fix:**

Current (line 70):

    removalPolicy: cdk.RemovalPolicy.DESTROY,

Replacement:

    removalPolicy: cdk.RemovalPolicy.RETAIN,

**Acceptance:** The string DESTROY no longer appears in VpcFlowLogGroup properties in cdk synth output. The CloudFormation template shows DeletionPolicy: Retain for this log group. npm run test passes.

---

### [REM-W4] Move MSG91 authkey from request body to Authorization header
**Source Finding:** WARNING-4
**File:** medslot/backend/accounts/services.py:283-295
**Category:** Security -- API key exposure in request body
**Problem Summary:** The MSG91 API key is sent in the JSON request body under "authkey" where it may appear in HTTP access logs; the Authorization header keeps credentials out of the body.

**Required Fix:** Remove "authkey" from the payload dict and pass it as an HTTP header.

Current (lines 283-288):
```python
payload = {
    "template_id": template_id,
    "mobile": phone.lstrip("+"),
    "authkey": api_key,
    "otp": otp_code,
}
```

Replacement:
```python
payload = {
    "template_id": template_id,
    "mobile": phone.lstrip("+"),
    "otp": otp_code,
}
```

And add headers to the requests.post call:
```python
response = requests.post(
    cls.MSG91_OTP_URL,
    json=payload,
    headers={"Authorization": api_key},
    timeout=cls.REQUEST_TIMEOUT_SECONDS,
)
```

**Acceptance:** The string "authkey" no longer appears in the payload dict. The requests.post call includes headers={"Authorization": api_key}. Existing SMS delivery mock tests pass.

---

### [REM-W5] Narrow bare except Exception to DoctorProfile.DoesNotExist
**Source Finding:** WARNING-5
**File:** medslot/backend/accounts/views.py:181 and medslot/backend/accounts/permissions.py:74 and 129
**Category:** Correctness -- silent swallowing of unexpected exceptions
**Problem Summary:** Three except Exception: blocks catch all exceptions -- masking programming errors and database failures as permission denials.

**Required Fix:** Replace each with the specific Django ORM exception.

In views.py line 181:
```python
except DoctorProfile.DoesNotExist:
```

In permissions.py line 74:
```python
except DoctorProfile.DoesNotExist:
```

In permissions.py line 129:
```python
except DoctorProfile.DoesNotExist:
```

Verify DoctorProfile is imported in permissions.py (it should already be there).

**Acceptance:** grep -rn "except Exception" accounts/views.py accounts/permissions.py returns no matches. All three locations use except DoctorProfile.DoesNotExist:. pytest passes.

---

### [REM-W6] Replace PatientProfile DB query with reverse relation hasattr check
**Source Finding:** WARNING-6
**File:** medslot/backend/accounts/views.py:198
**Category:** Performance -- unnecessary database query on every OTP verification
**Problem Summary:** PatientProfile.objects.filter(user=user).exists() executes an extra DB query on every successful patient OTP verification.

**Required Fix:**

Current (line 198):
```python
is_new_user = not PatientProfile.objects.filter(user=user).exists()
```

Replacement:
```python
is_new_user = not hasattr(user, "patient_profile")
```

**Acceptance:** PatientProfile.objects.filter no longer appears in views.py. hasattr(user, "patient_profile") is used. All OTP verification view tests pass.

---

### [REM-W7] Replace non-atomic failure counter with atomic cache.add + cache.incr
**Source Finding:** WARNING-7
**File:** medslot/backend/accounts/services.py:215-228
**Category:** Correctness -- race condition in OTP lockout counter
**Problem Summary:** The _record_failure method uses a non-atomic cache.get + cache.set pattern; concurrent requests can both read count=0 and both set count=1, preventing the lockout threshold from ever being reached.

**Required Fix:** Use cache.add (atomic set-if-not-exists) followed by cache.incr.

Current (lines 214-228):
```python
fail_key = _OTP_FAIL_KEY.format(phone=phone)
failure_count = cache.get(fail_key, 0)

if failure_count == 0:
    cache.set(fail_key, 1, timeout=OTP_FAIL_TTL_SECONDS)
else:
    new_count = int(failure_count) + 1
    cache.set(fail_key, new_count, timeout=OTP_FAIL_TTL_SECONDS)

    if new_count >= OTP_MAX_FAILURES:
        lock_key = _OTP_LOCK_KEY.format(phone=phone)
        cache.set(lock_key, True, timeout=OTP_LOCK_TTL_SECONDS)
        cache.delete(fail_key)
        logger.info(
            "OTP account locked after max failures",
            extra={"action": "otp_account_locked"},
        )
```

Replacement:
```python
fail_key = _OTP_FAIL_KEY.format(phone=phone)
# Atomic: cache.add is SETNX -- sets the key only if it does not exist.
# cache.incr is atomic INCRBY. Together they eliminate the get-then-set race.
cache.add(fail_key, 0, timeout=OTP_FAIL_TTL_SECONDS)
new_count = cache.incr(fail_key)

if new_count >= OTP_MAX_FAILURES:
    lock_key = _OTP_LOCK_KEY.format(phone=phone)
    cache.set(lock_key, True, timeout=OTP_LOCK_TTL_SECONDS)
    cache.delete(fail_key)
    logger.info(
        "OTP account locked after max failures",
        extra={"action": "otp_account_locked"},
    )
```

Note: Django cache.incr raises ValueError if the key does not exist. The cache.add call above ensures the key exists first, making this safe. The Django Redis backend executes add as Redis SETNX and incr as Redis INCRBY -- both atomic.

**Acceptance:** The get-then-set pattern (cache.get followed by cache.set with failure_count == 0 branch) no longer exists in _record_failure. cache.add and cache.incr are used. Failure counter tests pass.

---

## Re-Review Scope

When all items above are complete, signal:
Re-review ready -- feature/TASK-006-aws-cdk-infrastructure-stack

The Code Review Agent will re-run the following steps against the affected files only:

Files to re-review:
  medslot/backend/accounts/services.py    (REM-C1, REM-C2, REM-W4, REM-W7)
  medslot/backend/accounts/models.py      (REM-C3)
  medslot/backend/accounts/views.py       (REM-W5, REM-W6)
  medslot/backend/accounts/permissions.py (REM-W5)
  medslot/infra/lib/s3-stack.ts           (REM-C4)
  medslot/infra/lib/ecs-stack.ts          (REM-C5, REM-W1, REM-W2)
  medslot/infra/lib/vpc-stack.ts          (REM-W3)

Steps to re-run:
  Step 5 (Security Review) -- OWASP A01, A02, A05, A08
  Step 7 (Performance Review) -- REM-W6 cache query elimination
  Step 4 (Correctness Review) -- REM-W5, REM-W7
  Step 8 (Readability) -- import cleanup from REM-C1

Full re-review will be run if: new files were added during remediation, automated
checks were previously failing, or unexpected scope changes occurred.
