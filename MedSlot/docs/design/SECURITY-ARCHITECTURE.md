# Security Architecture — MedSlot

**Phase:** 4 — Architecture
**Version:** 1.0
**Date:** 2026-05-25
**Framework:** OWASP Top 10 (2021), OWASP ASVS v4.0, OWASP API Security Top 10

---

## Authentication Flow

### Complete OTP Authentication Lifecycle

```
Step 1 — OTP Request
  Client → POST /api/v1/auth/otp/request/ {phone, role_intent}
  Backend:
    1. Validate phone format (E.164)
    2. Check Redis otp_rate:{phone} counter — if ≥ 5, return 429
    3. Increment otp_rate:{phone} with 60-min TTL
    4. Generate 6-digit OTP using secrets.randbelow(1_000_000) [cryptographically secure]
    5. Hash OTP: SHA-256(OTP + PEPPER) — store hash in Redis otp:{phone} with 5-min TTL
    6. Call MSG91Adapter.send_otp(phone, otp_plaintext)
    7. Return 200 {expires_in: 300}
    8. OTP plaintext is discarded after MSG91 call — never logged, never stored

Step 2 — OTP Verification
  Client → POST /api/v1/auth/otp/verify/ {phone, otp}
  Backend:
    1. Check Redis otp_fail:{phone} counter — if ≥ 3 within 10 min, return 429 (15-min lockout)
    2. Retrieve otp_hash from Redis otp:{phone} — if missing, return 400 (expired)
    3. Verify: SHA-256(submitted_otp + PEPPER) == stored_hash
    4. On failure: increment otp_fail:{phone}; return 400 {attempts_remaining: N}
    5. On success:
       a. Delete Redis keys otp:{phone} and otp_fail:{phone}
       b. Get or create CustomUser with role
       c. Issue JWT: HS256 signed with SECRET_KEY from Secrets Manager
          Payload: {sub: user_id, role: role, iat: now, exp: now + 24h}
       d. Return 200 {access_token, role, is_new_user, user_id}

Token Usage
  All protected requests: Authorization: Bearer <token>
  Backend: simplejwt JWTAuthentication validates signature + expiry on every request
  Role extraction: request.user.role (from JWT claim) — never from database on each request

Logout
  POST /api/v1/auth/logout/ — logs event; JWT is client-side; no server-side invalidation in v1
  [Future v2: add token blocklist in Redis for explicit revocation]
```

**Security Properties:**
- OTP is cryptographically random (secrets module — not random module)
- OTP stored as hash — never retrievable from Redis in plaintext
- Rate limiting prevents OTP enumeration (5 requests/hour per phone)
- Failure counter prevents brute force (3 failures → 15-min lockout)
- JWT payload contains no PHI (only UUID, role, timestamps)

---

## Authorization Model

### RBAC Permission Matrix

| Role | Resource | Allowed Actions |
|------|----------|----------------|
| **Patient** | Own profile | READ, UPDATE |
| **Patient** | Doctor search, profiles | READ (public) |
| **Patient** | Appointment slots | READ |
| **Patient** | Own appointments | CREATE, READ, CANCEL (within window) |
| **Patient** | Own health records | CREATE, READ, DELETE (soft) |
| **Patient** | Own prescriptions | READ, REGENERATE_URL |
| **Patient** | Analytics events | CREATE |
| **Patient** | Doctor/Admin resources | ❌ 403 |
| **Doctor (Approved/Trial)** | Own doctor profile | READ, UPDATE (limited fields) |
| **Doctor (Approved/Trial)** | Availability calendar | READ, WRITE |
| **Doctor (Approved/Trial)** | Own appointments (today/upcoming) | READ |
| **Doctor (Approved/Trial)** | Consultation notes | CREATE, READ, UPDATE (In Consultation only) |
| **Doctor (Approved/Trial)** | Prescription issuance | CREATE (In Consultation only) |
| **Doctor (Approved/Trial)** | Cancel own appointments | UPDATE |
| **Doctor (Approved/Trial)** | Mark no-show | UPDATE (own appointments only) |
| **Doctor (Approved/Trial)** | Subscription management | READ, INITIATE |
| **Doctor (Approved/Trial)** | Patient/Admin resources | ❌ 403 |
| **Doctor (Pending/Rejected/Suspended)** | All protected endpoints | ❌ 403 |
| **Admin** | Doctor pending list | READ |
| **Admin** | Doctor approval/rejection/suspension | UPDATE |
| **Admin** | All patient/doctor data | ❌ 403 (no direct data access; admin uses Django Admin for operational tasks) |

