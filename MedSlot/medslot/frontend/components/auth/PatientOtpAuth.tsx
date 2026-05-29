'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import useAuthStore from '../../lib/stores/authStore';
import {
  phoneSchema,
  patientProfileSchema,
  type PhoneFormData,
  type PatientProfileFormData,
} from '../../lib/schemas/auth';
import {
  requestOtp,
  verifyOtp,
  createPatientProfile,
} from '../../lib/api/auth';
import OtpInput from './OtpInput';

// ── Constants ─────────────────────────────────────────────────────────────────

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30; // seconds — matches wireframe spec

// ── Internal wizard step type ─────────────────────────────────────────────────

type Step = 1 | 2 | 3;

// ── Sub-components ────────────────────────────────────────────────────────────

interface StepBubbleProps {
  number: number;
  label: string;
  state: 'done' | 'active' | 'error' | 'inactive';
}

function StepBubble({ number, label, state }: StepBubbleProps): JSX.Element {
  const bubbleBase = 'w-6 h-6 rounded-full flex items-center justify-center';
  let bubbleColor = 'bg-neutral-200';
  if (state === 'done') bubbleColor = 'bg-emerald-600';
  else if (state === 'error') bubbleColor = 'bg-red-600';
  else if (state === 'active') bubbleColor = 'bg-emerald-800';
  const bubbleClass = `${bubbleBase} ${bubbleColor}`;

  let labelClass = 'text-xs text-neutral-400';
  if (state === 'done') labelClass = 'text-xs text-neutral-400 line-through';
  else if (state === 'error') labelClass = 'text-xs font-semibold text-red-600';
  else if (state === 'active') labelClass = 'text-xs font-semibold text-emerald-800';

  return (
    <div className="flex items-center gap-1.5">
      <div className={bubbleClass}>
        {state === 'done' ? (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <span className="text-white text-xs font-bold">{number}</span>
        )}
      </div>
      <span className={labelClass}>{label}</span>
    </div>
  );
}

interface StepIndicatorProps {
  step: Step;
  otpHasError: boolean;
}

function StepIndicator({ step, otpHasError }: StepIndicatorProps): JSX.Element {
  let otpState: 'done' | 'active' | 'error' | 'inactive' = 'inactive';
  if (step > 2) otpState = 'done';
  else if (step === 2 && otpHasError) otpState = 'error';
  else if (step === 2) otpState = 'active';

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      <StepBubble number={1} label="Mobile" state={step === 1 ? 'active' : 'done'} />
      <div className={`h-px w-6 ${step > 1 ? 'bg-emerald-300' : 'bg-neutral-300'}`} />
      <StepBubble number={2} label="OTP" state={otpState} />
      <div className={`h-px w-6 ${step > 2 ? 'bg-emerald-300' : 'bg-neutral-300'}`} />
      <StepBubble number={3} label="Profile" state={step === 3 ? 'active' : 'inactive'} />
    </div>
  );
}

interface ErrorBannerProps {
  message: string;
}

function ErrorBanner({ message }: ErrorBannerProps): JSX.Element {
  return (
    <div
      className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2"
      role="alert"
    >
      <svg
        className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="text-red-800 text-xs font-medium">{message}</p>
    </div>
  );
}

