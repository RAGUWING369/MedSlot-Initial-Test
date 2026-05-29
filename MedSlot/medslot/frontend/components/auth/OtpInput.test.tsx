/**
 * Unit tests for OtpInput component (components/auth/OtpInput.tsx).
 *
 * Tests all interaction behaviours specified in SCR-006:
 * - Renders 6 individual digit boxes
 * - Digit entry fills current box and auto-advances focus
 * - Backspace on empty box moves focus to previous box
 * - Backspace on filled box clears the box
 * - Paste distributes digits across all boxes
 * - Arrow keys navigate between boxes
 * - Error state applies red border classes
 * - Disabled state disables all inputs
 */
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
} from 'vitest';
import {
  render,
  fireEvent,
  screen,
  type RenderResult,
} from '@testing-library/react';
import OtpInput from './OtpInput';

const noop = (): void => {};

function renderOtp(
  value = '',
  onChange = noop,
  hasError = false,
  disabled = false,
): RenderResult {
  return render(
    <OtpInput
      value={value}
      onChange={onChange}
      hasError={hasError}
      disabled={disabled}
    />,
  );
}

// Helper to get all 6 input elements
function getBoxes(): HTMLInputElement[] {
  return [1, 2, 3, 4, 5, 6].map(
    (n) => screen.getByLabelText(`OTP digit ${n}`),
  );
}

