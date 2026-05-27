# System Architecture — MedSlot

**Phase:** 4 — Architecture
**Version:** 1.0
**Date:** 2026-05-25
**Pattern:** Modular Monolith (ADR-001)
**Evidence Base:** C4 Model (Simon Brown, 2018), 12-Factor App (Wiggins, 2011), Google SRE (Beyer et al., 2016), ISO/IEC 25010:2023

---

## Executive Summary

MedSlot adopts a **Modular Monolith** architectural pattern. The backend is a single Django 5 application with six cohesive internal apps (accounts, appointments, prescriptions, records, notifications, subscriptions), deployed as separate ECS Fargate task definitions. The frontend is a Next.js 14 App Router application. All data persists in a single PostgreSQL 16 RDS instance.

The primary architectural trade-off: a modular monolith trades independent scalability per domain for transactional integrity, operational simplicity, and faster delivery — the right choice for a 3-person team with a 2026-10-31 deadline and a 500 CCU peak NFR that a single 4-task ECS cluster handles with significant headroom.

All prescription-related I/O is asynchronous (Celery + Redis) to decouple heavy WeasyPrint rendering from the HTTP request lifecycle and meet the ≤ 4s P95 PDF NFR. All data is encrypted at rest (AES-256 RDS, SSE-S3 S3) and in transit (TLS 1.2+). PHI never appears in logs.

**Key design principles:** role-based API isolation at the view layer; PHI annotation in all model fields; async-first for heavy I/O; UTC storage with IST display; idempotent Razorpay webhook handling; soft delete for all health data.

---

## NFR-to-Architecture Traceability Matrix

