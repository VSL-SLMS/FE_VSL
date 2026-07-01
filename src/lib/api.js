const PRODUCTION_BACKEND_ORIGIN = 'https://bevsl-production.up.railway.app';

const DEFAULT_BACKEND_ORIGIN =
  process.env.NODE_ENV === 'production'
    ? PRODUCTION_BACKEND_ORIGIN
    : 'http://localhost:5050';
const DEFAULT_FETCH_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || 5000);

function isLocalhostUrl(value) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(value);
}

function removeTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function normalizeUrlValue(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function normalizeBackendOrigin(value) {
  const rawValue = normalizeUrlValue(value || DEFAULT_BACKEND_ORIGIN);

  if (process.env.NODE_ENV === 'production' && isLocalhostUrl(rawValue)) {
    return PRODUCTION_BACKEND_ORIGIN;
  }

  return removeTrailingSlash(rawValue).replace(/\/api$/i, '');
}

function normalizeApiBaseUrl(value) {
  const origin = normalizeBackendOrigin(process.env.NEXT_PUBLIC_BACKEND_ORIGIN);
  const rawValue = normalizeUrlValue(value || `${origin}/api`);

  if (process.env.NODE_ENV === 'production' && isLocalhostUrl(rawValue)) {
    return `${PRODUCTION_BACKEND_ORIGIN}/api`;
  }

  const cleaned = removeTrailingSlash(rawValue);
  return /\/api$/i.test(cleaned) ? cleaned : `${cleaned}/api`;
}

const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
const BACKEND_ORIGIN = normalizeBackendOrigin(process.env.NEXT_PUBLIC_BACKEND_ORIGIN);

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function createTimeoutSignal() {
  if (DEFAULT_FETCH_TIMEOUT_MS <= 0) return undefined;
  if (typeof AbortSignal === 'undefined' || typeof AbortSignal.timeout !== 'function') return undefined;
  return AbortSignal.timeout(DEFAULT_FETCH_TIMEOUT_MS);
}

export function backendAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BACKEND_ORIGIN}${path}`;
}

async function fetchJson(url, options = {}) {
  const timeoutSignal = options.signal || createTimeoutSignal();

  const response = await fetch(url, {
    cache: 'no-store',
    ...options,
    signal: timeoutSignal,
    headers: {
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const error = new Error(`Backend request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function fetchApi(path, options = {}) {
  return fetchJson(apiUrl(path), options);
}