### DRF Permission Classes

```python
# accounts/permissions.py

class IsPatient(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'patient'

class IsApprovedDoctor(BasePermission):
    def has_permission(self, request, view):
        if not (request.user.is_authenticated and request.user.role == 'doctor'):
            return False
        # Check subscription status: Trial or Active allows full access
        sub = request.user.doctorprofile.doctorsubscription
        if sub.status in ('Trial', 'Active'):
            if sub.status == 'Trial' and sub.trial_expiry < now():
                return False  # Trial expired
            return request.user.doctorprofile.account_status == 'Approved'
        return False

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsAppointmentDoctor(BasePermission):
    """Object-level: only the doctor assigned to an appointment can access it."""
    def has_object_permission(self, request, view, obj):
        return obj.doctor.user == request.user
```

**Enforcement rule:** Every view class explicitly declares its `permission_classes`. No view uses `permission_classes = [IsAuthenticated]` alone where a role-specific check is required (NFR-SEC-005, CLAUDE.md coding standard).

---

## Data Classification

| Class | Description | Examples | Protection |
|-------|-------------|----------|-----------|
| **PHI (Protected Health Information)** | Data that identifies an individual in the context of their health | Diagnosis, consultation notes, prescription medicines, chief complaint, examination findings, health record contents | Encrypted at rest (AES-256); TLS in transit; never logged in plaintext; `# PHI` annotation; access restricted to treating doctor and owning patient |
| **PII (Personally Identifiable Information)** | Data that identifies an individual | Name, phone, date of birth, email, gender, clinic address | Encrypted at rest; TLS in transit; hashed in logs (`user_id` → SHA-256); 10-year retention |
| **Internal Confidential** | Business-sensitive but not personal | Subscription status, Razorpay IDs, trial expiry | TLS in transit; access restricted to doctor and admin |
| **Internal** | Non-sensitive operational data | Specialty names, slot times, appointment status, analytics event names | TLS in transit; standard access controls |
| **Public** | Intentionally public | Doctor name, specialty, city, clinic name (on profile), slot availability | No special protection required |

### PHI Field Inventory (# PHI Annotations)

| Model | Fields |
|-------|--------|
| PatientProfile | name, date_of_birth, gender, email |
| CustomUser | phone |
| ConsultationNote | chief_complaint, history, examination_findings, diagnosis, plan |
| Prescription | medicines (JSONB), instructions |
| HealthRecord | original_filename |
| Notification | recipient_address |

---

## Encryption Strategy

### At Rest

| Data Store | Encryption | Key Management |
|------------|-----------|----------------|
| RDS PostgreSQL | AES-256 via AWS KMS (RDS encryption enabled at provisioning) | AWS managed key (aws/rds); upgraded to CMK in v2 |
| S3 (all buckets) | SSE-S3 (AES-256, S3-managed keys) | S3 managed; enforced via bucket policy: `"Condition": {"StringNotEquals": {"s3:x-amz-server-side-encryption": "AES256"}}` |
| Redis (ElastiCache) | In-transit encryption enabled; at-rest encryption enabled | AWS managed |
| ECS task environment | Secrets fetched from AWS Secrets Manager at startup; not stored in task definition | AWS Secrets Manager |
| Docker images | No secrets baked in; `.env` files not committed | Build-time secrets via Docker BuildKit secrets |

### In Transit

| Connection | Protocol | Certificate |
|------------|---------|------------|
| Client ↔ CloudFront/ALB | TLS 1.2+ (policy: TLSv1.2_2021) | ACM wildcard *.medslot.in, auto-renewed |
| ECS tasks ↔ RDS | TLS enforced (ssl=require in DATABASE_URL) | RDS-managed certificate |
| ECS tasks ↔ ElastiCache | TLS enforced | ElastiCache-managed certificate |
| ECS tasks → MSG91/SendGrid/Razorpay | HTTPS enforced in adapter code | Validated CA certificates |

### Field-Level Encryption

Not implemented in v1. PHI protection relies on transport-layer encryption (TLS) and access control (RBAC). Field-level encryption for highest-sensitivity fields (diagnosis, medicines) is a v2 consideration for full HIPAA/DISHA compliance.

---

## Network Security Controls

### WAF (AWS WAF on ALB)

| Rule | Type | Action |
|------|------|--------|
| AWSManagedRulesCommonRuleSet | AWS Managed | Block |
| AWSManagedRulesSQLiRuleSet | AWS Managed | Block |
| OTP endpoint rate rule | Custom: ≥ 200 req/5min/IP on `/api/v1/auth/otp/` | Block for 15 min |
| Webhook IP allowlist | Custom: Razorpay IP range only on `/api/v1/webhooks/razorpay/` | Block others |