| NFR ID | NFR Statement | Target | Architectural Response | Pattern / Component | ADR |
|--------|--------------|--------|----------------------|---------------------|-----|
| NFR-PE-001 | API P95 latency | ≤ 200ms @ 500 CCU | 2–8 ECS Fargate API tasks (auto-scale at 60% CPU); Redis slot cache (5-min TTL); PostgreSQL composite indexes on hot paths; Django CONN_MAX_AGE=60s | ECS Fargate auto-scaling + Redis cache + index strategy | ADR-005 |
| NFR-PE-002 | Doctor discovery LCP | ≤ 2.5s | Next.js 14 SSR for search page; CloudFront CDN for static assets; composite index on (city, account_status, specialty_id) | Next.js SSR + CloudFront + DB index | ADR-002 |
| NFR-PE-003 | Dashboard LCP | ≤ 3.0s | Next.js App Router CSR for authenticated pages; Zustand client-side state; API responses ≤ 200ms (NFR-PE-001) | Next.js CSR + API performance | ADR-002 |
| NFR-PE-004 | Prescription PDF generation | ≤ 4s P95 (dequeue to S3) | Celery async task on dedicated worker ECS service (0.5 vCPU, 2GB RAM); WeasyPrint renders in isolated process; measured from task dequeue (A-03-005) | Celery + WeasyPrint worker | ADR-006 |
| NFR-PE-005 | Health record upload (≤ 10MB) | ≤ 5s P95 | Client-direct S3 upload via presigned PUT URL (bypasses API for file bytes); only metadata posted to API after upload completes | S3 presigned PUT + metadata POST pattern | ADR-003 |
| NFR-PE-006 | Platform concurrent capacity | 500 CCU no degradation | ECS auto-scaling: 2 min tasks → 8 max at 60% CPU; db.t3.medium PostgreSQL (200 max connections, 60 typical at 500 CCU); cache.t3.micro Redis (10,000 ops/s capacity vs ~150 ops/s peak) | ECS + RDS + ElastiCache sizing | ADR-005 |
| NFR-REL-001 | Platform availability | ≥ 99.9%/month | ECS minimum 2 tasks per service (AZ spread); RDS Multi-AZ with automatic failover (<2 min); ElastiCache Multi-AZ replica; ALB health checks with 30s unhealthy threshold | ECS Multi-AZ + RDS Multi-AZ | ADR-005 |
| NFR-REL-002 | RTO | ≤ 1 hour | RDS Multi-AZ automatic failover ≤ 2 min; ECS service auto-recovery on task failure ≤ 5 min; runbook for full ECS re-deploy ≤ 30 min | RDS Multi-AZ + ECS auto-recovery | ADR-003, ADR-005 |
| NFR-REL-003 | RPO | ≤ 30 minutes | RDS automated PITR (30-minute granularity); S3 is durable by design (11 nines); Redis is ephemeral (acceptable — OTP and cache are transient data) | RDS PITR | ADR-003 |
| NFR-REL-004 | Email retry | 3× with exponential backoff | Celery task retry: `autoretry_for=(SendGridException,)`, `max_retries=3`, backoff 60s/300s/1800s | Celery retry + SendGrid | ADR-002 |
| NFR-REL-005 | PDF generation failure | Retry once; ops alert on final failure | Celery `max_retries=1`; on final failure: CRITICAL log entry + Prescription.pdf_status='failed'; CloudWatch alarm on CRITICAL log events | Celery retry + CloudWatch alarm | ADR-006 |
| NFR-SEC-001 | TLS 1.2+ in transit | All endpoints | CloudFront + ALB TLS policy: TLSv1.2_2021 (minimum TLS 1.2, prefer 1.3); ACM certificate for medslot.in | CloudFront + ALB TLS policy | — |
| NFR-SEC-002 | RDS AES-256 at rest | All RDS data | AWS RDS encryption enabled at provisioning (KMS-managed); AES-256 for all database data | RDS encryption | ADR-003 |
| NFR-SEC-003 | S3 SSE-S3 at rest | All S3 objects | S3 bucket default encryption: SSE-S3 (AES-256); enforced via bucket policy denying unencrypted uploads | S3 SSE-S3 | — |
| NFR-SEC-004 | SMS OTP only | No password/social | CustomUser model has no password field; no OAuth integration; JWT issued only after OTP verification | CustomUser design + JWT | ADR-004 |
| NFR-SEC-005 | RBAC — 3 roles | Patient, Doctor, Admin | DRF permission classes: IsPatient, IsApprovedDoctor, IsAdmin — applied at view level, never client-side | DRF permission classes | ADR-004 |
| NFR-SEC-006 | JWT 24h TTL | 24-hour expiry | simplejwt: ACCESS_TOKEN_LIFETIME=timedelta(hours=24) | simplejwt config | ADR-004 |
| NFR-SEC-007 | OTP rate limit | 5 per phone per 60 min | Redis key `otp_rate:{phone}` with 60-min TTL, counter ≤ 5; returns 429 on excess | Redis rate limiting | ADR-004 |
| NFR-SEC-008 | S3 block public access, pre-signed only | All health/Rx S3 buckets | S3 Block Public Access enabled on all data buckets; no public bucket policies; all access via presigned URL from API | S3 bucket policy | — |
| NFR-SEC-009 | Razorpay HMAC-SHA256 webhook validation | All webhooks | DRF view validates `X-Razorpay-Signature` before any state change; invalid signature returns 400 and raises CRITICAL log | Webhook validation middleware | ADR-004 |
| NFR-SEC-010 | Django ORM + DRF serializer validation | All inputs | Django ORM used exclusively (no raw SQL); DRF serializers validate and sanitize all request inputs before service layer | Django ORM + DRF serializers | — |
| NFR-SEC-011 | Zero PHI in logs | No plaintext PHI | Custom LogFilter redacts any field annotated `# PHI` in model definitions; python-json-logger structured output; PHI annotation scanning in CI | LogFilter + # PHI convention | — |
| NFR-USE-001 | Booking flow ≤ 2 min P50 | End-to-end for new patient | SSR search page (fast initial load); minimal 3-step booking flow (search → profile → confirm); Redis slot cache eliminates DB roundtrip on slot display | SSR + Redis slot cache + minimal flow | — |
| NFR-USE-002 | WCAG 2.1 AA | All public pages | Axe automated scan in CI (Phase 9); manual audit in Phase 5 UX; semantic HTML with aria-label conventions in design system | Axe CI + design system | — |
| NFR-USE-003 | Browser matrix | Chrome/FF/Safari/Edge latest | Next.js 14 targets ES2017+; PostCSS/Tailwind provide cross-browser CSS; BrowserStack testing in CI (Phase 9) | Next.js build target | — |
| NFR-USE-004 | 375px minimum width | Responsive | Tailwind desktop-first: base = 1280px; sm: (768px); mobile: (375px); tested at all three breakpoints | Tailwind responsive | — |
| NFR-USE-005 | Inline form validation | All forms | React Hook Form + Zod (frontend); DRF serializer errors (backend); field-level error display without page reload | RHF + Zod + DRF | — |
| NFR-MAIN-001 | 90% test coverage | Backend + frontend | pytest-cov (backend); Vitest v8 coverage (frontend); coverage gate in GitHub Actions CI (fails if < 90%) | CI coverage gate | ADR-002 |
| NFR-MAIN-002 | OpenAPI 3.0 spec | /api/schema/ | drf-spectacular auto-generates from DRF views; `GET /api/schema/` returns OpenAPI 3.0 YAML | drf-spectacular | ADR-002 |
| NFR-MAIN-003 | Structured JSON logs | All services | python-json-logger; custom RequestIdMiddleware injects request_id; user_id hashed with SHA-256 before logging | python-json-logger + middleware | — |
| NFR-MAIN-004 | PHI audit trail | Prescription, records, admin actions | AuditLog model; Django signals on post_save for Prescription, HealthRecord, DoctorProfile status changes | Django signals + AuditLog | — |
| NFR-MAIN-005 | # PHI annotations | All PHI model fields | `# PHI` inline comment on all model fields; flake8 custom plugin scans for unannotated text/varchar fields in sensitive models | flake8 plugin + code review | — |
| NFR-COMPAT-001 | REST /api/v1/ | Versioned API | All Django URL patterns under `/api/v1/`; version in URL path | Django URL config | — |
| NFR-COMPAT-002 | snake_case JSON | All request/response bodies | DRF default serializer output is snake_case (Python convention); no camelCase conversion configured | DRF default | — |
| NFR-COMPAT-003 | MSG91 OTP API v5 | OTP delivery | Custom MSG91Adapter class wraps v5 REST API | MSG91Adapter | — |
| NFR-COMPAT-004 | SendGrid Mail Send v3 | Email delivery | sendgrid-python SDK v3 | sendgrid SDK | — |
| NFR-COMPAT-005 | Razorpay Subscriptions API | Subscription billing | razorpay-python SDK | razorpay SDK | — |
| NFR-PORT-001 | OCI containers | All services | Dockerfiles for backend, frontend, worker (same backend image, different CMD) | Docker | ADR-005 |
| NFR-PORT-002 | ECS Fargate ap-south-1 | Deployment | ECS service definitions in ap-south-1; CDK deployment stack | ECS + CDK | ADR-005 |
| NFR-PORT-003 | AWS RDS PostgreSQL 16 | Database | RDS provisioned via CDK L2 construct | CDK + RDS | ADR-003 |

