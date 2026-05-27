'use client';

import Link from 'next/link';
import { useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050/api';

export default function LoginPage() {
  const [message, setMessage] = useState('');

  async function onSubmit(event) {
    event.preventDefault();
    setMessage('Signing in...');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password')
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.message || 'Login failed.');
        return;
      }
      localStorage.setItem('slms_user', JSON.stringify(payload.data.user));
      if (payload.data.user.must_change_password) {
        window.location.href = '/change-password';
        return;
      }
      window.location.href = `/${payload.data.user.role.toLowerCase()}`;
    } catch (error) {
      setMessage('Network error or backend is offline.');
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
          <button className="btn btn-primary" type="submit">Log in</button>
        </form>
        {message && <p className="muted">{message}</p>}
        <p className="muted">No account? <Link href="/register">Create one</Link></p>
      </section>
    </main>
  );
}
