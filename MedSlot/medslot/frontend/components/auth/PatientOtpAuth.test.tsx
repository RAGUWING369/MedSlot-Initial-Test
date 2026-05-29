/**
 * Integration tests for PatientOtpAuth component (components/auth/PatientOtpAuth.tsx).
 *
 * Tests all 3 wizard steps, error states, lockout, resend timer, and redirect behaviour.
 * API calls are mocked via vi.mock; router.push is spied on.
 * Zustand authStore runs real (reset in beforeEach) — localStorage side effect verified.
 *
 * Covers acceptance criteria from TASK-014:
 * - Step 1 phone form renders and submits
 * - Step 2 OTP form renders with 6-box input; verify button works
 * - Step 3 profile form renders for new users
 * - Loading spinners shown during API calls
 * - Error banners shown for API failures
 * - Lockout panel rendered on 429 verify response
 * - Resend OTP timer countdown
 * - authStore.setAuth called after successful verify
 * - router.push('/dashboard') called on success
 */
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type Mock,
} from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import useAuthStore from '../../lib/stores/authStore';

// Import mocked module after vi.mock declaration
import {
  requestOtp,
  verifyOtp,
  createPatientProfile,
} from '../../lib/api/auth';

// Import component under test after all mocks are in place
import PatientOtpAuth from './PatientOtpAuth';

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('../../lib/api/auth', () => ({
  requestOtp: vi.fn(),
  verifyOtp: vi.fn(),
  createPatientProfile: vi.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockRequestOtp = requestOtp as Mock;
const mockVerifyOtp = verifyOtp as Mock;
const mockCreatePatientProfile = createPatientProfile as Mock;

const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.payload.sig';
const MOCK_USER = {
  id: 'uuid-123',
  phone: '+919876543210',
  role: 'patient' as const,
};

/** Type a phone number into the step-1 input field */
function enterPhone(phone = '9876543210'): void {
  const input = screen.getByLabelText('Mobile Number');
  fireEvent.change(input, { target: { value: phone } });
}

/** Click the "Send OTP" button */
function clickSendOtp(): void {
  fireEvent.click(screen.getByRole('button', { name: /send otp/i }));
}

/** Fill all 6 OTP digit boxes */
function fillOtp(digits = '123456'): void {
  for (let i = 0; i < 6; i += 1) {
    const box = screen.getByLabelText(`OTP digit ${i + 1}`);
    fireEvent.change(box, { target: { value: digits[i] } });
  }
}

/** Click the "Verify OTP" button */
function clickVerify(): void {
  fireEvent.click(screen.getByRole('button', { name: /verify otp/i }));
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('PatientOtpAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Zustand store
    act(() => {
      useAuthStore.getState().clearAuth();
    });
    localStorage.clear();
    // NOTE: Do NOT call vi.useFakeTimers() globally here.
    // @testing-library/react's waitFor polls via real setTimeout; fake timers
    // would prevent those polling ticks from ever firing, causing all waitFor
    // calls to hang until the 5 000 ms Jest timeout. Timer-controlled tests
    // install fake timers locally and restore them in a finally block.
  });

  // ── Step 1: Phone entry ───────────────────────────────────────────────────

  describe('Step 1 — Phone entry', () => {
    it('renders the phone entry form', () => {
      render(<PatientOtpAuth />);
      expect(screen.getByText('Sign in or Register')).toBeTruthy();
      expect(screen.getByLabelText('Mobile Number')).toBeTruthy();
      expect(screen.getByRole('button', { name: /send otp/i })).toBeTruthy();
    });

    it('shows the +91 prefix indicator', () => {
      render(<PatientOtpAuth />);
      expect(screen.getByText(/\+91/)).toBeTruthy();
    });

    it('shows step 1 active in the step indicator', () => {
      render(<PatientOtpAuth />);
      // Step 1 indicator should be active (emerald-800 bubble with "1")
      expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    });

    it('shows doctor link below the card', () => {
      render(<PatientOtpAuth />);
      expect(screen.getByText(/are you a doctor/i)).toBeTruthy();
    });

    it('calls requestOtp with +91-prefixed phone on submit', async () => {
      mockRequestOtp.mockResolvedValue(undefined);
      render(<PatientOtpAuth />);
      enterPhone('9876543210');
      clickSendOtp();
      await waitFor(() => {
        expect(mockRequestOtp).toHaveBeenCalledWith('+919876543210');
      });
    });

    it('advances to step 2 after successful OTP send', async () => {
      mockRequestOtp.mockResolvedValue(undefined);
      render(<PatientOtpAuth />);
      enterPhone('9876543210');
      clickSendOtp();
      await waitFor(() => {
        expect(screen.getByText('Enter OTP')).toBeTruthy();
      });
    });

    it('shows inline validation error for invalid phone on submit', async () => {
      render(<PatientOtpAuth />);
      enterPhone('12345'); // invalid — starts with 1, too short
      clickSendOtp();
      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid indian mobile number/i),
        ).toBeTruthy();
      });
    });

    it('shows error banner on 429 (rate limited) response', async () => {
      const err = Object.assign(new Error('429'), {
        isAxiosError: true,
        response: { status: 429 },
      });
      mockRequestOtp.mockRejectedValue(err);
      render(<PatientOtpAuth />);
      enterPhone('9876543210');
      clickSendOtp();
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeTruthy();
        expect(screen.getByText(/too many requests/i)).toBeTruthy();
      });
    });

    it('shows error banner on 503 (SMS failure) response', async () => {
      const err = Object.assign(new Error('503'), {
        isAxiosError: true,
        response: { status: 503 },
      });
      mockRequestOtp.mockRejectedValue(err);
      render(<PatientOtpAuth />);
      enterPhone('9876543210');
      clickSendOtp();
      await waitFor(() => {
        expect(screen.getByText(/couldn't send the otp/i)).toBeTruthy();
      });
    });

    it('shows loading state on Send OTP button while request is in flight', async () => {
      let resolve: () => void;
      mockRequestOtp.mockReturnValue(
        new Promise<void>((r) => { resolve = r; }),
      );
      render(<PatientOtpAuth />);
      enterPhone('9876543210');
      // async act + await Promise.resolve() lets RHF's async handleSubmit run its
      // validation microtask before setSendLoading(true) is called in handleSendOtp
      await act(async () => { clickSendOtp(); await Promise.resolve(); });
      // The button renders <Spinner /> + text node when loading; query the button via aria-busy
      const btn = screen.getByRole('button', { name: /sending otp/i });
      expect(btn).toBeTruthy();
      expect(btn).toBeDisabled();
      // Resolve the pending mock so the component can clean up; async act awaits async state
      await act(async () => {
        resolve!();
        await Promise.resolve(); // flush handleSendOtp continuation
      });
    });
  });

  // ── Step 2: OTP entry ─────────────────────────────────────────────────────

  describe('Step 2 — OTP entry', () => {
    async function goToStep2(): Promise<void> {
      mockRequestOtp.mockResolvedValue(undefined);
      render(<PatientOtpAuth />);
      enterPhone('9876543210');
      clickSendOtp();
      await waitFor(() => screen.getByText('Enter OTP'));
    }

    it('renders 6 OTP digit boxes', async () => {
      await goToStep2();
      for (let i = 1; i <= 6; i += 1) {
        expect(screen.getByLabelText(`OTP digit ${i}`)).toBeTruthy();
      }
    });

    it('shows the phone number in the OTP step heading', async () => {
      await goToStep2();
      expect(screen.getByText(/\+91 9876543210/)).toBeTruthy();
    });

    it('shows resend timer immediately after arriving at step 2', async () => {
      await goToStep2();
      expect(screen.getByText(/30s/)).toBeTruthy();
    });

    it('Resend OTP button is disabled while timer is counting', async () => {
      await goToStep2();
      const resendBtn = screen.getByRole('button', { name: /resend otp/i });
      expect(resendBtn).toBeDisabled();
    });

    it('Resend OTP button becomes enabled after timer expires', async () => {
      // Use local fake timers — waitFor is not called inside this test,
      // so the fake-timer / waitFor conflict does not apply.
      vi.useFakeTimers();
      try {
        mockRequestOtp.mockResolvedValue(undefined);
        render(<PatientOtpAuth />);
        enterPhone('9876543210');
        // Drive the async send handler to completion without waitFor
        await act(async () => {
          clickSendOtp();
          await Promise.resolve(); // let requestOtp promise resolve
          await Promise.resolve(); // let setStep(2) state update flush
          await Promise.resolve(); // extra flush for React batching
        });
        expect(screen.getByText('Enter OTP')).toBeTruthy();
        // Advance all 30 × 1 000 ms ticks of the resend countdown
        act(() => { vi.advanceTimersByTime(30_000); });
        expect(screen.getByRole('button', { name: /resend otp/i })).not.toBeDisabled();
      } finally {
        vi.useRealTimers();
      }
    });

    it('calls verifyOtp with phone and OTP code on Verify click', async () => {
      await goToStep2();
      mockVerifyOtp.mockResolvedValue({
        token: MOCK_TOKEN,
        is_new_user: false,
        user: MOCK_USER,
      });
      fillOtp('654321');
      clickVerify();
      await waitFor(() => {
        expect(mockVerifyOtp).toHaveBeenCalledWith('+919876543210', '654321');
      });
    });

    it('shows success panel and redirects to /dashboard for returning user', async () => {
      await goToStep2();
      mockVerifyOtp.mockResolvedValue({
        token: MOCK_TOKEN,
        is_new_user: false,
        user: MOCK_USER,
      });
      fillOtp('654321');
      clickVerify();
      await waitFor(() => {
        expect(screen.getByText(/you're signed in/i)).toBeTruthy();
      });
      // The component uses setTimeout(1500) for the redirect; wait up to 3 s
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      }, { timeout: 3000 });
    });

    it('stores JWT in authStore after successful verify', async () => {
      await goToStep2();
      mockVerifyOtp.mockResolvedValue({
        token: MOCK_TOKEN,
        is_new_user: false,
        user: MOCK_USER,
      });
      fillOtp('654321');
      clickVerify();
      await waitFor(() => {
        expect(localStorage.getItem('medslot_token')).toBe(MOCK_TOKEN);
      });
    });

    it('advances to step 3 for new users', async () => {
      await goToStep2();
      mockVerifyOtp.mockResolvedValue({
        token: MOCK_TOKEN,
        is_new_user: true,
        user: MOCK_USER,
      });
      fillOtp('654321');
      clickVerify();
      await waitFor(() => {
        expect(screen.getByText('Complete Your Profile')).toBeTruthy();
      });
    });

    it('shows inline error on 400 (invalid OTP)', async () => {
      await goToStep2();
      const err = Object.assign(new Error('400'), {
        isAxiosError: true,
        response: { status: 400, data: { attempts_remaining: 2 } },
      });
      mockVerifyOtp.mockRejectedValue(err);
      fillOtp('000000');
      clickVerify();
      await waitFor(() => {
        expect(screen.getByText(/incorrect otp.*2 attempt/i)).toBeTruthy();
      });
    });

    it('shows lockout panel on 429 response', async () => {
      await goToStep2();
      const err = Object.assign(new Error('429'), {
        isAxiosError: true,
        response: { status: 429 },
      });
      mockVerifyOtp.mockRejectedValue(err);
      fillOtp('000000');
      clickVerify();
      await waitFor(() => {
        expect(screen.getByText(/too many failed attempts/i)).toBeTruthy();
        expect(screen.getByText(/15 minutes/i)).toBeTruthy();
      });
    });

    it('lockout panel does not show a retry button', async () => {
      await goToStep2();
      const err = Object.assign(new Error('429'), {
        isAxiosError: true,
        response: { status: 429 },
      });
      mockVerifyOtp.mockRejectedValue(err);
      fillOtp('000000');
      clickVerify();
      await waitFor(() => screen.getByText(/too many failed attempts/i));
      expect(screen.queryByRole('button', { name: /retry/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /try again/i })).toBeNull();
    });

    it('shows validation error when Verify is clicked with incomplete OTP', async () => {
      await goToStep2();
      // Only fill 3 digits
      for (let i = 0; i < 3; i += 1) {
        fireEvent.change(screen.getByLabelText(`OTP digit ${i + 1}`), {
          target: { value: String(i + 1) },
        });
      }
      clickVerify();
      await waitFor(() => {
        expect(screen.getByText(/please enter all 6 digits/i)).toBeTruthy();
      });
    });

    it('returns to step 1 when "Change number" is clicked', async () => {
      await goToStep2();
      fireEvent.click(screen.getByRole('button', { name: /change number/i }));
      expect(screen.getByText('Sign in or Register')).toBeTruthy();
    });

    it('resend OTP calls requestOtp and restarts timer', async () => {
      vi.useFakeTimers();
      try {
        mockRequestOtp.mockResolvedValue(undefined);
        render(<PatientOtpAuth />);
        enterPhone('9876543210');
        // Navigate to step 2 without waitFor
        await act(async () => {
          clickSendOtp();
          await Promise.resolve();
          await Promise.resolve();
          await Promise.resolve();
        });
        expect(screen.getByText('Enter OTP')).toBeTruthy();
        // Expire the resend cooldown
        act(() => { vi.advanceTimersByTime(30_000); });
        expect(screen.getByRole('button', { name: /resend otp/i })).not.toBeDisabled();
        // Click resend and flush the second requestOtp call
        await act(async () => {
          fireEvent.click(screen.getByRole('button', { name: /resend otp/i }));
          await Promise.resolve();
          await Promise.resolve();
          await Promise.resolve();
        });
        // initial send + resend = 2 total calls
        expect(mockRequestOtp).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ── Step 3: Profile form ──────────────────────────────────────────────────

  describe('Step 3 — Profile form (new users)', () => {
    async function goToStep3(): Promise<void> {
      mockRequestOtp.mockResolvedValue(undefined);
      mockVerifyOtp.mockResolvedValue({
        token: MOCK_TOKEN,
        is_new_user: true,
        user: MOCK_USER,
      });
      render(<PatientOtpAuth />);
      enterPhone('9876543210');
      clickSendOtp();
      await waitFor(() => screen.getByText('Enter OTP'));
      fillOtp('123456');
      clickVerify();
      await waitFor(() => screen.getByText('Complete Your Profile'));
    }

    it('renders all profile fields', async () => {
      await goToStep3();
      expect(screen.getByLabelText(/full name/i)).toBeTruthy();
      expect(screen.getByLabelText(/date of birth/i)).toBeTruthy();
      expect(screen.getByLabelText(/email address/i)).toBeTruthy();
      // Gender radios
      expect(screen.getByRole('radio', { name: /^male$/i })).toBeTruthy();
      expect(screen.getByRole('radio', { name: /female/i })).toBeTruthy();
      expect(screen.getByRole('radio', { name: /other/i })).toBeTruthy();
    });

    it('calls createPatientProfile with correct data on submit', async () => {
      await goToStep3();
      mockCreatePatientProfile.mockResolvedValue(undefined);

      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'Priya Sharma' },
      });
      fireEvent.change(screen.getByLabelText(/date of birth/i), {
        target: { value: '1995-06-15' },
      });
      fireEvent.click(screen.getByRole('radio', { name: /female/i }));
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'priya@example.com' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockCreatePatientProfile).toHaveBeenCalledWith({
          full_name: 'Priya Sharma',
          date_of_birth: '1995-06-15',
          gender: 'female',
          email: 'priya@example.com',
        });
      });
    });

    it('shows success panel and redirects after profile creation', async () => {
      await goToStep3();
      mockCreatePatientProfile.mockResolvedValue(undefined);

      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'Priya Sharma' },
      });
      fireEvent.change(screen.getByLabelText(/date of birth/i), {
        target: { value: '1995-06-15' },
      });
      fireEvent.click(screen.getByRole('radio', { name: /female/i }));
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'priya@example.com' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/you're signed in/i)).toBeTruthy();
      });
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      }, { timeout: 3000 });
    });

    it('shows validation error when full_name is empty', async () => {
      await goToStep3();
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      await waitFor(() => {
        expect(screen.getByText(/please enter your full name/i)).toBeTruthy();
      });
    });

    it('shows validation error for invalid email', async () => {
      await goToStep3();
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'Priya' },
      });
      fireEvent.change(screen.getByLabelText(/date of birth/i), {
        target: { value: '1995-06-15' },
      });
      fireEvent.click(screen.getByRole('radio', { name: /female/i }));
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'notvalid' },
      });
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeTruthy();
      });
    });

    it('shows server error banner on 400 response from createPatientProfile', async () => {
      await goToStep3();
      const err = Object.assign(new Error('400'), {
        isAxiosError: true,
        response: {
          status: 400,
          data: { email: ['Enter a valid email address.'] },
        },
      });
      mockCreatePatientProfile.mockRejectedValue(err);

      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'Priya Sharma' },
      });
      fireEvent.change(screen.getByLabelText(/date of birth/i), {
        target: { value: '1995-06-15' },
      });
      fireEvent.click(screen.getByRole('radio', { name: /female/i }));
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'priya@example.com' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeTruthy();
        expect(screen.getByText(/enter a valid email address/i)).toBeTruthy();
      });
    });
  });
});