---

## System Context Diagram (C4 Level 1)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                   │
│   Patient (Priya)          Doctor (Dr. Arjun)          MedSlot Admin             │
│   Urban Indian adult,       MBBS+ registered             MedSlot Ops staff,       │
│   22–55, web browser        practitioner, web browser    web browser              │
│         │                        │                            │                   │
│         │  HTTPS (TLS 1.2+)      │  HTTPS (TLS 1.2+)         │  HTTPS (TLS 1.2+) │
│         │  Registers, searches,  │  Registers, manages       │  Verifies doctors, │
│         │  books, views Rx        │  calendar, consults,      │  manages accounts  │
│         │                        │  issues prescriptions     │                   │
│         └────────────┬───────────┘                            │                   │
│                      │                                        │                   │
│              ┌───────▼────────────────────────────────────────▼──────┐           │
│              │                   MedSlot Platform                      │           │
│              │   (Next.js 14 frontend + Django 5 API + Celery workers) │           │
│              └─────┬──────────────┬───────────────┬────────────┬──────┘           │
│                    │              │               │            │                   │
│                    │              │               │            │                   │
│              ┌─────▼──┐    ┌──────▼───┐   ┌──────▼───┐  ┌────▼────┐             │
│              │ MSG91  │    │SendGrid  │   │Razorpay  │  │AWS S3+  │             │
│              │OTP SMS │    │Email v3  │   │Subscript.│  │CloudFront│            │
│              │delivery│    │delivery  │   │Webhooks  │  │CDN+Files │            │
│              │outbound│    │outbound  │   │bi-direct.│  │bi-direct.│            │
│              └────────┘    └──────────┘   └──────────┘  └─────────┘             │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Container Diagram (C4 Level 2)