### CORS Policy

```python
CORS_ALLOWED_ORIGINS = [
    "https://medslot.in",
    "https://www.medslot.in",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
```

### HTTP Security Headers (Django middleware)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{random}'; ...
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### S3 Security

- All data buckets: Block Public Access enabled (`BlockPublicAcls: true`, `BlockPublicPolicy: true`, `IgnorePublicAcls: true`, `RestrictPublicBuckets: true`)
- All file access via presigned URLs (7-day expiry for prescriptions and health records, 15-minute expiry for upload PUT URLs)
- S3 bucket policy denies any request without SSE-S3 or from outside the VPC endpoint
- ECS task role has minimum IAM permissions: only the specific `s3:PutObject`/`s3:GetObject` operations on its specific bucket ARN prefix

---

## Audit Logging

**Mandatory audit events** (NFR-MAIN-004):

| Action | Trigger | AuditLog.action | Metadata (non-PHI) |
|--------|---------|-----------------|-------------------|
| Prescription issued | Post Prescription.save | `prescription.issued` | appointment_id, doctor_id |
| Health record uploaded | Post HealthRecord.save | `health_record.uploaded` | file_type, file_size_bytes |
| Health record deleted | Post HealthRecord soft-delete | `health_record.deleted` | record_id |
| Doctor account approved | Post DoctorProfile.account_status → Approved | `doctor.approved` | doctor_id, admin_user_id |
| Doctor account rejected | Post DoctorProfile.account_status → Rejected | `doctor.rejected` | doctor_id, admin_user_id, reason_length |
| Doctor account suspended | Post DoctorProfile.account_status → Suspended | `doctor.suspended` | doctor_id, admin_user_id |
| Doctor account reactivated | Post DoctorProfile.account_status → Approved (from Suspended) | `doctor.reactivated` | doctor_id, admin_user_id |
| Consultation opened | Post Appointment status → In_Consultation | `consultation.opened` | appointment_id |
| Invalid Razorpay webhook | Signature validation failure | `webhook.invalid_signature` | remote_ip, payload_size |

**Implementation:** Django `post_save` signals (not `pre_save`) on the relevant models. Signal receivers write to `AuditLog` within the same database transaction. AuditLog records are append-only — no UPDATE or DELETE permitted on the `AuditLog` table (enforced via model `save()` override and RLS if PostgreSQL row-level security is enabled in v2).

**Retention:** AuditLog entries retained for 7 years (regulatory prudence for healthcare audit trails).

**PHI protection in audit logs:** AuditLog.metadata contains only non-PHI context. No diagnosis, medicine names, or patient demographics in any audit log field. Violating this rule is equivalent to a PHI log leak (BR-019).

---

## Compliance Requirements

### Applicable Standards

| Standard | Applicability | Status |
|---------|--------------|--------|
| Indian DISHA (Digital Information Security in Healthcare Act) | Aspirational — not enacted as of Phase 4 (2026) | Foundational controls in place (encryption, access control, audit trail); full compliance review post-enactment |
| Indian IT Act 2000 + SPDI Rules 2011 | Applicable — defines sensitive personal data (health records qualify) | Encryption at rest + in transit satisfied; retention policy defined; no cross-border transfer without consent |
| HIPAA | Not applicable — MedSlot is an Indian platform, not a US-covered entity | N/A |
| PCI-DSS | Not applicable — MedSlot does not process payment card data; Razorpay handles all billing | N/A |

### SPDI Rules 2011 Controls (Indian IT Act)

| Requirement | MedSlot Implementation |
|-------------|----------------------|
| Written privacy policy | Required before launch — to be published at `/privacy-policy` |
| Consent for data collection | OTP registration consent + data collection disclosure on registration form |
| Security safeguards for SPDI (health data) | AES-256 at rest, TLS 1.2+ in transit, RBAC, audit logging |
| Right to withdraw consent / data deletion | Soft delete for health records; account deactivation on request |
| No disclosure to third parties without consent | Razorpay receives only subscription billing data (no health data); SendGrid receives email address + notification text (no PHI); MSG91 receives phone number + OTP only |

---

## OWASP Top 10 Mitigation Table

