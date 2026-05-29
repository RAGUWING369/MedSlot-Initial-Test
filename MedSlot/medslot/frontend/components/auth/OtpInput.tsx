'use client';

import {
  useRef,
  useCallback,
  type ClipboardEvent,
  type KeyboardEvent,
  type RefCallback,
} from 'react';

/** Number of OTP digit boxes — fixed at 6 for all MedSlot OTP flows */
const OTP_LENGTH = 6;

export interface OtpInputProps {
  /**
   * Combined digit string e.g. "123456" or partial "12".
   * Length is normalized to OTP_LENGTH internally.
   */
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
  disabled?: boolean;
}

/**
 * 6-box OTP input component (SCR-006 Step 2 spec).
 *
 * Accessibility:
 * - Wrapping div has role="group" and aria-label="Enter 6-digit OTP"
 * - Each input has aria-label="OTP digit N" (N = 1–6)
 * - First box carries autocomplete="one-time-code" for SMS autofill (iOS/Android)
 *
 * Interactions:
 * - Digit entry       : fills current box and auto-advances focus to next box
 * - Backspace (empty) : clears previous box and moves focus back
 * - Backspace (filled): clears current box (stays on same box)
 * - ArrowLeft/Right   : navigate between boxes
 * - Paste             : distributes pasted digits left-to-right; moves focus
 *                       to the box after the last pasted digit
 */
export default function OtpInput({
  value,
  onChange,
  hasError = false,
  disabled = false,
}: OtpInputProps): JSX.Element {
  const refs = useRef<Array<HTMLInputElement | null>>(
    Array(OTP_LENGTH).fill(null) as Array<null>,
  );

  // Normalize value → fixed-length array of single chars ('' for empty positions)
  const digits = Array.from(
    { length: OTP_LENGTH },
    (_, i) => value[i] ?? '',
  );

  const focusAt = useCallback((idx: number): void => {
    const el = refs.current[idx];
    if (el) {
      el.focus();
      // Select existing digit so typing immediately replaces it
      requestAnimationFrame(() => el.select());
    }
  }, []);

  const setRef: (idx: number) => RefCallback<HTMLInputElement> = (idx) => (el) => {
    refs.current[idx] = el;
  };

  const handleChange = (idx: number, rawValue: string): void => {
    // Strip non-digits; keep only the last character (handles replace-on-type)
    const digit = rawValue.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = digit;
    onChange(next.join(''));
    // Auto-advance when a digit is filled
    if (digit && idx < OTP_LENGTH - 1) {
      focusAt(idx + 1);
    }
  };

  const handleKeyDown = (
    idx: number,
    e: KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (e.key === 'Backspace') {
      if (!digits[idx] && idx > 0) {
        // Current box empty → clear previous box and step back
        const next = [...digits];
        next[idx - 1] = '';
        onChange(next.join(''));
        focusAt(idx - 1);
      } else if (digits[idx]) {
        const next = [...digits];
        next[idx] = '';
        onChange(next.join(''));
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      focusAt(idx - 1);
    } else if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) {
      focusAt(idx + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    // Pad to OTP_LENGTH so partial pastes fill from position 0
    onChange(pasted.padEnd(OTP_LENGTH, '').slice(0, OTP_LENGTH));
    focusAt(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  return (
    <div
      className="flex gap-2 justify-center"
      role="group"
      aria-label="Enter 6-digit OTP"
    >
      {Array.from({ length: OTP_LENGTH }, (_, idx) => {
        let borderClass = 'border-neutral-300';
        if (hasError) {
          borderClass = idx === 0 ? 'border-red-400' : 'border-red-300';
        }

        return (
          <input
            key={idx}
            ref={setRef(idx)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[idx]}
            autoComplete={idx === 0 ? 'one-time-code' : 'off'}
            aria-label={`OTP digit ${idx + 1}`}
            disabled={disabled}
            className={[
              'w-11 h-12 text-center text-lg font-bold',
              'border-2 rounded-xl',
              'focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100',
              'transition-all',
              borderClass,
              disabled
                ? 'bg-neutral-50 opacity-60 cursor-not-allowed'
                : 'bg-white',
            ].join(' ')}
            onChange={(e): void => handleChange(idx, e.target.value)}
            onKeyDown={(e): void => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            onFocus={(e): void => e.target.select()}
          />
        );
      })}
    </div>
  );
}