```
┌─────────────────────────────────── MedSlot Platform (AWS VPC ap-south-1) ──────────────────────────────────┐
│                                                                                                              │
│  ┌──────────────────────────────── Public Subnet ─────────────────────────────────┐                        │
│  │                                                                                  │                        │
│  │   ┌─────────────────────────────────────────────────────────────────────────┐   │                        │
│  │   │          Application Load Balancer (ALB)                                │   │                        │
│  │   │   HTTPS 443 → /api/* → API service  |  /* → Frontend service            │   │                        │
│  │   │   /admin/* → API service  |  /webhooks/* → API service                  │   │                        │
│  │   └────────────────────────────────┬────────────────────────────────────────┘   │                        │
│  │                                    │                                             │                        │
│  └────────────────────────────────────┼─────────────────────────────────────────────┘                        │
│                                       │                                                                      │
│  ┌──────────────────────────── Private Subnet ─────────────────────────────────────┐                        │
│  │                                    │                                             │                        │
│  │  ┌─────────────────────────────────┴──────────────────────────────────────────┐  │                        │
│  │  │  medslot-frontend (ECS Fargate)                                            │  │                        │
│  │  │  Next.js 14 · TypeScript 5 · Tailwind CSS · Zustand                       │  │                        │
│  │  │  port 3000 · 2–4 tasks · 0.5 vCPU / 1GB RAM                               │  │                        │
│  │  │  SSR: doctor discovery pages   CSR: patient/doctor dashboards              │  │                        │
│  │  └────────────────────────────────────────────────────────────────────────────┘  │                        │
│  │                                    │  HTTPS /api/v1/*                            │                        │
│  │  ┌─────────────────────────────────▼──────────────────────────────────────────┐  │                        │
│  │  │  medslot-api (ECS Fargate)                                                 │  │                        │
│  │  │  Django 5 · DRF 3.15 · Python 3.12 · Gunicorn                             │  │                        │
│  │  │  port 8000 · 2–8 tasks · 0.5 vCPU / 1GB RAM · auto-scale CPU 60%         │  │                        │
│  │  │  Apps: accounts/ appointments/ prescriptions/ records/                     │  │                        │
│  │  │        notifications/ subscriptions/ analytics/ audit/                     │  │                        │
│  │  └──────────────────────┬──────────────────────────┬──────────────────────────┘  │                        │
│  │                         │  enqueue tasks            │  R/W                        │                        │
│  │  ┌──────────────────────▼──────────┐  ┌────────────▼──────────────────────────┐  │                        │
│  │  │  medslot-worker (ECS Fargate)   │  │  PostgreSQL 16 (AWS RDS Multi-AZ)    │  │                        │
│  │  │  Celery Worker · Python 3.12    │  │  db.t3.medium · 50GB gp3              │  │                        │
│  │  │  1–4 tasks · 0.5 vCPU / 2GB RAM│  │  Private subnet · isolated SG         │  │                        │
│  │  │  Tasks: PDF gen, email, SMS     │  │  Encryption: AES-256 KMS              │  │                        │
│  │  └──────────────────────┬──────────┘  └────────────────────────────────────────┘  │                        │
│  │                         │                                                          │                        │
│  │  ┌──────────────────────▼──────────┐  ┌────────────────────────────────────────┐  │                        │
│  │  │  medslot-beat (ECS Fargate)     │  │  Redis 7 (AWS ElastiCache Multi-AZ)   │  │                        │
│  │  │  Celery Beat · Python 3.12      │  │  cache.t3.micro · Celery broker        │  │                        │
│  │  │  1 task · 0.25 vCPU / 0.5GB RAM│  │  OTP rate limiting · slot availability │  │                        │
│  │  │  Schedules: slot regen, reminder│  └────────────────────────────────────────┘  │                        │
│  │  └─────────────────────────────────┘                                              │                        │
│  │                                                                                    │                        │
│  └────────────────────────────────────────────────────────────────────────────────────┘                        │
│                                                                                                                │
│  ┌──────────────────────────── AWS Services (outside VPC) ─────────────────────────┐                          │
│  │  AWS S3 (medslot-records, medslot-prescriptions, medslot-credentials)           │                          │
│  │  AWS CloudFront (static assets CDN)                                             │                          │
│  │  AWS Secrets Manager (all application secrets)                                  │                          │
│  │  AWS CloudWatch (logs + metrics + alarms)                                       │                          │
│  │  AWS ECR (Docker image registry)                                                │                          │
│  └──────────────────────────────────────────────────────────────────────────────────┘                          │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

External:  MSG91 (OTP SMS) · SendGrid (Email) · Razorpay Subscriptions (Webhooks)
```

