'use client';

import Link from 'next/link';
import { useState } from 'react';
import { registerAction } from '../actions/auth';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);

    const name = form.get('name');
    const email = form.get('email');
    const password = form.get('password');
    const role = form.get('role');

    const result = await registerAction(name, email, password, role);

    if (!result.success) {
      toast.error(result.message);
      setLoading(false);
    } else {
      toast.success('Registration successful!');
      window.location.href = `/${result.user.role.toLowerCase()}`;
    }
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
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="muted">Already have an account? <Link href="/login">Log in</Link></p>
      </section>
    </main>
  );
}