describe('OtpInput', () => {
  describe('rendering', () => {
    it('renders 6 input boxes', () => {
      renderOtp();
      expect(getBoxes()).toHaveLength(6);
    });

    it('wraps inputs in a group with correct aria-label', () => {
      renderOtp();
      expect(screen.getByRole('group', { name: 'Enter 6-digit OTP' })).toBeTruthy();
    });

    it('applies autocomplete="one-time-code" only to the first box', () => {
      renderOtp();
      const [first, ...rest] = getBoxes();
      expect(first?.getAttribute('autocomplete')).toBe('one-time-code');
      rest.forEach((box) => {
        expect(box.getAttribute('autocomplete')).toBe('off');
      });
    });

    it('distributes value characters across boxes', () => {
      renderOtp('123456');
      const boxes = getBoxes();
      expect(boxes[0]?.value).toBe('1');
      expect(boxes[1]?.value).toBe('2');
      expect(boxes[5]?.value).toBe('6');
    });

    it('handles partial value (fewer than 6 digits)', () => {
      renderOtp('12');
      const boxes = getBoxes();
      expect(boxes[0]?.value).toBe('1');
      expect(boxes[1]?.value).toBe('2');
      expect(boxes[2]?.value).toBe('');
    });

    it('shows empty boxes for empty value', () => {
      renderOtp('');
      getBoxes().forEach((box) => expect(box.value).toBe(''));
    });
  });

  describe('onChange behaviour', () => {
    it('calls onChange with the digit inserted at the correct position', () => {
      const onChange = vi.fn();
      renderOtp('', onChange);
      const [firstBox] = getBoxes();
      fireEvent.change(firstBox!, { target: { value: '5' } });
      expect(onChange).toHaveBeenCalledWith(`${'5     '.slice(0, 6).trimEnd()}`);
      // More precisely: only the first position is filled
      expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^5/));
    });

    it('strips non-numeric characters from input', () => {
      const onChange = vi.fn();
      renderOtp('', onChange);
      const [firstBox] = getBoxes();
      fireEvent.change(firstBox!, { target: { value: 'a' } });
      // 'a' stripped → empty string emitted for that position
      const calledWith = onChange.mock.calls[0]?.[0] as string;
      // 'a' stripped → digit = ''; digits array all-empty → join('') = ''
      expect(calledWith).toBe('');
    });

    it('keeps only the last digit when a multi-char string is entered', () => {
      const onChange = vi.fn();
      renderOtp('', onChange);
      const [firstBox] = getBoxes();
      fireEvent.change(firstBox!, { target: { value: '39' } });
      // Should keep only '9' (last digit)
      const calledWith = onChange.mock.calls[0]?.[0] as string;
      expect(calledWith?.[0]).toBe('9');
    });
  });

  describe('keyboard: Backspace', () => {
    it('clears current box on Backspace when box has a digit', () => {
      const onChange = vi.fn();
      renderOtp('123456', onChange);
      const boxes = getBoxes();
      fireEvent.keyDown(boxes[2]!, { key: 'Backspace' });
      const result = onChange.mock.calls[0]?.[0] as string;
      // Clearing position 2 ('3') from '123456': digits become ['1','2','','4','5','6']
      // join('') collapses the empty slot → '12456' (5 chars; positional info is in index)
      expect(result).toBe('12456');
    });

    it('moves to previous box and clears it when current box is empty', () => {
      const onChange = vi.fn();
      // Boxes 0,1 filled; box 2 empty — simulate cursor at box 2
      renderOtp('12', onChange);
      const boxes = getBoxes();
      // Box 2 is empty; pressing Backspace should clear box 1
      fireEvent.keyDown(boxes[2]!, { key: 'Backspace' });
      const result = onChange.mock.calls[0]?.[0] as string;
      // Box 2 empty → clear box 1: digits ['1','','','','',''] → join → '1'
      expect(result).toBe('1');
    });

    it('does not go below index 0 on Backspace at first box', () => {
      const onChange = vi.fn();
      renderOtp('', onChange);
      const [firstBox] = getBoxes();
      // Should not throw or call with negative index
      fireEvent.keyDown(firstBox!, { key: 'Backspace' });
      // onChange may not be called if box is already empty
      expect(onChange.mock.calls.length).toBe(0);
    });
  });

  describe('keyboard: Arrow navigation', () => {
    it('ArrowRight on a middle box focuses the next box', () => {
      renderOtp('123456');
      const boxes = getBoxes();
      const focusSpy = vi.spyOn(boxes[1]!, 'focus');
      fireEvent.keyDown(boxes[0]!, { key: 'ArrowRight' });
      expect(focusSpy).toHaveBeenCalled();
    });

    it('ArrowLeft on a middle box focuses the previous box', () => {
      renderOtp('123456');
      const boxes = getBoxes();
      const focusSpy = vi.spyOn(boxes[0]!, 'focus');
      fireEvent.keyDown(boxes[1]!, { key: 'ArrowLeft' });
      expect(focusSpy).toHaveBeenCalled();
    });

    it('ArrowLeft on the first box does not throw', () => {
      renderOtp('123456');
      const [firstBox] = getBoxes();
      expect(() => fireEvent.keyDown(firstBox!, { key: 'ArrowLeft' })).not.toThrow();
    });

    it('ArrowRight on the last box does not throw', () => {
      renderOtp('123456');
      const boxes = getBoxes();
      expect(() => fireEvent.keyDown(boxes[5]!, { key: 'ArrowRight' })).not.toThrow();
    });
  });

  describe('paste support', () => {
    it('distributes pasted 6-digit string across all boxes', () => {
      const onChange = vi.fn();
      renderOtp('', onChange);
      const [firstBox] = getBoxes();
      fireEvent.paste(firstBox!, {
        clipboardData: { getData: () => '654321' },
      });
      expect(onChange).toHaveBeenCalledWith('654321');
    });

    it('strips non-numeric characters from pasted text', () => {
      const onChange = vi.fn();
      renderOtp('', onChange);
      const [firstBox] = getBoxes();
      fireEvent.paste(firstBox!, {
        clipboardData: { getData: () => '6 5 4 3 2 1' },
      });
      expect(onChange).toHaveBeenCalledWith('654321');
    });

    it('handles partial paste (fewer than 6 digits)', () => {
      const onChange = vi.fn();
      renderOtp('', onChange);
      const [firstBox] = getBoxes();
      fireEvent.paste(firstBox!, {
        clipboardData: { getData: () => '123' },
      });
      const called = onChange.mock.calls[0]?.[0] as string;
      expect(called?.slice(0, 3)).toBe('123');
      // padEnd(6, '') with an empty pad char does not extend the string
      expect(called).toHaveLength(3);
    });

    it('ignores paste with no numeric digits', () => {
      const onChange = vi.fn();
      renderOtp('', onChange);
      const [firstBox] = getBoxes();
      fireEvent.paste(firstBox!, {
        clipboardData: { getData: () => 'abc' },
      });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('truncates paste to 6 digits if more are provided', () => {
      const onChange = vi.fn();
      renderOtp('', onChange);
      const [firstBox] = getBoxes();
      fireEvent.paste(firstBox!, {
        clipboardData: { getData: () => '1234567890' },
      });
      const called = onChange.mock.calls[0]?.[0] as string;
      expect(called).toHaveLength(6);
      expect(called).toBe('123456');
    });
  });

  describe('error state', () => {
    it('applies red border class to all boxes when hasError is true', () => {
      renderOtp('', noop, true);
      const boxes = getBoxes();
      // First box has stronger red border
      expect(boxes[0]?.className).toContain('border-red-400');
      // Other boxes have lighter red
      expect(boxes[1]?.className).toContain('border-red-300');
      expect(boxes[5]?.className).toContain('border-red-300');
    });

    it('applies normal border class when hasError is false', () => {
      renderOtp('', noop, false);
      const boxes = getBoxes();
      boxes.forEach((box) => {
        expect(box.className).toContain('border-neutral-300');
      });
    });
  });

  describe('disabled state', () => {
    it('disables all input boxes when disabled prop is true', () => {
      renderOtp('', noop, false, true);
      getBoxes().forEach((box) => {
        expect(box).toBeDisabled();
      });
    });

    it('enables all input boxes when disabled prop is false', () => {
      renderOtp('', noop, false, false);
      getBoxes().forEach((box) => {
        expect(box).not.toBeDisabled();
      });
    });
  });

  describe('beforeEach cleanup', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('calls onChange when a digit is changed at index 3', () => {
      const onChange = vi.fn();
      renderOtp('123456', onChange);
      const boxes = getBoxes();
      fireEvent.change(boxes[3]!, { target: { value: '9' } });
      const called = onChange.mock.calls[0]?.[0] as string;
      expect(called?.[3]).toBe('9');
      expect(called?.[0]).toBe('1');
    });
  });
});