---

## Component Diagrams (C4 Level 3)

### Django API — Layered Architecture (all apps follow this pattern)

```
┌──────────────────────────────────────── medslot-api ────────────────────────────────────────────┐
│                                                                                                   │
│  ┌─────────────── Entry Point Layer (DRF Views / ViewSets) ────────────────────────────────────┐ │
│  │  PatientViewSet  DoctorViewSet  AppointmentViewSet  ConsultationViewSet                       │ │
│  │  PrescriptionViewSet  HealthRecordViewSet  SubscriptionViewSet  AnalyticsEventView            │ │
│  │  AdminDoctorViewSet  WebhookView (Razorpay)                                                   │ │
│  │  → validates request · enforces permissions · delegates to services · serializes response     │ │
│  └──────────────────────────────────┬──────────────────────────────────────────────────────────┘ │
│                                     │ calls                                                       │
│  ┌─────────────── Application (Service) Layer ──────────────────────────────────────────────────┐ │
│  │  OTPService       AuthService        DoctorRegistrationService   PatientProfileService        │ │
│  │  SlotGenerationService  AppointmentBookingService  CancellationService                        │ │
│  │  ConsultationService    PrescriptionService        HealthRecordService                        │ │
│  │  SubscriptionService    NotificationService        AuditService                               │ │
│  │  → orchestrates domain logic · wraps transactions · triggers Celery tasks                     │ │
│  └──────────────────────────────────┬──────────────────────────────────────────────────────────┘ │
│                                     │ calls                                                       │
│  ┌─────────────── Domain / Model Layer ─────────────────────────────────────────────────────────┐ │
│  │  CustomUser · PatientProfile · DoctorProfile · Specialty · DoctorSubscription                 │ │
│  │  AvailabilityCalendar · BlockedDate · AppointmentSlot · Appointment                           │ │
│  │  ConsultationNote · Prescription · HealthRecord · AuditLog · Notification · AnalyticsEvent   │ │
│  │  → Django ORM models · business rule validators · state machine transitions                   │ │
│  └──────────────────────────────────┬──────────────────────────────────────────────────────────┘ │
│                                     │ calls                                                       │
│  ┌─────────────── Infrastructure / Adapter Layer ───────────────────────────────────────────────┐ │
│  │  PostgreSQLRepository (Django ORM)   RedisCache (django-redis)                                │ │
│  │  MSG91Adapter                        SendGridAdapter                                          │ │
│  │  S3Adapter (boto3)                   RazorpayAdapter (razorpay SDK)                           │ │
│  │  SecretsManagerAdapter               AuditLogRepository                                       │ │
│  │  → wraps all external I/O · never called directly by domain layer                             │ │
│  └───────────────────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Accounts App — Component Detail

```
accounts/
├── views.py          OTPRequestView, OTPVerifyView, PatientProfileView, DoctorRegistrationView
├── serializers.py    OTPRequestSerializer, OTPVerifySerializer, PatientProfileSerializer,
│                     DoctorRegistrationSerializer
├── services.py       OTPService (generate, verify, rate-limit), AuthService (JWT issuance),
│                     PatientProfileService, DoctorRegistrationService
├── models.py         CustomUser, PatientProfile, DoctorProfile, Specialty
├── permissions.py    IsPatient, IsApprovedDoctor, IsAdmin, IsApprovedOrTrialDoctor
├── adapters.py       MSG91Adapter (OTP delivery)
└── tasks.py          send_otp_sms (Celery), send_registration_notification_email (Celery)
```

### Appointments App — Component Detail

```
appointments/
├── views.py          SlotListView, AppointmentCreateView, PatientAppointmentListView,
│                     DoctorTodayView, DoctorUpcomingView, CancellationView, NoShowView
├── serializers.py    SlotSerializer, AppointmentSerializer, AppointmentCreateSerializer
├── services.py       SlotGenerationService, AppointmentBookingService, CancellationService,
│                     NoShowService
├── models.py         AvailabilityCalendar, BlockedDate, AppointmentSlot, Appointment
└── tasks.py          regenerate_all_slots (Celery Beat — daily midnight IST),
                      send_appointment_reminders (Celery Beat — hourly check)
