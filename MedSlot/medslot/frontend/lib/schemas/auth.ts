/**
 * Zod validation schemas for authentication forms (SCR-006, SCR-010).
 *
 * phoneSchema          — Step 1: Indian mobile number (10-digit, 6–9 prefix)
 * otpSchema            — Step 2: 6-digit OTP code
 * patientProfileSchema — Step 3: Patient profile (new users only)
 *
 * Validation rules from WIREFRAMES.md SCR-006 validation table.
 */
import { z } from 'zod';

/**
 * Indian mobile number: 10 digits, starting with 6–9.
 * The +91 prefix is prepended programmatically — user inputs only the 10-digit number.
 * Valid prefixes: 6x, 7x, 8x, 9x (all active mobile ranges in India).
 */
export const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, 'Please enter a valid Indian mobile number')
    .regex(
      /^[6-9]\d{9}$/,
      'Please enter a valid Indian mobile number',
    ),
});

export type PhoneFormData = z.infer<typeof phoneSchema>;

/**
 * 6-digit numeric OTP code.
 * The OtpInput component joins individual digit-box values into this string.
 */
export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'Please enter all 6 digits')
    .regex(/^\d{6}$/, 'Please enter all 6 digits'),
});

export type OtpFormData = z.infer<typeof otpSchema>;

/**
 * Patient profile creation form (Step 3 — new users only).
 *
 * Rules from WIREFRAMES.md SCR-006:
 * - full_name: required, non-empty
 * - date_of_birth: required, user must be ≥ 18 years old
 * - gender: required, one of 'male' | 'female' | 'other'
 * - email: required, RFC 5322 format (WIREFRAMES.md marks it Required)
 */
export const patientProfileSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Please enter your full name')
    .max(150, 'Name must be under 150 characters'),

  date_of_birth: z
    .string()
    .min(1, 'Please enter a valid date of birth')
    .refine(
      (val) => {
        const dob = new Date(val);
        if (Number.isNaN(dob.getTime())) return false;
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
        return age >= 18;
      },
      'You must be at least 18 years old',
    ),

  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Please select your gender' }),
  }),

  email: z
    .string()
    .min(1, 'Please enter a valid email address')
    .email('Please enter a valid email address'),
});

export type PatientProfileFormData = z.infer<typeof patientProfileSchema>;
