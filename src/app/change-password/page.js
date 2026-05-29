'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiUrl } from '../../lib/api';

export default function ChangePasswordPage() {
  const [message, setMessage] = useState('');
  const [user] = useState(() => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('slms_user');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (!user) {
      window.location.href = '/login';
    }
  }, [user]);

  async function onSubmit(event) {
    event.preventDefault();
    setMessage('Updating password...');
    const form = new FormData(event.currentTarget);
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (newPassword !== confirmPassword) {
      setMessage('New password and confirmation do not match.');
      return;
    }

    const response = await fetch(apiUrl('/auth/change-password'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`
      },
      body: JSON.stringify({
        currentPassword: form.get('currentPassword'),
        newPassword
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.message || 'Could not change password.');
      return;
    }

    localStorage.setItem('slms_user', JSON.stringify(payload.data.user));
    window.location.href = `/${payload.data.user.role.toLowerCase()}`;
  }

  return (
    <main className="auth-wrap">
      <section className="auth-panel">
        <Link href="/" className="brand"><span className="brand-mark">✦</span><span>SignLearn</span></Link>
        <h1>Change password</h1>
        <p className="muted">Teacher accounts created by Admin must change their temporary password before using the dashboard.</p>
        <form className="form-grid" onSubmit={onSubmit}>
          <div className="field"><label>Current password</label><input name="currentPassword" type="password" required /></div>
          <div className="field"><label>New password</label><input name="newPassword" type="password" minLength="6" required /></div>
          <div className="field"><label>Confirm password</label><input name="confirmPassword" type="password" minLength="6" required /></div>
          <button className="btn btn-primary" type="submit">Update password</button>
        </form>
        {message && <p className="muted">{message}</p>}
      </section>
    </main>
  );
}