```

### Prescriptions App — Component Detail

```
prescriptions/
├── views.py          ConsultationStartView, ConsultationNoteView, PrescriptionCreateView,
│                     PrescriptionDownloadView
├── serializers.py    ConsultationNoteSerializer, PrescriptionSerializer, MedicineSerializer
├── services.py       ConsultationService, PrescriptionService, PDFGenerationService
├── models.py         ConsultationNote, Prescription
├── adapters.py       S3Adapter (PDF upload), SendGridAdapter (prescription delivery email)
├── templates/        prescription_template.html (WeasyPrint HTML template)
└── tasks.py          generate_prescription_pdf (Celery), send_prescription_email (Celery)
```

### Notification App — Celery Task Map

```
notifications/
├── tasks.py
│   ├── send_booking_confirmation_email(appointment_id)   [triggered: post appointment create]
│   ├── send_booking_notification_to_doctor(appt_id)     [triggered: post appointment create]
│   ├── send_cancellation_email(appointment_id, cancelled_by)   [triggered: post cancellation]
│   ├── send_appointment_reminders()                      [Celery Beat: hourly, finds T-24h]
│   └── send_doctor_status_email(doctor_id, new_status)  [triggered: post admin action]
├── models.py         Notification (audit record of all dispatches)
└── adapters.py       SendGridAdapter (email), MSG91Adapter (SMS)
```

---

## Infrastructure Architecture

### VPC Design (ap-south-1)

```
VPC: 10.0.0.0/16

Public Subnets (ALB, NAT Gateway):
  ap-south-1a: 10.0.0.0/24
  ap-south-1b: 10.0.1.0/24

Private Subnets (ECS Tasks, ElastiCache):
  ap-south-1a: 10.0.10.0/24
  ap-south-1b: 10.0.11.0/24

Isolated Subnets (RDS):
  ap-south-1a: 10.0.20.0/24
  ap-south-1b: 10.0.21.0/24
