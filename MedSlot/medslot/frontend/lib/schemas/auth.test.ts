/**
 * Unit tests for auth Zod schemas (lib/schemas/auth.ts).
 *
 * Covers all validation rules from WIREFRAMES.md SCR-006 validation table.
 * Pure unit tests — no browser APIs or network calls.
 */
import { describe, it, expect } from 'vitest';
import {
  phoneSchema,
  otpSchema,
  patientProfileSchema,
} from './auth';

// ── phoneSchema ───────────────────────────────────────────────────────────────

describe('phoneSchema', () => {
  it('accepts a valid 10-digit number starting with 6', () => {
    expect(phoneSchema.safeParse({ phone: '6876543210' }).success).toBe(true);
  });

  it('accepts a valid 10-digit number starting with 7', () => {
    expect(phoneSchema.safeParse({ phone: '7876543210' }).success).toBe(true);
  });

  it('accepts a valid 10-digit number starting with 8', () => {
    expect(phoneSchema.safeParse({ phone: '8876543210' }).success).toBe(true);
  });

  it('accepts a valid 10-digit number starting with 9', () => {
    expect(phoneSchema.safeParse({ phone: '9876543210' }).success).toBe(true);
  });

  it('rejects a number starting with 5 (invalid Indian prefix)', () => {
    expect(phoneSchema.safeParse({ phone: '5876543210' }).success).toBe(false);
  });

  it('rejects a number starting with 1 (invalid Indian prefix)', () => {
    expect(phoneSchema.safeParse({ phone: '1876543210' }).success).toBe(false);
  });

  it('rejects a 9-digit number (too short)', () => {
    expect(phoneSchema.safeParse({ phone: '987654321' }).success).toBe(false);
  });

  it('rejects an 11-digit number (too long)', () => {
    expect(phoneSchema.safeParse({ phone: '98765432101' }).success).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(phoneSchema.safeParse({ phone: '' }).success).toBe(false);
  });

  it('rejects a phone number containing letters', () => {
    expect(phoneSchema.safeParse({ phone: '9876abc210' }).success).toBe(false);
  });

  it('rejects a phone number with spaces', () => {
    expect(phoneSchema.safeParse({ phone: '98765 4321' }).success).toBe(false);
  });

  it('returns the correct error message for an invalid number', () => {
    const result = phoneSchema.safeParse({ phone: '1234567890' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Please enter a valid Indian mobile number',
      );
    }
  });

  it('returns the correct error message for empty input', () => {
    const result = phoneSchema.safeParse({ phone: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Please enter a valid Indian mobile number',
      );
    }
  });
});

// ── otpSchema ─────────────────────────────────────────────────────────────────

describe('otpSchema', () => {
  it('accepts a valid 6-digit OTP', () => {
    expect(otpSchema.safeParse({ otp: '123456' }).success).toBe(true);
  });

  it('accepts a 6-digit OTP starting with zeros', () => {
    expect(otpSchema.safeParse({ otp: '000000' }).success).toBe(true);
  });

  it('rejects a 5-digit OTP (too short)', () => {
    expect(otpSchema.safeParse({ otp: '12345' }).success).toBe(false);
  });

  it('rejects a 7-digit OTP (too long)', () => {
    expect(otpSchema.safeParse({ otp: '1234567' }).success).toBe(false);
  });

  it('rejects an OTP containing a letter', () => {
    expect(otpSchema.safeParse({ otp: '12345a' }).success).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(otpSchema.safeParse({ otp: '' }).success).toBe(false);
  });

  it('rejects an OTP with spaces', () => {
    expect(otpSchema.safeParse({ otp: '123 56' }).success).toBe(false);
  });

  it('returns the correct error message for length mismatch', () => {
    const result = otpSchema.safeParse({ otp: '12345' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Please enter all 6 digits');
    }
  });
});

// ── patientProfileSchema ──────────────────────────────────────────────────────

describe('patientProfileSchema', () => {
  // Build a DOB for a person who is exactly (years) old
  const dobFor = (years: number, offsetDays = -1): string => {
    const today = new Date();
    const d = new Date(
      today.getFullYear() - years,
      today.getMonth(),
      today.getDate() + offsetDays,
    );
    return d.toISOString().split('T')[0] as string;
  };

  const valid = {
    full_name: 'Priya Sharma',
    date_of_birth: dobFor(25),
    gender: 'female' as const,
    email: 'priya@example.com',
  };

  it('accepts fully valid profile data', () => {
    expect(patientProfileSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts gender: male', () => {
    expect(patientProfileSchema.safeParse({ ...valid, gender: 'male' }).success).toBe(true);
  });

  it('accepts gender: other', () => {
    expect(patientProfileSchema.safeParse({ ...valid, gender: 'other' }).success).toBe(true);
  });

  // ── full_name ──────────────────────────────────────────────────────────────

  it('rejects an empty full_name', () => {
    const result = patientProfileSchema.safeParse({ ...valid, full_name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Please enter your full name');
    }
  });

  it('rejects full_name longer than 150 characters', () => {
    const longName = 'a'.repeat(151);
    expect(patientProfileSchema.safeParse({ ...valid, full_name: longName }).success).toBe(false);
  });

  it('accepts full_name of exactly 150 characters', () => {
    const maxName = 'a'.repeat(150);
    expect(patientProfileSchema.safeParse({ ...valid, full_name: maxName }).success).toBe(true);
  });

  // ── date_of_birth ──────────────────────────────────────────────────────────

  it('rejects a user who is 17 years old (under 18)', () => {
    const result = patientProfileSchema.safeParse({
      ...valid,
      date_of_birth: dobFor(17),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('You must be at least 18 years old');
    }
  });

  it('accepts a user who is exactly 18 years old', () => {
    // Birthday was yesterday (clearly over 18)
    expect(
      patientProfileSchema.safeParse({ ...valid, date_of_birth: dobFor(18) }).success,
    ).toBe(true);
  });

  it('accepts a user who is 30 years old', () => {
    expect(
      patientProfileSchema.safeParse({ ...valid, date_of_birth: dobFor(30) }).success,
    ).toBe(true);
  });

  it('rejects an empty date_of_birth', () => {
    expect(
      patientProfileSchema.safeParse({ ...valid, date_of_birth: '' }).success,
    ).toBe(false);
  });

  it('rejects a non-date string', () => {
    expect(
      patientProfileSchema.safeParse({ ...valid, date_of_birth: 'not-a-date' }).success,
    ).toBe(false);
  });

  // ── gender ─────────────────────────────────────────────────────────────────

  it('rejects an unrecognised gender value', () => {
    expect(
      patientProfileSchema.safeParse({ ...valid, gender: 'unknown' as 'male' }).success,
    ).toBe(false);
  });

  it('returns the gender error message', () => {
    const result = patientProfileSchema.safeParse({ ...valid, gender: '' as 'male' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Please select your gender');
    }
  });

  // ── email ──────────────────────────────────────────────────────────────────

  it('rejects an empty email', () => {
    const result = patientProfileSchema.safeParse({ ...valid, email: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Please enter a valid email address');
    }
  });

  it('rejects an email without @ symbol', () => {
    expect(
      patientProfileSchema.safeParse({ ...valid, email: 'notanemail' }).success,
    ).toBe(false);
  });

  it('rejects an email without domain', () => {
    expect(
      patientProfileSchema.safeParse({ ...valid, email: 'user@' }).success,
    ).toBe(false);
  });

  it('accepts a valid email with sub-domain', () => {
    expect(
      patientProfileSchema.safeParse({ ...valid, email: 'user@mail.example.com' }).success,
    ).toBe(true);
  });
});
