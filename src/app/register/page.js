'use client';

import Link from 'next/link';
import { useState } from 'react';
import { apiUrl } from '../../lib/api';

export default function RegisterPage() {
  const [message, setMessage] = useState('');

  async function onSubmit(event) {
    event.preventDefault();
    setMessage('Creating account...');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(apiUrl('/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          password: form.get('password')
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.message || 'Registration failed.');
        return;
      }
      localStorage.setItem('slms_user', JSON.stringify(payload.data.user));
      window.location.href = `/${payload.data.user.role.toLowerCase()}`;
    } catch (error) {
      setMessage('Network error or backend is offline.');
    }
  }

  return (
    <main className="auth-wrap">
      <section className="auth-panel">
        <Link href="/" className="brand"><span className="brand-mark">✦</span><span>SignLearn</span></Link>
        <h1>Create account</h1>
        <p className="muted">Public registration is for students only. Teacher accounts are created by Admin.</p>
        <form className="form-grid" onSubmit={onSubmit}>
          <div className="field"><label>Name</label><input name="name" required /></div>
          <div className="field"><label>Email</label><input name="email" type="email" required /></div>
          <div className="field"><label>Password</label><input name="password" type="password" minLength="6" required /></div>
          <button className="btn btn-primary" type="submit">Create account</button>
        </form>
        {message && <p className="muted">{message}</p>}
        <p className="muted">Already have an account? <Link href="/login">Log in</Link></p>
      </section>
    </main>
  );
}