```

### Security Groups

| Security Group | Inbound | Outbound |
|---------------|---------|---------|
| ALB-SG | 443 from 0.0.0.0/0; 80 from 0.0.0.0/0 (HTTP→HTTPS redirect) | 8000 to ECS-API-SG; 3000 to ECS-FE-SG |
| ECS-API-SG | 8000 from ALB-SG | 5432 to RDS-SG; 6379 to Redis-SG; 443 to 0.0.0.0/0 (outbound API calls via NAT) |
| ECS-FE-SG | 3000 from ALB-SG | 443 to 0.0.0.0/0 (Next.js SSR API calls via NAT) |
| ECS-Worker-SG | None from internet | 5432 to RDS-SG; 6379 to Redis-SG; 443 to 0.0.0.0/0 (S3, SendGrid, MSG91 via NAT) |
| RDS-SG | 5432 from ECS-API-SG; 5432 from ECS-Worker-SG | None |
| Redis-SG | 6379 from ECS-API-SG; 6379 from ECS-Worker-SG; 6379 from ECS-Worker-SG | None |

### ECS Services Summary

| Service | Image | Command | Min | Max | vCPU | RAM | Scale Trigger |
|---------|-------|---------|-----|-----|------|-----|--------------|
| medslot-api | backend:latest | gunicorn medslot.wsgi | 2 | 8 | 0.5 | 1GB | CPU ≥ 60% for 2 min |
| medslot-frontend | frontend:latest | node server.js | 2 | 4 | 0.5 | 1GB | CPU ≥ 60% for 2 min |
| medslot-worker | backend:latest | celery -A medslot worker | 1 | 4 | 0.5 | 2GB | Queue depth ≥ 20 tasks |
| medslot-beat | backend:latest | celery -A medslot beat | 1 | 1 | 0.25 | 0.5GB | None (singleton) |

### AWS Services Configuration

| Service | Config | NFR Addressed |
|---------|--------|---------------|
| RDS PostgreSQL 16 | db.t3.medium, Multi-AZ, 50GB gp3 + auto-scale, PITR 30-min | NFR-REL-002, NFR-REL-003, NFR-SEC-002 |
| ElastiCache Redis 7 | cache.t3.micro, Multi-AZ replica | NFR-PE-001, NFR-REL-001 |
| ALB | HTTPS listener (443), HTTP→HTTPS redirect, path-based routing | NFR-SEC-001 |
| ACM | *.medslot.in wildcard certificate, auto-renewal | NFR-SEC-001 |
| CloudFront | Static assets distribution; HTTPS-only; TTL 86400s static, 0s API | NFR-PE-002 |
| S3 | 3 private buckets (records, prescriptions, credentials); SSE-S3; Block Public Access | NFR-SEC-003, NFR-SEC-008 |
| Secrets Manager | All secrets; ECS task role access via IAM; no static credentials | NFR-SEC-011 |
| CloudWatch | ECS Container Insights; RDS metrics; custom alarm: PDF CRITICAL, CPU > 80%, RDS connections > 150 | NFR-REL-001, NFR-REL-005 |
| ECR | ap-south-1; image scanning on push; tag immutability | NFR-PORT-001 |
| WAF | WebACL on ALB; AWS managed rule: AWSManagedRulesCommonRuleSet; rate rule on /api/v1/auth/ (200 req/5min/IP) | NFR-SEC-001 |

---

## Capacity Planning Validation

| Component | NFR Load Target | Proposed Config | Estimated Capacity | Headroom | Action if Insufficient |
|-----------|----------------|-----------------|-------------------|----------|----------------------|
| medslot-api | 500 CCU, P95 ≤ 200ms | 2 min → 8 max tasks, 0.5 vCPU/1GB each | Each Gunicorn task: ~100–150 req/s; 2 tasks = ~250 req/s; 500 CCU ≈ 50 req/s (0.1 req/s/user) | 5× headroom at 2 tasks; 16× at max 8 | Add 2 more max tasks; upgrade to 1 vCPU/2GB if CPU-bound |
| medslot-frontend | 500 CCU | 2 min → 4 max tasks | Next.js SSR ~50 req/s/task; 2 tasks = 100 req/s; SSR hits only on first load | 2× at 2 tasks | Scale to 4 tasks; most interactions are CSR after initial load |
| medslot-worker | 50 prescription PDFs/hour (est. launch) | 1 min → 4 max tasks; queue depth trigger | Each worker handles ~2 PDFs/min (30s/PDF); 1 task = 120 PDFs/hour | 2.4× at 1 task | Scale on queue depth; max 4 tasks = 480 PDFs/hour |
| RDS PostgreSQL | 200 max connections; 500 CCU | db.t3.medium; CONN_MAX_AGE=60s | 8 API tasks × 4 Gunicorn workers × 1 connection = 32 active connections at max scale; well below 200 | 6× headroom | Add PgBouncer transaction pooling if connections approach 150; upgrade to db.t3.large if CPU-bound |
| ElastiCache Redis | OTP rate limiting + slot cache | cache.t3.micro | Rated 10,000 ops/sec; peak ~150 ops/s (500 CCU × 0.3 Redis ops/req) | 67× headroom | No action needed at v1 scale |
| S3 uploads | 10MB uploads < 5s | Direct S3 PUT presigned URL (client→S3) | S3 multipart: 10MB in ~1–2s on Indian broadband; S3 sustained throughput is unlimited | — | Client-direct upload bypasses API; no bottleneck at API layer |

**Auto-scaling trigger definitions (Phase 13 input):**

| Service | Scale-Out Trigger | Scale-In Trigger | Cooldown |
|---------|------------------|-----------------|---------|
| medslot-api | CPU ≥ 60% for 2 min | CPU ≤ 30% for 5 min | 3 min |
| medslot-frontend | CPU ≥ 60% for 2 min | CPU ≤ 30% for 5 min | 3 min |
| medslot-worker | Celery queue depth ≥ 20 unacked | Queue depth ≤ 5 for 5 min | 5 min |

---

## Key Architectural Principles

1. **Role isolation at the view layer.** Every API endpoint is protected by a specific DRF permission class (IsPatient, IsApprovedDoctor, IsAdmin). Generic `IsAuthenticated` is never used where a role-specific check is required.

2. **PHI never leaves MedSlot infrastructure in raw form.** No third-party analytics SDK receives event data. No PHI appears in application logs. Every Django model field containing PHI is annotated with `# PHI`.

