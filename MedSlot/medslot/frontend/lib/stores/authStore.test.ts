/**
 * Unit tests for Zustand authStore.
 *
 * Tests cover all state transitions and localStorage side effects.
 * Store state is reset between tests via clearAuth() in beforeEach.
 * localStorage is provided by jsdom (vitest.config.ts environment: 'jsdom').
 */
import {
  describe, it, expect, beforeEach,
} from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useAuthStore, { type AuthUser } from './authStore';

const mockUser: AuthUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  phone: '+919876543210',
  role: 'patient',
};

const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    act(() => {
      useAuthStore.getState().clearAuth();
    });
    localStorage.clear();
  });

  it('initial state is unauthenticated', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.role).toBeNull();
  });

  it('setAuth sets user, token, role, and isAuthenticated', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.setAuth(mockUser, mockToken);
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
    expect(result.current.role).toBe('patient');
  });

  it('setAuth persists token to localStorage', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.setAuth(mockUser, mockToken);
    });
    expect(localStorage.getItem('medslot_token')).toBe(mockToken);
  });

  it('clearAuth resets all state to unauthenticated', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.setAuth(mockUser, mockToken);
    });
    act(() => {
      result.current.clearAuth();
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.role).toBeNull();
  });

  it('clearAuth removes token from localStorage', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.setAuth(mockUser, mockToken);
    });
    act(() => {
      result.current.clearAuth();
    });
    expect(localStorage.getItem('medslot_token')).toBeNull();
  });

  it('setAuth works for doctor role', () => {
    const doctorUser: AuthUser = { ...mockUser, role: 'doctor' };
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.setAuth(doctorUser, mockToken);
    });
    expect(result.current.role).toBe('doctor');
  });

  it('setAuth works for admin role', () => {
    const adminUser: AuthUser = { ...mockUser, role: 'admin' };
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.setAuth(adminUser, mockToken);
    });
    expect(result.current.role).toBe('admin');
  });

  it('setAuth replaces previous auth state when called again', () => {
    const { result } = renderHook(() => useAuthStore());
    const secondUser: AuthUser = { id: 'abc-123', phone: '+919876543211', role: 'doctor' };
    act(() => {
      result.current.setAuth(mockUser, mockToken);
    });
    act(() => {
      result.current.setAuth(secondUser, 'new-token');
    });
    expect(result.current.user).toEqual(secondUser);
    expect(result.current.token).toBe('new-token');
    expect(result.current.role).toBe('doctor');
    expect(localStorage.getItem('medslot_token')).toBe('new-token');
  });

  it('clearAuth on already-cleared state is a no-op', () => {
    const { result } = renderHook(() => useAuthStore());
    // clearAuth on initial (already cleared) state should not throw
    expect(() => {
      act(() => {
        result.current.clearAuth();
      });
    }).not.toThrow();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
