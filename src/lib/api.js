const DEFAULT_BACKEND_ORIGIN =
  process.env.NODE_ENV === 'production'
    ? 'https://bevsl-production.up.railway.app'
    : 'http://localhost:5050';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || `${DEFAULT_BACKEND_ORIGIN}/api`;
const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || DEFAULT_BACKEND_ORIGIN;

export function backendAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BACKEND_ORIGIN}${path}`;
}

export async function fetchApi(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`);
  }

  return response.json();
}
