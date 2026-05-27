# API Specification — MedSlot

**Phase:** 4 — Architecture
**Version:** 1.0
**Date:** 2026-05-25
**Standard:** OpenAPI 3.0 style (auto-generated from DRF via drf-spectacular at `/api/schema/`)
**Base URL:** `https://medslot.in/api/v1`
**Format:** All request/response bodies use JSON with `snake_case` field names (NFR-COMPAT-002)

---

## Conventions

### Authentication
All endpoints except those marked `[PUBLIC]` require:
```
Authorization: Bearer <jwt_access_token>
```
JWT contains: `sub` (user_uuid), `role` (patient|doctor|admin), `exp` (Unix timestamp).

### Error Response Format
All errors follow this structure:
```json
{
  "error": "string",
  "detail": "string | object",
  "code": "string"
}
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 202 | Accepted (async operation initiated) |
| 204 | No Content |
| 400 | Bad Request — validation error |
| 401 | Unauthorized — missing or invalid JWT |
| 403 | Forbidden — valid JWT but insufficient role/permission |
| 404 | Not Found |
| 409 | Conflict — business rule violation (duplicate booking, wrong status) |
| 429 | Too Many Requests — rate limit exceeded |
| 500 | Internal Server Error |

### Pagination
List endpoints return paginated responses:
```json
{
  "count": 42,
  "next": "https://medslot.in/api/v1/resource/?page=3",
  "previous": "https://medslot.in/api/v1/resource/?page=1",
  "results": [...]
}
```
Default page size: 20. Max page size: 100.

### Rate Limiting
| Endpoint Group | Limit |
|---------------|-------|
| `POST /auth/otp/request/` | 5 per phone per 60 min (Redis-enforced, FR-AUTH-006) |
| All authenticated endpoints | 1000 req/min per user (ALB + WAF) |
| `POST /analytics/events/` | 60 req/min per IP (unauthenticated) |

---

## 1. Authentication

### POST `/auth/otp/request/` [PUBLIC]
Request an OTP for login or registration.

**Request:**
```json
{
  "phone": "+919876543210",
  "role_intent": "patient"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| phone | string | YES | E.164 format; Indian mobile (+91 prefix) |
| role_intent | string | YES | `"patient"` or `"doctor"` |

**Response 200:**
```json
{
  "message": "OTP sent",
  "expires_in": 300
}
```

**Response 429:**
```json
{
  "error": "rate_limit_exceeded",
  "detail": "Maximum 5 OTP requests per 60 minutes",
  "retry_after": 3421
}
```

---

### POST `/auth/otp/verify/` [PUBLIC]
Verify the OTP and receive a JWT.

**Request:**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Response 200:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "role": "patient",
  "is_new_user": true,
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response 400:**
```json
{
  "error": "invalid_otp",
  "detail": "OTP is invalid or has expired",
  "attempts_remaining": 2
}
```

**Response 429 (lockout):**
```json
{
  "error": "account_locked",
  "detail": "Too many failed attempts. Try again after the lockout expires.",
  "locked_until": "2026-05-25T11:30:00Z"
}
```

---

### POST `/auth/logout/` [Authenticated: Any role]
Client-side JWT invalidation (JWT is stateless; this endpoint logs the event).

**Response 204:** No content.

---

## 2. Patient Profile

### GET `/patients/profile/` [Authenticated: Patient]
Get own profile.

**Response 200:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Priya Sharma",
  "date_of_birth": "1990-03-15",
  "gender": "Female",
  "email": "priya@example.com",
  "phone": "+919876543210",
  "created_at": "2026-05-25T10:00:00Z"
}
```

---

### POST `/patients/profile/` [Authenticated: Patient — new users only]
Create patient profile after first OTP verification.

**Request:**
```json
{
  "name": "Priya Sharma",
  "date_of_birth": "1990-03-15",
  "gender": "Female",
  "email": "priya@example.com"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| name | string | YES | max 255 chars |
| date_of_birth | date | YES | YYYY-MM-DD; must be in the past |
| gender | string | YES | `"Male"`, `"Female"`, or `"Other"` |
| email | string | YES | RFC 5322 format |

**Response 201:** Same as GET `/patients/profile/`

**Response 400:**
```json
{
  "error": "validation_error",
  "detail": {
    "email": ["Enter a valid email address."]
  }
}
```

---

### PATCH `/patients/profile/` [Authenticated: Patient]
Update own profile (partial update).

**Request:** Any subset of profile fields (excluding `phone`).

**Response 200:** Updated profile.

---

## 3. Doctor Registration

### POST `/doctors/register/` [PUBLIC]
Doctor self-registration form submission. Expects `multipart/form-data` for credential file upload.

**Request (multipart/form-data):**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| name | string | YES | max 255 chars |
| phone | string | YES | E.164 Indian mobile |
| specialty_id | UUID | YES | Must exist in Specialty table |
| mci_number | string | YES | max 50 chars; unique |
| clinic_name | string | YES | max 255 chars |
| area | string | YES | max 255 chars |
| city | string | YES | max 100 chars |
| credential_document | file | YES | PDF or image; ≤ 10MB |
| otp | string | YES | 6-digit OTP for phone verification |

**Response 201:**
```json
{
  "message": "Application submitted. You will be notified within 48 hours.",
  "doctor_id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "Pending"
}
```

**Response 400:**
```json
{
  "error": "validation_error",
  "detail": {
    "credential_document": ["File size must not exceed 10MB."],
    "mci_number": ["This MCI number is already registered."]
  }
}
```

---

### GET `/doctors/profile/` [Authenticated: Doctor]
Get own profile.

**Response 200:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Dr. Arjun Mehta",
  "specialty": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "name": "Cardiologist"
  },
  "mci_number": "MH123456",
  "clinic_name": "Mehta Heart Clinic",
  "area": "Banjara Hills",
  "city": "Hyderabad",
  "bio": "20 years experience in interventional cardiology.",
  "account_status": "Approved",
  "subscription_status": "Trial",
  "trial_expiry": "2026-06-24T00:00:00Z"
}
```

---

### PATCH `/doctors/profile/` [Authenticated: Approved Doctor]
Update own profile. `mci_number` and `specialty_id` are read-only; returns 403 if attempted.

**Request:** Any subset of: `clinic_name`, `area`, `city`, `bio`

**Response 200:** Updated profile.

---

## 4. Doctor Discovery (Public)

### GET `/doctors/` [PUBLIC]
Search and list approved doctors.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| specialty_id | UUID | NO | Filter by specialty |
| city | string | NO | Case-insensitive city match |
| page | int | NO | Pagination page number |

At least one of `specialty_id` or `city` must be provided.

**Response 200:**
```json
{
  "count": 12,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Dr. Arjun Mehta",
      "specialty": {"id": "...", "name": "Cardiologist"},
      "clinic_name": "Mehta Heart Clinic",
      "area": "Banjara Hills",
      "city": "Hyderabad",
      "next_available_date": "2026-06-01"
    }
  ]
}
```

---

### GET `/doctors/{doctor_id}/` [PUBLIC]
Get a doctor's public profile with available slots (next 7 days).

**Path Parameter:** `doctor_id` — UUID

**Response 200:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Dr. Arjun Mehta",
  "specialty": {"id": "...", "name": "Cardiologist"},
  "mci_verified": true,
  "clinic_name": "Mehta Heart Clinic",
  "area": "Banjara Hills",
  "city": "Hyderabad",
  "bio": "20 years experience...",
  "available_slots": [
    {
      "slot_id": "880e8400-e29b-41d4-a716-446655440003",
      "date": "2026-06-01",
      "start_time": "09:00",
      "end_time": "09:30"
    }
  ]
}
```

