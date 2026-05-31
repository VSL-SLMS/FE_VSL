'use server';

import { cookies } from 'next/headers';
import { apiUrl } from '../../lib/api';

async function getSessionUser() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get('slms_session')?.value;
  if (!rawSession) return null;
  try {
    return JSON.parse(rawSession);
  } catch {
    return null;
  }
}

export async function createPaymentAction(tokenOverride) {
  const user = await getSessionUser();
  const token = tokenOverride || user?.token;
  if (!token) {
    return { success: false, message: 'Authentication required.' };
  }

  try {
    const response = await fetch(apiUrl('/payments/vnpay/create'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });

    const payload = await response.json();
    if (!response.ok) {
      return { success: false, message: payload.message || 'Failed to create payment.' };
    }

    return { success: true, data: payload.data };
  } catch (error) {
    return { success: false, message: 'Network error or backend is offline.' };
  }
}

export async function verifyPaymentAction(searchParams) {
  const user = await getSessionUser();
  const headers = {};
  if (user && user.token) {
    headers.Authorization = `Bearer ${user.token}`;
  }

  try {
    const query = new URLSearchParams(searchParams).toString();
    const response = await fetch(apiUrl(`/payments/vnpay/return?${query}`), {
      method: 'GET',
      headers,
      cache: 'no-store'
    });

    const payload = await response.json();
    if (!response.ok) {
      return { success: false, message: payload.message || 'Failed to verify payment.' };
    }

    return { success: true, data: payload.data };
  } catch (error) {
    return { success: false, message: 'Network error or backend is offline.' };
  }
}

export async function getPricingAction() {
  try {
    const response = await fetch(apiUrl('/pricing'), {
      method: 'GET',
      cache: 'no-store'
    });

    const payload = await response.json();
    if (!response.ok) {
      return { success: false, message: payload.message || 'Failed to fetch pricing.' };
    }

    return { success: true, data: payload.data.pricing };
  } catch (error) {
    return { success: false, message: 'Network error or backend is offline.' };
  }
}
