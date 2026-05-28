import type { Metadata } from 'next';
import PatientOtpAuth from '@/components/auth/PatientOtpAuth';

export const metadata: Metadata = {
  title: 'Sign In or Register — MedSlot',
  description: 'Sign in or create your MedSlot patient account using your mobile number.',
};

/**
 * /auth/patient — Patient OTP authentication page (SCR-006).
 *
 * Renders the 3-step OTP wizard:
 *   Step 1: Enter mobile number → send OTP
 *   Step 2: Enter 6-digit OTP  → verify
 *   Step 3: Complete profile   → new users only
 *
 * On success: redirects to /dashboard (or pending booking URL).
 */
export default function PatientAuthPage(): JSX.Element {
  return <PatientOtpAuth />;
}
