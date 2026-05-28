/**
 * Auth API functions for the OTP authentication flow (SCR-006, SCR-010).
 *
 * Uses the shared apiClient (lib/api.ts) which injects the JWT Bearer token
 * and handles 401 globally.
 *
 * Endpoints implemented in TASK-013 (accounts app):
 *   POST /api/v1/auth/otp/request/   — send SMS OTP to phone number
 *   POST /api/v1/auth/otp/verify/    — verify OTP → returns JWT + user identity
 *   POST /api/v1/patient/profile/    — create patient profile (new users only)
 */
import apiClient from '../api';
import type { AuthUser } from '../stores/authStore';

// ── Response / payload types ──────────────────────────────────────────────────

/** Response from POST /api/v1/auth/otp/verify/ */
export interface OtpVerifyResponse {
  /** HS256 JWT — 24h lifetime (no refresh tokens in v1) */
  token: string;
  /** true if this phone number is new to MedSlot and needs Step 3 profile completion */
  is_new_user: boolean;
  /** Basic user identity used to hydrate authStore (no PHI) */
  user: AuthUser;
}

/** Payload for POST /api/v1/patient/profile/ */
export interface PatientProfilePayload {
  full_name: string;
  date_of_birth: string; // ISO date string YYYY-MM-DD
  gender: 'male' | 'female' | 'other';
  email: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * Request a new OTP for the given phone number.
 *
 * @param phone - E.164 format phone number e.g. "+919876543210"
 * @throws AxiosError 429 — too many requests (rate limited)
 * @throws AxiosError 503 — MSG91 SMS delivery failure
 */
export const requestOtp = async (phone: string): Promise<void> => {
  await apiClient.post('/api/v1/auth/otp/request/', {
    phone,
    role: 'patient',
  });
};

/**
 * Verify an OTP code.
 *
 * @param phone - E.164 format phone number
 * @param otpCode - 6-digit code entered by user
 * @returns OtpVerifyResponse with token, is_new_user flag, and user identity
 * @throws AxiosError 400 — invalid / expired OTP (may include attempts_remaining)
 * @throws AxiosError 429 — account locked after too many failed attempts
 */
export const verifyOtp = async (
  phone: string,
  otpCode: string,
): Promise<OtpVerifyResponse> => {
  const response = await apiClient.post<OtpVerifyResponse>(
    '/api/v1/auth/otp/verify/',
    { phone, otp_code: otpCode },
  );
  return response.data;
};

/**
 * Create a patient profile for a newly registered user (Step 3).
 *
 * Caller must have called setAuth() before this request — the JWT is injected
 * by the apiClient request interceptor.
 *
 * @throws AxiosError 400 — validation errors from DRF serializer (field-level)
 */
export const createPatientProfile = async (
  payload: PatientProfilePayload,
): Promise<void> => {
  await apiClient.post('/api/v1/patient/profile/', payload);
};
