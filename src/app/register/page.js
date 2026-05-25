'use client';

import Link from 'next/link';
import { useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050/api';

export default function RegisterPage() {
  const [message, setMessage] = useState('');

  async function onSubmit(event) {
    event.preventDefault();
    setMessage('Creating account...');
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        email: form.get('email'),
        password: form.get('password'),
        role: form.get('role')
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.message || 'Registration failed.');
      return;
    }
    localStorage.setItem('slms_user', JSON.stringify(payload.data.user));
    window.location.href = `/${payload.data.user.role.toLowerCase()}`;
  }

  return (
    <main className="auth-wrap">
      <section className="auth-panel">
        <Link href="/" className="brand"><span className="brand-mark">✦</span><span>SignLearn</span></Link>
        <h1>Create account</h1>
        <p className="muted">Students and teachers can register. Admin is managed separately.</p>
        <form className="form-grid" onSubmit={onSubmit}>
          <div className="field"><label>Name</label><input name="name" required /></div>
          <div className="field"><label>Email</label><input name="email" type="email" required /></div>
          <div className="field"><label>Password</label><input name="password" type="password" minLength="6" required /></div>
          <div className="field">
            <label>Role</label>
            <select name="role" defaultValue="STUDENT">
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
            </select>
          </div>
          <button className="btn btn-primary" type="submit">Create account</button>
        </form>
        {message && <p className="muted">{message}</p>}
        <p className="muted">Already have an account? <Link href="/login">Log in</Link></p>
      </section>
    </main>
  );
}
