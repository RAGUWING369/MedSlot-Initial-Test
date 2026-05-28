/**
 * Unit tests for auth API functions (lib/api/auth.ts).
 *
 * Uses axios-mock-adapter to intercept HTTP calls at the adapter level.
 * No real network requests are made.
 *
 * Covers:
 * - requestOtp: success (200), rate-limited (429), SMS failure (503)
 * - verifyOtp: success (returning + new user), invalid OTP (400), locked (429)
 * - createPatientProfile: success (201), validation error (400)
 */
import {
  describe, it, expect, beforeEach,
} from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import apiClient from '../api';
import {
  requestOtp,
  verifyOtp,
  createPatientProfile,
  type OtpVerifyResponse,
} from './auth';

const mock = new MockAdapter(apiClient);

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  phone: '+919876543210',
  role: 'patient' as const,
};

describe('requestOtp', () => {
  beforeEach(() => {
    mock.reset();
  });

  it('resolves on 200 response', async () => {
    mock.onPost('/api/v1/auth/otp/request/').reply(200);
    await expect(requestOtp('+919876543210')).resolves.toBeUndefined();
  });

  it('sends phone and role in the request body', async () => {
    mock.onPost('/api/v1/auth/otp/request/').reply(200);
    await requestOtp('+919876543210');
    const body = JSON.parse(mock.history.post?.[0]?.data as string) as Record<string, unknown>;
    expect(body).toEqual({ phone: '+919876543210', role: 'patient' });
  });

  it('throws on 429 (rate limited)', async () => {
    mock.onPost('/api/v1/auth/otp/request/').reply(429);
    await expect(requestOtp('+919876543210')).rejects.toThrow();
  });

  it('throws on 503 (SMS delivery failure)', async () => {
    mock.onPost('/api/v1/auth/otp/request/').reply(503);
    await expect(requestOtp('+919876543210')).rejects.toThrow();
  });

  it('throws on network error', async () => {
    mock.onPost('/api/v1/auth/otp/request/').networkError();
    await expect(requestOtp('+919876543210')).rejects.toThrow();
  });
});

describe('verifyOtp', () => {
  beforeEach(() => {
    mock.reset();
  });

  const successResponse: OtpVerifyResponse = {
    token: 'eyJhbGciOiJIUzI1NiJ9.payload.sig',
    is_new_user: false,
    user: mockUser,
  };

  it('returns OtpVerifyResponse on success', async () => {
    mock.onPost('/api/v1/auth/otp/verify/').reply(200, successResponse);
    const result = await verifyOtp('+919876543210', '123456');
    expect(result).toEqual(successResponse);
  });

  it('returns is_new_user: true for new users', async () => {
    const newUserResponse = { ...successResponse, is_new_user: true };
    mock.onPost('/api/v1/auth/otp/verify/').reply(200, newUserResponse);
    const result = await verifyOtp('+919876543210', '123456');
    expect(result.is_new_user).toBe(true);
  });

  it('sends phone and otp_code in the request body', async () => {
    mock.onPost('/api/v1/auth/otp/verify/').reply(200, successResponse);
    await verifyOtp('+919876543210', '654321');
    const body = JSON.parse(mock.history.post?.[0]?.data as string) as Record<string, unknown>;
    expect(body).toEqual({ phone: '+919876543210', otp_code: '654321' });
  });

  it('throws on 400 (invalid OTP)', async () => {
    mock.onPost('/api/v1/auth/otp/verify/').reply(400, {
      detail: 'Invalid OTP',
      attempts_remaining: 2,
    });
    await expect(verifyOtp('+919876543210', '000000')).rejects.toThrow();
  });

  it('throws on 429 (account locked)', async () => {
    mock.onPost('/api/v1/auth/otp/verify/').reply(429);
    await expect(verifyOtp('+919876543210', '000000')).rejects.toThrow();
  });

  it('throws on network error', async () => {
    mock.onPost('/api/v1/auth/otp/verify/').networkError();
    await expect(verifyOtp('+919876543210', '123456')).rejects.toThrow();
  });
});

describe('createPatientProfile', () => {
  beforeEach(() => {
    mock.reset();
  });

  const validPayload = {
    full_name: 'Priya Sharma',
    date_of_birth: '1995-06-15',
    gender: 'female' as const,
    email: 'priya@example.com',
  };

  it('resolves on 201 response', async () => {
    mock.onPost('/api/v1/patient/profile/').reply(201);
    await expect(createPatientProfile(validPayload)).resolves.toBeUndefined();
  });

  it('sends all profile fields in the request body', async () => {
    mock.onPost('/api/v1/patient/profile/').reply(201);
    await createPatientProfile(validPayload);
    const body = JSON.parse(mock.history.post?.[0]?.data as string) as Record<string, unknown>;
    expect(body).toEqual(validPayload);
  });

  it('resolves on 200 response (some backends return 200)', async () => {
    mock.onPost('/api/v1/patient/profile/').reply(200);
    await expect(createPatientProfile(validPayload)).resolves.toBeUndefined();
  });

  it('throws on 400 (validation error)', async () => {
    mock.onPost('/api/v1/patient/profile/').reply(400, {
      email: ['Enter a valid email address.'],
    });
    await expect(createPatientProfile(validPayload)).rejects.toThrow();
  });

  it('throws on 401 (unauthenticated)', async () => {
    mock.onPost('/api/v1/patient/profile/').reply(401);
    await expect(createPatientProfile(validPayload)).rejects.toThrow();
  });

  it('throws on network error', async () => {
    mock.onPost('/api/v1/patient/profile/').networkError();
    await expect(createPatientProfile(validPayload)).rejects.toThrow();
  });
});
