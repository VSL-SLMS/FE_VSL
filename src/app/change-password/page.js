'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '../../lib/api';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [user] = useState(() => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('slms_user');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [router, user]);

  async function requestOtp() {
    if (!user?.token) return;
    setMessage('Sending OTP...');

    const response = await fetch(apiUrl('/auth/change-password/request-otp'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.message || 'Could not send OTP.');
      return;
    }

    setOtpSent(true);
    setMessage('OTP sent to your email. It expires in 10 minutes.');
  }

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
        newPassword,
        otp: form.get('otp')
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.message || 'Could not change password.');
      return;
    }

    localStorage.setItem('slms_user', JSON.stringify(payload.data.user));
    router.push(`/${payload.data.user.role.toLowerCase()}`);
  }

  return (
    <main className="auth-wrap">
      <section className="auth-panel">
        <Link href="/" className="brand"><span className="brand-mark">✦</span><span>SignLearn</span></Link>
        <h1>Change password</h1>
        <p className="muted">Password changes require an OTP sent to your account email.</p>
        <button className="btn" type="button" onClick={requestOtp}>
          {otpSent ? 'Send OTP again' : 'Send OTP'}
        </button>
        <form className="form-grid" onSubmit={onSubmit}>
          <div className="field"><label>Current password</label><input name="currentPassword" type="password" required /></div>
          <div className="field"><label>Email OTP</label><input name="otp" inputMode="numeric" minLength="6" maxLength="6" required /></div>
          <div className="field"><label>New password</label><input name="newPassword" type="password" minLength="6" required /></div>
          <div className="field"><label>Confirm password</label><input name="confirmPassword" type="password" minLength="6" required /></div>
          <button className="btn btn-primary" type="submit">Update password</button>
        </form>
        {message && <p className="muted">{message}</p>}
      </section>
    </main>
  );
}