---

### GET `/specialties/` [PUBLIC]
List all active specialties.

**Response 200:**
```json
[
  {"id": "...", "name": "Cardiologist"},
  {"id": "...", "name": "Dermatologist"}
]
```

---

## 5. Availability Calendar (Doctor)

### GET `/doctor/availability/` [Authenticated: Approved Doctor]
Get own calendar configuration.

**Response 200:**
```json
{
  "id": "...",
  "working_days": {
    "mon": {"start": "09:00", "end": "13:00"},
    "tue": {"start": "09:00", "end": "13:00"},
    "wed": {"start": "09:00", "end": "13:00"},
    "fri": {"start": "14:00", "end": "18:00"}
  },
  "slot_duration_minutes": 30,
  "updated_at": "2026-05-20T10:00:00Z"
}
```

---

### PUT `/doctor/availability/` [Authenticated: Approved Doctor]
Save (create or replace) calendar configuration.

**Request:**
```json
{
  "working_days": {
    "mon": {"start": "09:00", "end": "13:00"},
    "fri": {"start": "14:00", "end": "18:00"}
  },
  "slot_duration_minutes": 30
}
```

| Field | Validation |
|-------|-----------|
| working_days | Each day key: "mon"–"sun"; start < end; time format HH:MM |
| slot_duration_minutes | Must be 15, 30, 45, or 60 |

