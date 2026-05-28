/**
 * Axios HTTP client for MedSlot frontend.
 *
 * Provides a pre-configured Axios instance with:
 * - Base URL from NEXT_PUBLIC_API_URL environment variable
 * - Automatic JWT Bearer token injection from localStorage (written by authStore)
 * - 401 response interceptor: clears stored token and redirects to /login
 *
 * Usage:
 *   import apiClient from '@/lib/api';
 *   const response = await apiClient.get('/api/v1/patient/profile/');
 */
import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

/** Token key — must match TOKEN_STORAGE_KEY in authStore.ts */
const TOKEN_STORAGE_KEY = 'medslot_token';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // 15 second client timeout — NFR-PE-001 requires P95 < 200ms; this is a last-resort safety net
  timeout: 15000,
});

/**
 * Request interceptor: inject JWT Bearer token if present in localStorage.
 *
 * Token is stored as 'medslot_token' in localStorage by the authStore.
 * On the server (SSR), localStorage is unavailable — token injection is skipped safely.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (token !== null && config.headers) {
        // eslint-disable-next-line no-param-reassign
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

/**
 * Response interceptor: handle 401 Unauthorised globally.
 *
 * On 401: clears stored token and redirects to /login.
 * All other errors are passed through to the caller for feature-level handling.
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
