# MedSlot

Healthcare appointment and consultation management platform for the Indian market.

MedSlot enables patients to discover verified doctors by speciality and location, book time-slotted appointments, manage personal health records, and receive digitally generated prescriptions post-consultation. Doctors get a dedicated dashboard to manage availability, conduct consultations, and issue prescriptions delivered as PDFs to patients via email.

---

## Repository Structure

```
medslot/
├── frontend/        Next.js 14 TypeScript App Router application
├── backend/         Django 5 REST API + Celery workers
├── infra/           AWS CDK v2 TypeScript infrastructure stacks
├── .github/
│   └── workflows/   GitHub Actions CI/CD pipelines
├── docker-compose.yml
└── .env.example
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20.x LTS | https://nodejs.org |
| npm | 10.x | Bundled with Node.js |
| Python | 3.12 | https://python.org |
| pip | 24.x | Bundled with Python |
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| AWS CDK CLI | 2.x | `npm install -g aws-cdk` |
| PostgreSQL | 16 | Via Docker (see below) |
| Redis | 7 | Via Docker (see below) |

---

## Quick Start — Full Stack (Docker Compose)

The recommended way to run MedSlot locally. All services start in a single command.

```bash
# 1. Clone the repository
git clone https://github.com/RAGUWING369/MedSlot-Initial-Test.git
cd MedSlot-Initial-Test

# 2. Copy environment template and fill in values
cp .env.example .env.local

# 3. Start all services (API, frontend, Redis, PostgreSQL)
docker-compose up --build

# Services available at:
#   Frontend:  http://localhost:3000
#   API:       http://localhost:8000
#   API docs:  http://localhost:8000/api/schema/
#   Admin:     http://localhost:8000/admin/
```

---

## Frontend Setup (without Docker)

```bash
cd frontend

# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Run unit tests
npm run test

# Run linter
npm run lint

# Type check
npm run type-check

# Production build
npm run build
```

---

## Backend Setup (without Docker)

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate          # macOS/Linux
.venv\Scripts\activate             # Windows

# Install dependencies
pip install -r requirements.txt

# Apply database migrations (requires PostgreSQL running)
python manage.py migrate

# Create admin superuser
python manage.py createsuperuser

# Start development server (port 8000)
python manage.py runserver

# Run tests with coverage (90% minimum)
pytest --cov=. --cov-report=term-missing --cov-fail-under=90

# Run Celery worker
celery -A medslot worker --loglevel=info --concurrency=2

# Run Celery Beat scheduler
celery -A medslot beat --loglevel=info
```

---

## Infrastructure (AWS CDK)

```bash
cd infra

# Install CDK dependencies
npm install

# Synthesize CloudFormation templates (validate)
npx cdk synth

# Deploy to staging
npx cdk deploy MedSlotVpcStack MedSlotRdsStack MedSlotS3Stack MedSlotEcsStack \
  --profile medslot-staging

# Destroy staging environment
npx cdk destroy --all --profile medslot-staging
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all required values before running any service.

Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `SECRET_KEY` | Django secret key (generate a unique value) |
| `JWT_SECRET` | JWT signing secret |
| `MSG91_API_KEY` | MSG91 OTP SMS API key |
| `SENDGRID_API_KEY` | SendGrid email API key |
| `AWS_REGION` | AWS region (ap-south-1) |
| `S3_RECORDS_BUCKET` | S3 bucket for patient health records |
| `S3_PRESCRIPTIONS_BUCKET` | S3 bucket for prescription PDFs |
| `S3_CREDENTIALS_BUCKET` | S3 bucket for doctor credential documents |
| `RAZORPAY_KEY_ID` | Razorpay subscription key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay subscription key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signature secret |

See `.env.example` for the full template with descriptions.

---

## CI/CD

- **CI pipeline** (`.github/workflows/ci.yml`): Triggered on push to `feature/*` and `develop`. Runs lint, type-check, and test (90% coverage gate) for both backend and frontend in parallel.
- **CD pipeline** (`.github/workflows/deploy.yml`): Triggered on merge to `main`. Builds Docker images, pushes to AWS ECR, and triggers ECS rolling update.

CI/CD workflows are configured in TASK-004 and TASK-005.

---

## Django Apps

| App | Responsibility |
|-----|---------------|
| `accounts` | CustomUser, PatientProfile, DoctorProfile, OTP auth, JWT, RBAC permissions |
| `appointments` | AvailabilityCalendar, AppointmentSlot, Appointment, consultation lifecycle |
| `prescriptions` | ConsultationNote, Prescription, WeasyPrint PDF generation, S3 storage |
| `records` | HealthRecord, S3 presigned upload/download |
| `notifications` | SendGrid email tasks, MSG91 SMS, Celery retry logic, Notification audit records |
| `subscriptions` | DoctorSubscription, Razorpay webhook lifecycle management |
| `analytics` | AnalyticsEvent write endpoint and model |
| `audit` | AuditLog model and Django signal receivers |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript 5, Tailwind CSS 3, Zustand 4 |
| Backend | Django 5, Django REST Framework 3.15, Celery, Python 3.12 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| PDF Generation | WeasyPrint 60.x |
| Email | SendGrid |
| SMS / OTP | MSG91 |
| Object Storage | AWS S3 |
| CDN | AWS CloudFront |
| Compute | AWS ECS Fargate (ap-south-1) |
| Infrastructure as Code | AWS CDK v2 (TypeScript) |

---

## Documentation

- Architecture: `docs/design/ARCHITECTURE.md`
- Architecture Decision Records: `docs/design/adrs/`
- Requirements: `docs/requirements/REQUIREMENTS.md`
- UX Design: `docs/ux/USER-JOURNEYS.md`
- Task Backlog: `docs/planning/TASKS.md`

---

## Contributing

Branch strategy: `feature/TASK-XXX-description` → `develop` → `main`

All branches require CI to pass and 1 peer review before merging to `develop`.

Commit convention: [Conventional Commits](https://www.conventionalcommits.org/)