**Response 200:**
```json
{
  "message": "Availability saved. 8 slots per working day for the next 30 days.",
  "slots_generated": 160
}
```

**Response 400:**
```json
{
  "error": "validation_error",
  "detail": {
    "working_days.mon": ["End time must be after start time."]
  }
}
```

---

### GET `/doctor/availability/blocked-dates/` [Authenticated: Approved Doctor]
List all blocked dates.

**Response 200:**
```json
[
  {"id": "...", "date": "2026-06-15"},
  {"id": "...", "date": "2026-06-22"}
]
```

---

### POST `/doctor/availability/blocked-dates/` [Authenticated: Approved Doctor]
Block a date.

**Request:**
```json
{"date": "2026-06-15"}
```

**Response 201:**
```json
{"id": "...", "date": "2026-06-15"}
```

**Response 409:** Date already blocked.

---

### DELETE `/doctor/availability/blocked-dates/{date}/` [Authenticated: Approved Doctor]
Unblock a date.

**Path parameter:** `date` — YYYY-MM-DD

**Response 204:** No content.

---

## 6. Appointment Booking (Patient)

### POST `/appointments/` [Authenticated: Patient]
Book an appointment.

**Request:**
```json
{
  "slot_id": "880e8400-e29b-41d4-a716-446655440003"
}
```

