'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '../../lib/api';
import { readStoredUser, writeStoredUser } from '../../lib/authStorage';
import { changePasswordAction } from '../actions/auth';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user] = useState(() => readStoredUser());

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [router, user]);

  async function requestOtp() {
    if (!user?.token || isLoading) return;
    setIsLoading(true);
    setMessage('Sending OTP...');

    try {
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
      setVerificationToken('');
      setMessage('OTP sent to your email. It expires in 10 minutes.');
    } catch {
      setMessage('Network error or backend is offline.');
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyOtp(event) {
    event.preventDefault();
    if (!user?.token || isLoading) return;
    setIsLoading(true);
    setMessage('Verifying OTP...');

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(apiUrl('/auth/change-password/verify-otp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          otp: form.get('otp')
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        setVerificationToken('');
        setMessage(payload.message || 'OTP is invalid or expired.');
        return;
      }

      setVerificationToken(payload.data.verificationToken);
      setMessage('OTP verified. Please set your new password.');
    } catch {
      setMessage('Network error or backend is offline.');
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!verificationToken || isLoading) return;
    setIsLoading(true);
    setMessage('Updating password...');
    const form = new FormData(event.currentTarget);
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (newPassword !== confirmPassword) {
      setMessage('New password and confirmation do not match.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await changePasswordAction({
        currentPassword: form.get('currentPassword'),
        newPassword,
        verificationToken,
        token: user.token
      });

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      writeStoredUser(result.user);
      router.push(`/${result.user.role.toLowerCase()}`);
    } catch {
      setMessage('Network error or backend is offline.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="auth-wrap">
      <section className="auth-panel">
        <Link href="/" className="brand"><span className="brand-mark">✦</span><span>SignLearn</span></Link>
        <h1>Change password</h1>
        <p className="muted">Verify your email first. The password form appears after the OTP is confirmed.</p>

        {!otpSent && (
          <button className="btn btn-primary" type="button" disabled={isLoading} onClick={requestOtp}>
            Send OTP
          </button>
        )}

        {otpSent && !verificationToken && (
          <form className="form-grid" onSubmit={verifyOtp}>
            <div className="field">
              <label>Email OTP</label>
              <input name="otp" inputMode="numeric" minLength="6" maxLength="6" required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={isLoading}>
              Verify OTP
            </button>
            <button className="btn" type="button" disabled={isLoading} onClick={requestOtp}>
              Send OTP again
            </button>
          </form>
        )}

        {verificationToken && (
          <form className="form-grid" onSubmit={onSubmit}>
            <div className="field"><label>Current password</label><input name="currentPassword" type="password" required /></div>
            <div className="field"><label>New password</label><input name="newPassword" type="password" minLength="6" required /></div>
            <div className="field"><label>Confirm password</label><input name="confirmPassword" type="password" minLength="6" required /></div>
            <button className="btn btn-primary" type="submit" disabled={isLoading}>Update password</button>
          </form>
        )}
        {message && <p className="muted">{message}</p>}
      </section>
    </main>
  );
}
