/**
 * Unit tests for Axios API client (lib/api.ts).
 *
 * Tests the request and response interceptors without making real HTTP calls.
 * axios-mock-adapter mocks HTTP responses at the adapter level.
 *
 * Covers:
 * - Bearer token injection when token is in localStorage
 * - No token injection when localStorage is empty
 * - 401 response: token cleared from localStorage
 * - Non-401 errors: token NOT cleared (preserved for retry)
 */
import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import apiClient from './api';

const mock = new MockAdapter(apiClient);

describe('apiClient', () => {
  beforeEach(() => {
    mock.reset();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('request interceptor', () => {
    it('sets Authorization header when token is in localStorage', async () => {
      localStorage.setItem('medslot_token', 'test-jwt-token');
      mock.onGet('/api/v1/test/').reply(200, { ok: true });

      await apiClient.get('/api/v1/test/');

      const requestConfig = (mock.history.get ?? [])[0];
      expect(requestConfig?.headers?.Authorization).toBe('Bearer test-jwt-token');
    });

    it('does not set Authorization header when no token in localStorage', async () => {
      mock.onGet('/api/v1/test/').reply(200, {});

      await apiClient.get('/api/v1/test/');

      const requestConfig = (mock.history.get ?? [])[0];
      expect(requestConfig?.headers?.Authorization).toBeUndefined();
    });
  });

  describe('response interceptor — 401 handling', () => {
    it('clears localStorage token on 401 response', async () => {
      localStorage.setItem('medslot_token', 'expired-token');
      mock.onGet('/api/v1/protected/').reply(401);

      // Suppress jsdom window.location.href assignment
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { ...originalLocation, href: '' },
      });

      try {
        await apiClient.get('/api/v1/protected/');
      } catch {
        // Expected — 401 rejects the promise
      }

      expect(localStorage.getItem('medslot_token')).toBeNull();

      // Restore
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });

    it('redirects to /login on 401 response', async () => {
      localStorage.setItem('medslot_token', 'expired-token');
      mock.onGet('/api/v1/protected/').reply(401);

      let capturedHref = '';
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: {
          ...window.location,
          // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
          set href(val: string) { capturedHref = val; },
          // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
          get href() { return capturedHref; },
        },
      });

      try {
        await apiClient.get('/api/v1/protected/');
      } catch {
        // Expected
      }

      expect(capturedHref).toBe('/login');

      Object.defineProperty(window, 'location', {
        configurable: true,
        value: window.location,
      });
    });
  });

  describe('response interceptor — non-401 errors', () => {
    it('passes through 500 errors without clearing token', async () => {
      localStorage.setItem('medslot_token', 'valid-token');
      mock.onGet('/api/v1/test/').reply(500);

      try {
        await apiClient.get('/api/v1/test/');
      } catch {
        // Expected
      }

      expect(localStorage.getItem('medslot_token')).toBe('valid-token');
    });

    it('passes through 403 errors without clearing token', async () => {
      localStorage.setItem('medslot_token', 'valid-token');
      mock.onGet('/api/v1/admin/').reply(403);

      try {
        await apiClient.get('/api/v1/admin/');
      } catch {
        // Expected
      }

      expect(localStorage.getItem('medslot_token')).toBe('valid-token');
    });

    it('passes through 404 errors without clearing token', async () => {
      localStorage.setItem('medslot_token', 'valid-token');
      mock.onGet('/api/v1/missing/').reply(404);

      try {
        await apiClient.get('/api/v1/missing/');
      } catch {
        // Expected
      }

      expect(localStorage.getItem('medslot_token')).toBe('valid-token');
    });
  });

  describe('successful responses', () => {
    it('returns 200 response data correctly', async () => {
      const responseData = { id: '123', name: 'Test' };
      mock.onGet('/api/v1/resource/').reply(200, responseData);

      const response = await apiClient.get('/api/v1/resource/');

      expect(response.status).toBe(200);
      expect(response.data).toEqual(responseData);
    });

    it('returns 201 response data for POST requests', async () => {
      const payload = { phone: '+919876543210' };
      const responseData = { id: 'new-id', ...payload };
      mock.onPost('/api/v1/resource/').reply(201, responseData);

      const response = await apiClient.post('/api/v1/resource/', payload);

      expect(response.status).toBe(201);
      expect(response.data).toEqual(responseData);
    });
  });
});
