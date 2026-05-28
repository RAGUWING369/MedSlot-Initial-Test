/**
 * Zustand authentication store for MedSlot.
 *
 * Manages auth state across the application:
 * - user: Basic user info (id, phone, role) — PHI-free; no health data stored here
 * - token: JWT access token (also persisted to localStorage for Axios interceptor)
 * - role: User role ('patient' | 'doctor' | 'admin' | null)
 * - isAuthenticated: Derived boolean convenience flag
 *
 * setAuth: called after successful OTP verification (accounts/views.py OTPVerifyView)
 * clearAuth: called on logout or 401 response (api.ts interceptor)
 *
 * Token persistence strategy:
 *   Token is stored in localStorage under 'medslot_token' so the Axios interceptor
 *   in lib/api.ts can access it without importing this store (avoids circular deps).
 *   Zustand's `persist` middleware is intentionally NOT used — manual control gives
 *   explicit visibility over when the token is written and cleared.
 */
import { create } from 'zustand';

/** Token key shared with api.ts — do not change without updating both files */
const TOKEN_STORAGE_KEY = 'medslot_token';

/** Role values must match the backend CustomUser.UserRole choices */
export type UserRole = 'patient' | 'doctor' | 'admin';

/**
 * Basic user identity stored in auth state.
 * Contains no PHI — only identity fields needed for routing and UI role gates.
 */
export interface AuthUser {
  /** UUID primary key from CustomUser model */
  id: string;
  /** E.164 format phone number e.g. +919876543210 */
  phone: string;
  /** User's platform role */
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  /** Set authenticated state after successful OTP verification */
  setAuth: (user: AuthUser, token: string) => void;
  /** Clear all auth state (logout or 401 response) */
  clearAuth: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,

  setAuth: (user: AuthUser, token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
    set({
      user,
      token,
      role: user.role,
      isAuthenticated: true,
    });
  },

  clearAuth: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    set({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
    });
  },
}));

export default useAuthStore;
