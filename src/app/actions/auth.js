'use server';

import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050/api';

export async function loginAction(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const payload = await response.json();

    if (!response.ok) {
      return { success: false, message: payload.message || 'Login failed.' };
    }

    const cookieStore = await cookies();
    cookieStore.set('slms_session', JSON.stringify(payload.data.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return { success: true, user: payload.data.user };
  } catch (error) {
    return { success: false, message: 'Network error or backend is offline.' };
  }
}

export async function registerAction(name, email, password, role) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const payload = await response.json();

    if (!response.ok) {
      return { success: false, message: payload.message || 'Registration failed.' };
    }

    const cookieStore = await cookies();
    cookieStore.set('slms_session', JSON.stringify(payload.data.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return { success: true, user: payload.data.user };
  } catch (error) {
    return { success: false, message: 'Network error or backend is offline.' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('slms_session');
}