**Response 201:**
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440004",
  "doctor": {
    "id": "...",
    "name": "Dr. Arjun Mehta",
    "specialty": "Cardiologist",
    "clinic_name": "Mehta Heart Clinic",
    "clinic_address": "Banjara Hills, Hyderabad"
  },
  "date": "2026-06-01",
  "start_time": "09:00",
  "end_time": "09:30",
  "status": "Scheduled",
  "booked_at": "2026-05-25T11:00:00Z"
}
```

**Response 409 (slot taken):**
```json
{
  "error": "slot_unavailable",
  "detail": "This slot is no longer available. Please choose another time."
}
```

**Response 409 (duplicate booking):**
```json
{
  "error": "duplicate_appointment",
  "detail": "You already have an appointment with this doctor on this date."
}
```

---

## 7. Appointment Management

### GET `/patient/appointments/` [Authenticated: Patient]
List all patient appointments.

**Query Parameters:** `status` (filter), `page`

**Response 200:** Paginated list of appointments with doctor details, date, time, status.

---

### GET `/doctor/appointments/today/` [Authenticated: Approved Doctor]
Today's appointments sorted by time ascending.

**Response 200:**
```json
[
  {
    "id": "990e8400-...",
    "patient_name": "Priya Sharma",
    "start_time": "09:00",
    "end_time": "09:30",
    "status": "Scheduled"
  }
]
```

---

### GET `/doctor/appointments/upcoming/` [Authenticated: Approved Doctor]
Upcoming appointments (next 30 days).

**Response 200:** List of appointments sorted by date-time ascending.

---

### POST `/appointments/{appointment_id}/cancel/` [Authenticated: Patient or Doctor]
Cancel an appointment.

**Path parameter:** `appointment_id` — UUID

**Notes:**
- Patient: only if current time > appointment start − 2 hours
- Doctor: any time before appointment start

**Response 200:**
```json
{
  "id": "...",
  "status": "Cancelled",
  "cancelled_by": "patient"
}
```

**Response 409 (within cancellation window):**
```json
{
  "error": "cancellation_window_expired",
  "detail": "Cancellations are not allowed within 2 hours of the appointment."
}
```

**Response 409 (terminal status):**
```json
{
  "error": "appointment_immutable",
  "detail": "This appointment is already in a terminal state (Completed)."
}
```

---

### POST `/appointments/{appointment_id}/no-show/` [Authenticated: Doctor — appointment's doctor only]
Mark an appointment as No-Show.

**Response 200:**
```json
{"id": "...", "status": "No_Show"}
```

---

## 8. Consultation Workflow (Doctor)

### POST `/appointments/{appointment_id}/consultation/start/` [Authenticated: Doctor — appointment's doctor only]
Open a consultation. Transitions appointment from `Scheduled` → `In_Consultation`.

Only valid if appointment date = today (IST).

**Response 200:**
```json
{"id": "...", "status": "In_Consultation"}
```

**Response 409:**
```json
{
  "error": "consultation_not_allowed",
  "detail": "Consultations can only be opened on the appointment date."
}
```

---

### GET `/appointments/{appointment_id}/consultation/` [Authenticated: Doctor — appointment's doctor only]
Get consultation notes for an appointment.

**Response 200:**
```json
{
  "id": "...",
  "appointment_id": "...",
  "chief_complaint": "Chest tightness on exertion",
  "history": null,
  "examination_findings": "BP 140/90",
  "diagnosis": "Stable Angina Pectoris",
  "plan": "Lifestyle modification + medication",
  "created_at": "2026-06-01T09:05:00Z",
  "updated_at": "2026-06-01T09:15:00Z"
}
```

---

### PUT `/appointments/{appointment_id}/consultation/` [Authenticated: Doctor — In Consultation only]
Save (create or update) consultation notes. Immutable once appointment is Completed (returns 403).

**Request:**
```json
{
  "chief_complaint": "Chest tightness on exertion",
  "history": "3 weeks duration",
  "examination_findings": "BP 140/90, HR 78",
  "diagnosis": "Stable Angina Pectoris",
  "plan": "Amlodipine 5mg OD, low sodium diet"
}
```

**Response 200:** Saved consultation note.

**Response 403 (appointment Completed):**
```json
{
  "error": "consultation_immutable",
  "detail": "Consultation notes cannot be modified after the appointment is completed."
}
```

---

## 9. Prescriptions

### POST `/appointments/{appointment_id}/prescription/` [Authenticated: Doctor — In Consultation only]
Issue a prescription. Triggers async PDF generation (ADR-006). Returns 202 Accepted.

**Request:**
```json
{
  "medicines": [
    {
      "name": "Amlodipine",
      "dosage": "5mg",
      "frequency": "Once daily",
      "duration": "30 days"
    },
    {
      "name": "Aspirin",
      "dosage": "75mg",
      "frequency": "Once daily",
      "duration": "90 days"
    }
  ],
  "instructions": "Low sodium diet. Avoid strenuous exercise.",
  "follow_up_date": "2026-07-10"
}
```

| Field | Validation |
|-------|-----------|
| medicines | Array, min length 1; each entry: name + dosage + frequency + duration all required |
| instructions | Optional, max 2000 chars |
| follow_up_date | Optional, YYYY-MM-DD, must be in the future |

**Response 202:**
```json
{
  "prescription_id": "aa0e8400-e29b-41d4-a716-446655440005",
  "appointment_id": "...",
  "pdf_status": "pending",
  "message": "Prescription submitted. PDF is being generated."
}
```

**Response 400 (validation):**
```json
{
  "error": "validation_error",
  "detail": {
    "medicines[0].dosage": ["This field is required."]
  }
}
```

**Response 409 (wrong appointment status):**
```json
{
  "error": "wrong_appointment_status",
  "detail": "Prescriptions can only be issued for appointments in 'In Consultation' status."
}
```

---

### GET `/patient/prescriptions/` [Authenticated: Patient]
List patient's prescriptions.

**Response 200:** Paginated list.

```json
{
  "results": [
    {
      "id": "aa0e8400-...",
      "appointment": {
        "id": "...",
        "date": "2026-06-01",
        "doctor_name": "Dr. Arjun Mehta",
        "specialty": "Cardiologist"
      },
      "pdf_status": "complete",
      "created_at": "2026-06-01T09:20:00Z"
    }
  ]
}
```

---

### GET `/prescriptions/{prescription_id}/download/` [Authenticated: Patient — own prescriptions only]
Get a fresh 7-day pre-signed S3 URL for the prescription PDF.

**Response 200:**
```json
{
  "download_url": "https://medslot-prescriptions.s3.ap-south-1.amazonaws.com/prescriptions/...",
  "expires_at": "2026-06-08T09:25:00Z"
}
```

**Response 404:** Prescription not found or PDF not yet generated.

---

## 10. Health Records

### GET `/patient/records/` [Authenticated: Patient]
List own health records (excludes soft-deleted).

**Response 200:**
```json
{
  "results": [
    {
      "id": "bb0e8400-...",
      "original_filename": "blood_test_2026.pdf",
      "file_type": "pdf",
      "file_size_bytes": 524288,
      "created_at": "2026-05-10T08:00:00Z"
    }
  ]
}
```

---

### POST `/patient/records/initiate/` [Authenticated: Patient]
Initiate a health record upload. Returns a presigned S3 PUT URL for direct client upload.

**Request:**
```json
{
  "original_filename": "blood_test_2026.pdf",
  "file_type": "pdf",
  "file_size_bytes": 524288
}
```

| Field | Validation |
|-------|-----------|
| original_filename | max 255 chars |
| file_type | `"pdf"`, `"jpg"`, `"jpeg"`, or `"png"` |
| file_size_bytes | max 10485760 (10MB) |

**Response 201:**
```json
{
  "record_id": "bb0e8400-...",
  "upload_url": "https://medslot-records.s3.ap-south-1.amazonaws.com/records/...",
  "upload_expires_at": "2026-05-25T11:15:00Z"
}
```

---

### POST `/patient/records/{record_id}/confirm/` [Authenticated: Patient]
Confirm S3 upload completed. Moves record from `pending` to `active`.

**Response 200:**
```json
{"id": "bb0e8400-...", "status": "active"}
```

---

### GET `/patient/records/{record_id}/download/` [Authenticated: Patient — own records only]
Get a 7-day presigned S3 download URL.

**Response 200:**
```json
{
  "download_url": "https://medslot-records.s3.ap-south-1.amazonaws.com/records/...",
  "expires_at": "2026-06-01T08:00:00Z"
}
```

---

### DELETE `/patient/records/{record_id}/` [Authenticated: Patient — own records only]
Soft-delete a health record. S3 object is retained.

**Response 204:** No content.

---

## 11. Doctor Subscription

### GET `/doctor/subscription/` [Authenticated: Doctor]
Get own subscription status.

**Response 200:**
```json
{
  "status": "Trial",
  "trial_expiry": "2026-06-24T00:00:00Z",
  "days_remaining": 30,
  "razorpay_subscription_id": null
}
```

---

### POST `/doctor/subscription/initiate/` [Authenticated: Approved Doctor]
Initiate a Razorpay Subscription purchase. Returns the Razorpay subscription ID for the frontend checkout.

**Response 201:**
```json
{
  "razorpay_subscription_id": "sub_AbCdEfGhIjKlMn",
  "razorpay_key_id": "rzp_live_...",
  "plan_id": "plan_AbCdEfGhIjKlMn"
}
```

---

### POST `/webhooks/razorpay/` [PUBLIC — HMAC-SHA256 validated]
Razorpay webhook receiver. HMAC-SHA256 signature validated before any state change.

**Headers:**
- `X-Razorpay-Signature: <hmac_sha256_signature>`

**Request:** Razorpay webhook payload (application/json)

**Processed events:**
- `subscription.activated` → DoctorSubscription.status = `Active`
- `subscription.charged` (failed) → DoctorSubscription.status = `Payment_Failed`; notification email
- `subscription.cancelled` → DoctorSubscription.status = `Cancelled`

**Response 200:**
```json
{"status": "processed"}
```

**Response 400 (invalid signature):**
```json
{
  "error": "invalid_signature",
  "detail": "Webhook signature validation failed."
}
```

---

## 12. Admin Endpoints

All admin endpoints require `Authorization: Bearer <admin_jwt>`. Non-admin tokens return 403.

### GET `/admin/doctors/pending/` [Authenticated: Admin]
List pending doctor applications.

**Response 200:**
```json
{
  "results": [
    {
      "id": "660e8400-...",
      "name": "Dr. Priya Verma",
      "specialty": "Dermatologist",
      "mci_number": "DL987654",
      "city": "Bengaluru",
      "submitted_at": "2026-05-24T14:00:00Z",
      "credential_document_url": "https://..."
    }
  ]
}
```

---

### POST `/admin/doctors/{doctor_id}/approve/` [Authenticated: Admin]
Approve a pending doctor application.

**Response 200:**
```json
{"id": "...", "account_status": "Approved", "trial_expiry": "2026-06-24T00:00:00Z"}
```

---

### POST `/admin/doctors/{doctor_id}/reject/` [Authenticated: Admin]
Reject a pending doctor application.

**Request:**
```json
{"reason": "MCI number could not be verified against council records."}
```

**Response 200:**
```json
{"id": "...", "account_status": "Rejected"}
```

---

### POST `/admin/doctors/{doctor_id}/suspend/` [Authenticated: Admin]
Suspend an approved doctor account.

**Request:**
```json
{"reason": "Complaint investigation in progress."}
```

**Response 200:**
```json
{"id": "...", "account_status": "Suspended"}
```

---

### POST `/admin/doctors/{doctor_id}/reactivate/` [Authenticated: Admin]
Reactivate a suspended doctor account.

**Response 200:**
```json
{"id": "...", "account_status": "Approved"}
```

---

## 13. Analytics Events

### POST `/analytics/events/` [PUBLIC — rate limited; JWT optional]
Submit a client-side analytics event.

**Request:**
```json
{
  "event_name": "booking.slot_selected",
  "session_id": "cc0e8400-e29b-41d4-a716-446655440006",
  "properties": {
    "doctor_id": "660e8400-...",
    "specialty": "Cardiologist",
    "slot_date": "2026-06-01",
    "slot_time_bucket": "morning"
  },
  "client_ts": "2026-05-25T11:05:00Z",
  "page_url": "https://medslot.in/doctors/660e8400-..."
}
```

**Notes:**
- `user_id` is injected server-side from JWT (never sent by client)
- `role` is injected server-side from JWT
- Properties are validated against event allowlist before write

**Response 201:**
```json
{"status": "recorded"}
```

**Response 422 (unknown event or invalid properties):**
```json
{
  "error": "invalid_event",
  "detail": "Event 'unknown.event' is not in the registered event taxonomy."
}
```

---

## 14. Health Check

### GET `/health/` [PUBLIC]
API liveness check used by ECS health checks.

**Response 200:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-05-25T11:00:00Z"
}
```

---

## API Versioning & Deprecation Policy

- All endpoints are versioned at `/api/v1/`
- Breaking changes require a new version prefix: `/api/v2/`
- `/api/v1/` endpoints are supported for a minimum of 12 months after a v2 is introduced
- Deprecation notice is added to the OpenAPI spec and communicated to all consumers before deprecation
- The `GET /api/schema/` endpoint returns the live OpenAPI 3.0 specification (generated by drf-spectacular)
