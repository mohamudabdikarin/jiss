import axios from 'axios';
import { normalizeApiBaseUrl } from './normalizeApiBaseUrl';
import { getStoredRefreshToken, setStoredRefreshToken } from './authStorage';

const API_BASE = normalizeApiBaseUrl(import.meta.env.VITE_API_URL, '/api/v1');

/** Avoid refresh loop on intentional 401s from these routes */
const SKIP_REFRESH_ON_401 = ['/auth/login', '/auth/forgot-password', '/auth/reset-password'];

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const reqPath = originalRequest.url || '';
    const shouldTryRefresh =
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !SKIP_REFRESH_ON_401.some((p) => reqPath.startsWith(p));

    if (!shouldTryRefresh) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }).catch(err => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const rt = getStoredRefreshToken();
      const { data } = await axios.post(
        `${API_BASE}/auth/refresh-token`,
        rt ? { refreshToken: rt } : {},
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
      );
      const newToken = data.data.accessToken;
      if (data.data.refreshToken) setStoredRefreshToken(data.data.refreshToken);
      localStorage.setItem('accessToken', newToken);
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (err) {
      processQueue(err, null);
      localStorage.removeItem('accessToken');
      setStoredRefreshToken(null);
      window.location.href = '/login';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
