'use client';

import Link from 'next/link';
import { useState } from 'react';
import { loginAction } from '../actions/auth';
import toast from 'react-hot-toast';
import { writeStoredUser } from '../../lib/authStorage';

function getRedirectTarget(fallback) {
  const redirectTo = new URLSearchParams(window.location.search).get('redirect');

  if (!redirectTo || !redirectTo.startsWith('/') || redirectTo.startsWith('//')) {
    return fallback;
  }

  return redirectTo;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);

    const email = form.get('email');
    const password = form.get('password');

    const result = await loginAction(email, password);

    if (!result.success) {
      toast.error(result.message);
      setLoading(false);
    } else {
      toast.success('Login successful!');
      writeStoredUser(result.user);
      const defaultTarget = result.user.must_change_password
        ? '/change-password'
        : `/${result.user.role.toLowerCase()}`;
      window.location.href = getRedirectTarget(defaultTarget);
    }
  }

  return (
    <main className="auth-wrap">
      <section className="auth-panel">
        <Link href="/" className="brand"><span className="brand-mark">✦</span><span>SignLearn</span></Link>
        <h1>Log in</h1>
        <p className="muted">Use your student, teacher, or admin account.</p>
        <form className="form-grid" onSubmit={onSubmit}>
          <div className="field"><label>Email</label><input name="email" type="email" required /></div>
          <div className="field"><label>Password</label><input name="password" type="password" required /></div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Log in'}
          </button>
        </form>
        <p className="muted">No account? <Link href="/register">Create one</Link></p>
      </section>
    </main>
  );
}