3. **Async for heavy I/O, sync for business logic.** PDF generation and email dispatch run in Celery workers. Appointment booking, consultation notes, and subscription webhooks run synchronously within atomic database transactions.

4. **Single source of truth per domain.** Each Django app owns its models. Cross-app data access goes through the service layer, never via direct cross-app model imports or raw SQL joins.

5. **Idempotent external integrations.** Razorpay webhooks are deduplicated via `ProcessedWebhookEvent`. S3 uploads use UUID keys (never overwrite). Celery tasks use appointment/prescription IDs as idempotency keys.

6. **UTC in the database, IST in the application.** All timestamps stored as UTC TIMESTAMPTZ. IST conversion happens at the serializer layer before client display. All scheduled jobs (slot regeneration at midnight IST, 24h reminder scan) specify their timezone explicitly.

7. **Infrastructure as Code, no manual changes.** All AWS resources are provisioned via AWS CDK. Manual console changes to VPC, security groups, or RDS are prohibited in production.

8. **Secrets never in code or images.** All API keys, database credentials, and JWT secrets are in AWS Secrets Manager. ECS task roles have IAM permission to read their specific secrets. No `.env` files are committed to the repository.

9. **Soft delete for all PHI-bearing records.** Health records, patient profiles, and prescriptions are never hard-deleted. Soft delete (`is_deleted=true`) preserves the 10-year retention requirement while removing records from user-visible queries.

10. **Fail loudly on security violations.** Invalid Razorpay webhook signatures log CRITICAL and return 400. PHI detected in logs triggers an alert. Prescription generation failures log CRITICAL and create an ops alert entry — they are never silently dropped.