| Risk | OWASP ID | Status | Specific Mitigation in MedSlot |
|------|----------|--------|---------------------------------|
| Broken Access Control | A01:2021 | ✅ Mitigated | DRF permission classes (IsPatient, IsApprovedDoctor, IsAdmin) on every view; object-level permission `IsAppointmentDoctor` for consultation/prescription endpoints; no client-side access control |
| Cryptographic Failures | A02:2021 | ✅ Mitigated | AES-256 RDS; SSE-S3; TLS 1.2+ everywhere; HS256 JWT with 256-bit secret; OTP hashed with SHA-256 + PEPPER before Redis storage; no MD5/SHA-1 for security purposes |
| Injection | A03:2021 | ✅ Mitigated | Django ORM exclusively — no raw SQL; DRF serializers validate and sanitize all input; parameterized queries are automatic with ORM; JSONB fields validated by serializer before write |
| Insecure Design | A04:2021 | ✅ Mitigated | Security architecture designed in Phase 4 (this document); threat model considered for all flows; no security left to implementation phase; PHI classification complete |
| Security Misconfiguration | A05:2021 | ✅ Mitigated | Django DEBUG=False in production (enforced in settings); all secrets in Secrets Manager; S3 Block Public Access; security headers (HSTS, X-Frame-Options, CSP); no default credentials; ECS task roles scoped to minimum IAM |
| Vulnerable and Outdated Components | A06:2021 | ✅ Mitigated | pip-audit on every CI run (backend); npm audit (frontend); Dependabot security alerts enabled on GitHub; ECR image scanning on push; all dependencies pinned to minor versions |
| Identification and Authentication Failures | A07:2021 | ✅ Mitigated | OTP-only authentication (no passwords — eliminates credential stuffing); rate limiting (5 OTPs/hour/phone); failure lockout (3 failures → 15 min); JWT HS256 with 24h TTL; no hard-coded credentials |
| Software and Data Integrity Failures | A08:2021 | ✅ Mitigated | Razorpay webhook HMAC-SHA256 signature validation (FR-SUB-006, NFR-SEC-009); S3 presigned URL integrity; ECR image tag immutability; CI pipeline signs deployments via GitHub Actions OIDC |
| Security Logging and Monitoring Failures | A09:2021 | ✅ Mitigated | Structured JSON logs (NFR-MAIN-003); AuditLog for PHI-adjacent actions (NFR-MAIN-004); CloudWatch alarms for CRITICAL logs, abnormal auth failure rates, webhook signature failures; CloudWatch log retention 90 days (operational), 7 years (audit) |
| Server-Side Request Forgery (SSRF) | A10:2021 | ✅ Mitigated | No user-controlled URL construction in backend; S3 presigned URLs are generated server-side from validated UUIDs (not user-provided paths); MSG91/SendGrid calls use hardcoded base URLs from environment config; no internal URL fetching from user input |

---

## Secrets Management

| Secret | Location in Secrets Manager | Consumed By | Rotation |
|--------|---------------------------|-------------|---------|
| Django SECRET_KEY | `/medslot/prod/django/secret_key` | medslot-api, medslot-worker, medslot-beat | Manual annual rotation |
| JWT signing secret | `/medslot/prod/django/jwt_secret` | medslot-api | Manual annual rotation |
| Database URL | `/medslot/prod/db/url` | medslot-api, medslot-worker, medslot-beat | Automatic rotation via Secrets Manager + RDS (v2) |
| Redis URL | `/medslot/prod/redis/url` | medslot-api, medslot-worker, medslot-beat | On ElastiCache auth token change |
| MSG91 API key | `/medslot/prod/msg91/api_key` | medslot-api, medslot-worker | Manual on compromise |
| SendGrid API key | `/medslot/prod/sendgrid/api_key` | medslot-worker | Manual on compromise |
| Razorpay API key | `/medslot/prod/razorpay/api_key` | medslot-api | Manual on compromise |
| Razorpay API secret | `/medslot/prod/razorpay/api_secret` | medslot-api | Manual on compromise |
| Razorpay webhook secret | `/medslot/prod/razorpay/webhook_secret` | medslot-api | Manual on key rotation |
| OTP hash pepper | `/medslot/prod/auth/otp_pepper` | medslot-api | Manual annual rotation |

**Rules:**
- No secrets in Dockerfiles, source code, `.env` files committed to Git, or ECS task definition plaintext environment variables
- ECS task execution role has `secretsmanager:GetSecretValue` on the specific secret ARNs for that service only (least privilege)
- Secret values are injected as environment variables at container startup via ECS `secrets` block in the task definition
- All secret reads produce a CloudWatch audit event (Secrets Manager auto-logs GetSecretValue calls to CloudTrail)