function Spinner(): JSX.Element {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/** Left branding panel — visible only on xl+ screens */
function BrandingPanel(): JSX.Element {
  return (
    <div className="hidden xl:flex w-1/2 bg-gradient-to-br from-emerald-800 to-emerald-950 items-center justify-center p-16">
      <div className="text-white max-w-sm">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-xl">M</span>
          </div>
          <span className="text-white font-black text-3xl">MedSlot</span>
        </div>
        <h2 className="text-3xl font-bold mb-4 leading-snug">
          Book appointments with verified doctors in seconds.
        </h2>
        <p className="text-emerald-200 text-base leading-relaxed mb-10">
          No waiting on hold. No paper forms. Just your phone number — that&apos;s all you need.
        </p>
        <div className="space-y-4">
          {[
            'MCI-verified doctors only',
            'Real-time slot availability',
            'Prescriptions delivered to your inbox',
          ].map((text) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-emerald-100 text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * PatientOtpAuth — 3-step authentication wizard for patients (SCR-006).
 *
 * Step 1: Phone entry → POST /api/v1/auth/otp/request/
 * Step 2: OTP entry  → POST /api/v1/auth/otp/verify/
 * Step 3: Profile    → POST /api/v1/patient/profile/ (new users only)
 *
 * On successful OTP verification (returning user) or profile creation (new user):
 * - authStore.setAuth() is called with the JWT and user identity
 * - User is redirected to /dashboard
 */
export default function PatientOtpAuth(): JSX.Element {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  // Wizard state
  const [step, setStep] = useState<Step>(1);
  const [phone, setPhone] = useState(''); // 10-digit, without +91
  const [otpValue, setOtpValue] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Per-step loading and error state
  const [sendLoading, setSendLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Resend OTP countdown timer
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Phone step — RHF + Zod
  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  // Profile step — RHF + Zod
  const profileForm = useForm<PatientProfileFormData>({
    resolver: zodResolver(patientProfileSchema),
    defaultValues: { full_name: '', date_of_birth: '', email: '' },
  });

  // Cleanup timer on unmount
  useEffect(() => (): void => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startResendTimer = useCallback((): void => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResendTimer(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ── Step 1 handler: send OTP ──────────────────────────────────────────────

  const handleSendOtp = async (data: PhoneFormData): Promise<void> => {
    setSendError(null);
    setSendLoading(true);
    try {
      await requestOtp(`+91${data.phone}`);
      setPhone(data.phone);
      setStep(2);
      startResendTimer();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 429) {
          setSendError('Too many requests. Please try again in 15 minutes.');
        } else if (err.response?.status === 503) {
          setSendError(
            "We couldn't send the OTP right now. There may be a temporary issue with SMS delivery. Please try again in a moment.",
          );
        } else {
          setSendError('Failed to send OTP. Please try again.');
        }
      } else {
        setSendError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSendLoading(false);
    }
  };

  // ── Step 2 handler: verify OTP ────────────────────────────────────────────

  const handleVerifyOtp = async (): Promise<void> => {
    if (otpValue.length < OTP_LENGTH) {
      setOtpError('Please enter all 6 digits');
      return;
    }
    setOtpError(null);
    setOtpLoading(true);
    try {
      const response = await verifyOtp(`+91${phone}`, otpValue);
      setAuth(response.user, response.token);
      if (response.is_new_user) {
        setStep(3);
      } else {
        setShowSuccess(true);
        setTimeout(() => router.push('/dashboard'), 1500);
      }
    } catch (err) {
      setOtpValue('');
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 429) {
          setIsLocked(true);
        } else if (err.response?.status === 400) {
          const attemptsLeft = (
            err.response.data as Record<string, unknown>
          )?.attempts_remaining;
          setOtpError(
            typeof attemptsLeft === 'number'
              ? `Incorrect OTP. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`
              : 'Incorrect OTP. Please try again.',
          );
        } else {
          setOtpError('Failed to verify OTP. Please try again.');
        }
      } else {
        setOtpError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async (): Promise<void> => {
    if (resendTimer > 0) return;
    setOtpError(null);
    setOtpValue('');
    try {
      await requestOtp(`+91${phone}`);
      startResendTimer();
    } catch {
      setOtpError('Failed to resend OTP. Please try again.');
    }
  };

  const handleChangeNumber = (): void => {
    setStep(1);
    setOtpValue('');
    setOtpError(null);
    if (timerRef.current) clearInterval(timerRef.current);
    setResendTimer(0);
  };

  // ── Step 3 handler: create profile ───────────────────────────────────────

  const handleCreateProfile = async (
    data: PatientProfileFormData,
  ): Promise<void> => {
    setProfileError(null);
    setProfileLoading(true);
    try {
      await createPatientProfile(data);
      setShowSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const errData = err.response.data as Record<string, unknown>;
        const firstMsg = Object.values(errData)[0];
        setProfileError(
          Array.isArray(firstMsg) && typeof firstMsg[0] === 'string'
            ? firstMsg[0]
            : 'Failed to create profile. Please try again.',
        );
      } else {
        setProfileError('Failed to create profile. Please try again.');
      }
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Special render states ─────────────────────────────────────────────────

  // Success panel — shown after OTP verify (returning) or profile creation (new user)
  if (showSuccess) {
    return (
      <div className="min-h-screen flex bg-slate-50">
        <BrandingPanel />
        <div className="flex-1 flex items-center justify-center py-16 px-8">
          <div
            className="bg-white rounded-2xl shadow-md border border-green-200 p-10 text-center w-full max-w-sm"
            role="status"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              You&apos;re signed in!
            </h1>
            <p className="text-neutral-500 text-sm mb-6">
              Taking you to your dashboard…
            </p>
            <div className="flex justify-center">
              <svg
                className="animate-spin h-6 w-6 text-emerald-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Lockout panel — no retry button per spec
  if (isLocked) {
    return (
      <div className="min-h-screen flex bg-slate-50">
        <BrandingPanel />
        <div className="flex-1 flex items-center justify-center py-16 px-8">
          <div
            className="bg-white rounded-2xl shadow-md border border-red-200 p-10 text-center w-full max-w-sm"
            role="alert"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">
              Account Locked
            </h2>
            <p className="text-neutral-600 text-sm">
              Too many failed attempts. Try again in 15 minutes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main wizard render ────────────────────────────────────────────────────

  // Void-returning form submit handlers — RHF's handleSubmit accepts async handlers
  // internally (all errors caught), but React's onSubmit prop expects () => void.
  const onPhoneSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    phoneForm.handleSubmit(handleSendOtp)(e).catch(() => undefined);
  };
  const onProfileSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    profileForm.handleSubmit(handleCreateProfile)(e).catch(() => undefined);
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <BrandingPanel />

      <div className="flex-1 flex items-center justify-center py-16 px-8 bg-slate-50">
        <div className="w-full max-w-sm">

          {/* ── Step 1: Phone entry ───────────────────────────────────────── */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-8">
              <div className="mb-6 text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-7 h-7 text-emerald-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-neutral-900 mb-1">
                  Sign in or Register
                </h1>
                <p className="text-neutral-500 text-sm">
                  Enter your mobile number to continue. We&apos;ll send you a
                  one-time password.
                </p>
              </div>

              <StepIndicator step={step} otpHasError={false} />

              {sendError && <ErrorBanner message={sendError} />}

              <form
                onSubmit={onPhoneSubmit}
                noValidate
              >
                <div className="mb-5">
                  {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                  >
                    Mobile Number
                  </label>
                  <div
                    className={[
                      'flex items-stretch border rounded-xl overflow-hidden',
                      'focus-within:ring-2 focus-within:ring-emerald-100 transition-all',
                      phoneForm.formState.errors.phone
                        ? 'border-red-400 focus-within:border-red-400'
                        : 'border-neutral-300 focus-within:border-emerald-600',
                    ].join(' ')}
                  >
                    <div className="flex items-center px-3 bg-neutral-50 border-r border-neutral-300">
                      <span className="text-neutral-600 text-sm font-medium">
                        🇮🇳 +91
                      </span>
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder="98765 43210"
                      maxLength={10}
                      className="flex-1 px-4 py-3 text-neutral-900 text-sm bg-white focus:outline-none placeholder-neutral-400"
                      {...phoneForm.register('phone')}
                    />
                  </div>
                  {phoneForm.formState.errors.phone && (
                    <p className="text-red-600 text-xs mt-1.5" role="alert">
                      {phoneForm.formState.errors.phone.message}
                    </p>
                  )}
                  <p className="text-xs text-neutral-400 mt-1.5">
                    An OTP will be sent via SMS. Standard rates apply.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={sendLoading}
                  aria-busy={sendLoading}
                  className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-3"
                >
                  {sendLoading ? (
                    <>
                      <Spinner />
                      Sending OTP…
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </form>

              <p className="text-xs text-neutral-400 text-center mt-6">
                By continuing, you agree to MedSlot&apos;s
                {' '}
                <a href="/terms" className="text-emerald-700 hover:underline">
                  Terms of Service
                </a>
                {' '}
                and
                {' '}
                <a href="/privacy" className="text-emerald-700 hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          )}

          {/* ── Step 2: OTP entry ─────────────────────────────────────────── */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-8">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-7 h-7 text-blue-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-neutral-900 mb-1">
                  Enter OTP
                </h2>
                <p className="text-neutral-500 text-sm">
                  A 6-digit code was sent to
                  {' '}
                  <strong>
                    {`+91 ${phone}`}
                  </strong>
                </p>
              </div>

              <StepIndicator step={step} otpHasError={!!otpError} />

              {otpError && <ErrorBanner message={otpError} />}

              <div className="mb-6">
                <OtpInput
                  value={otpValue}
                  onChange={setOtpValue}
                  hasError={!!otpError}
                  disabled={otpLoading}
                />
              </div>

              <button
                type="button"
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onClick={handleVerifyOtp}
                disabled={otpLoading}
                aria-busy={otpLoading}
                className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-3 mb-4"
              >
                {otpLoading ? (
                  <>
                    <Spinner />
                    Verifying…
                  </>
                ) : (
                  'Verify OTP'
                )}
              </button>

              <p className="text-center text-xs text-neutral-400">
                Didn&apos;t receive it?
                {' '}
                <button
                  type="button"
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0}
                  className="text-emerald-700 font-medium hover:underline disabled:text-neutral-400 disabled:cursor-not-allowed"
                >
                  Resend OTP
                </button>
                {resendTimer > 0 && (
                  <span className="text-neutral-400 ml-1">
                    (
                    {resendTimer}
                    s)
                  </span>
                )}
              </p>
              <p className="text-center text-xs text-neutral-400 mt-2">
                <button
                  type="button"
                  onClick={handleChangeNumber}
                  className="text-neutral-500 hover:underline"
                >
                  ← Change number
                </button>
              </p>
            </div>
          )}

          {/* ── Step 3: Profile (new users only) ─────────────────────────── */}
          {step === 3 && (
            <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-8">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-7 h-7 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-neutral-900 mb-1">
                  Complete Your Profile
                </h2>
                <p className="text-neutral-500 text-sm">
                  Just a few details to get you started. This helps doctors
                  prepare for your visit.
                </p>
              </div>

              <StepIndicator step={step} otpHasError={false} />

              {profileError && <ErrorBanner message={profileError} />}

              <form
                onSubmit={onProfileSubmit}
                noValidate
                className="space-y-4"
              >
                {/* Full Name */}
                <div>
                  {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                  <label
                    htmlFor="full_name"
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                  >
                    Full Name
                    {' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    autoComplete="name"
                    placeholder="Priya Sharma"
                    className={[
                      'w-full border rounded-xl px-4 py-3 text-sm text-neutral-900',
                      'focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all',
                      profileForm.formState.errors.full_name
                        ? 'border-red-400 focus:border-red-400'
                        : 'border-neutral-300 focus:border-emerald-600',
                    ].join(' ')}
                    {...profileForm.register('full_name')}
                  />
                  {profileForm.formState.errors.full_name && (
                    <p className="text-red-600 text-xs mt-1" role="alert">
                      {profileForm.formState.errors.full_name.message}
                    </p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                  <label
                    htmlFor="date_of_birth"
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                  >
                    Date of Birth
                    {' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="date_of_birth"
                    type="date"
                    autoComplete="bday"
                    className={[
                      'w-full border rounded-xl px-4 py-3 text-sm text-neutral-900',
                      'focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all',
                      profileForm.formState.errors.date_of_birth
                        ? 'border-red-400 focus:border-red-400'
                        : 'border-neutral-300 focus:border-emerald-600',
                    ].join(' ')}
                    {...profileForm.register('date_of_birth')}
                  />
                  {profileForm.formState.errors.date_of_birth && (
                    <p className="text-red-600 text-xs mt-1" role="alert">
                      {profileForm.formState.errors.date_of_birth.message}
                    </p>
                  )}
                </div>

                {/* Gender — fieldset/legend gives the radio group a proper accessible name */}
                <fieldset className="border-0 p-0 m-0">
                  <legend className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Gender
                    {' '}
                    <span className="text-red-500">*</span>
                  </legend>
                  <div className="flex gap-3">
                    {(['male', 'female', 'other'] as const).map((g) => (
                      <label
                        key={g}
                        htmlFor={`gender-${g}`}
                        className="flex-1 flex items-center gap-2 border border-neutral-300 rounded-xl px-4 py-3 cursor-pointer hover:border-emerald-400 transition-all"
                      >
                        <input
                          id={`gender-${g}`}
                          type="radio"
                          value={g}
                          className="text-emerald-700 focus:ring-emerald-500"
                          {...profileForm.register('gender')}
                        />
                        <span className="text-sm text-neutral-700 capitalize">
                          {g}
                        </span>
                      </label>
                    ))}
                  </div>
                  {profileForm.formState.errors.gender && (
                    <p className="text-red-600 text-xs mt-1" role="alert">
                      {profileForm.formState.errors.gender.message}
                    </p>
                  )}
                </fieldset>

                {/* Email */}
                <div>
                  {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                  >
                    Email Address
                    {' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="priya@email.com"
                    className={[
                      'w-full border rounded-xl px-4 py-3 text-sm text-neutral-900',
                      'focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all',
                      profileForm.formState.errors.email
                        ? 'border-red-400 focus:border-red-400'
                        : 'border-neutral-300 focus:border-emerald-600',
                    ].join(' ')}
                    {...profileForm.register('email')}
                  />
                  {profileForm.formState.errors.email && (
                    <p className="text-red-600 text-xs mt-1" role="alert">
                      {profileForm.formState.errors.email.message}
                    </p>
                  )}
                  <p className="text-xs text-neutral-400 mt-1">
                    Used to send appointment confirmations and prescriptions.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={profileLoading}
                  aria-busy={profileLoading}
                  className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-3 mt-2"
                >
                  {profileLoading ? (
                    <>
                      <Spinner />
                      Creating Account…
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
            </div>
          )}

          <p className="text-center text-xs text-neutral-500 mt-8">
            Are you a doctor?
            {' '}
            <a
              href="/auth/doctor"
              className="text-emerald-700 font-medium hover:underline"
            >
              Sign in to your Doctor Dashboard →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
