'use server';

import { cookies } from 'next/headers';
import { apiUrl } from '../../lib/api';

function normalizeAuthUser(payload) {
  const user = payload?.data?.user;
  if (!user) return null;

  return {
    ...user,
    token: user.token || payload?.data?.token
  };
}

async function setSessionCookie(user) {
  const cookieStore = await cookies();
  cookieStore.set('slms_session', JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
}

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

export async function loginAction(email, password) {
  try {
    const response = await fetch(apiUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ email, password })
    });
    const payload = await response.json();

    if (!response.ok) {
      return { success: false, message: payload.message || 'Login failed.' };
    }

    const user = normalizeAuthUser(payload);
    if (!user) {
      return { success: false, message: 'Invalid login response from backend.' };
    }

    await setSessionCookie(user);

    return { success: true, user };
  } catch (error) {
    return { success: false, message: 'Network error or backend is offline.' };
  }
}

export async function registerAction(name, email, password, role) {
  try {
    const response = await fetch(apiUrl('/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ name, email, password, role })
    });
    const payload = await response.json();

    if (!response.ok) {
      return { success: false, message: payload.message || 'Registration failed.' };
    }

    const user = normalizeAuthUser(payload);
    if (!user) {
      return { success: false, message: 'Invalid registration response from backend.' };
    }

    await setSessionCookie(user);

    return { success: true, user };
  } catch (error) {
    return { success: false, message: 'Network error or backend is offline.' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('slms_session');
}

export async function changePasswordAction({ currentPassword, newPassword, verificationToken, token }) {
  const sessionUser = await getSessionUser();
  const authToken = token || sessionUser?.token;
  if (!authToken) {
    return { success: false, message: 'Authentication required.' };
  }

  try {
    const response = await fetch(apiUrl('/auth/change-password'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      cache: 'no-store',
      body: JSON.stringify({ currentPassword, newPassword, verificationToken })
    });
    const payload = await response.json();

    if (!response.ok) {
      return { success: false, message: payload.message || 'Could not change password.' };
    }

    const user = normalizeAuthUser(payload);
    if (!user) {
      return { success: false, message: 'Invalid password change response from backend.' };
    }

    await setSessionCookie(user);
    return { success: true, user };
  } catch {
    return { success: false, message: 'Network error or backend is offline.' };
  }
}
