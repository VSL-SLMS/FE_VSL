const PRODUCTION_BACKEND_ORIGIN = 'https://bevsl-production.up.railway.app';

const DEFAULT_BACKEND_ORIGIN =
  process.env.NODE_ENV === 'production'
    ? PRODUCTION_BACKEND_ORIGIN
    : 'http://localhost:5050';

function isLocalhostUrl(value) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(value);
}

function removeTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function normalizeBackendOrigin(value) {
  const rawValue = value || DEFAULT_BACKEND_ORIGIN;

  if (process.env.NODE_ENV === 'production' && isLocalhostUrl(rawValue)) {
    return PRODUCTION_BACKEND_ORIGIN;
  }

  return removeTrailingSlash(rawValue).replace(/\/api$/i, '');
}

function normalizeApiBaseUrl(value) {
  const origin = normalizeBackendOrigin(process.env.NEXT_PUBLIC_BACKEND_ORIGIN);
  const rawValue = value || `${origin}/api`;

  if (process.env.NODE_ENV === 'production' && isLocalhostUrl(rawValue)) {
    return `${PRODUCTION_BACKEND_ORIGIN}/api`;
  }

  const cleaned = removeTrailingSlash(rawValue);
  return /\/api$/i.test(cleaned) ? cleaned : `${cleaned}/api`;
}

const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
const BACKEND_ORIGIN = normalizeBackendOrigin(
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN || API_BASE_URL
);

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function backendAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BACKEND_ORIGIN}${path}`;
}

export async function fetchApi(path) {
  const response = await fetch(apiUrl(path), {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`);
  }

  return response.json();
}
