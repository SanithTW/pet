import axios from 'axios';
import Constants from 'expo-constants';

const expoConfig = Constants.expoConfig || Constants.manifest;

const fromEnv =
  typeof process.env.EXPO_PUBLIC_API_BASE_URL === 'string'
    ? process.env.EXPO_PUBLIC_API_BASE_URL.trim()
    : '';
const fromExtra =
  typeof expoConfig?.extra?.apiUrl === 'string' ? expoConfig.extra.apiUrl.trim() : '';

const apiUrl = fromEnv || fromExtra;

if (!apiUrl) {
  throw new Error(
    'Set EXPO_PUBLIC_API_BASE_URL in pet-care-mobile/.env (copy from .env.example). Example: http://127.0.0.1:5000/api'
  );
}

const api = axios.create({
  baseURL: apiUrl,
});

export const apiBaseUrl = apiUrl;

/** Server origin for static files (same host as API, `/uploads` is not under `/api`). */
export function getBackendOrigin() {
  const base = typeof api.defaults.baseURL === 'string' ? api.defaults.baseURL.trim() : '';
  if (!base) {
    throw new Error('API base URL is not configured');
  }
  const trimmed = base.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed.slice(0, -'/api'.length) : trimmed;
}

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export default api;
