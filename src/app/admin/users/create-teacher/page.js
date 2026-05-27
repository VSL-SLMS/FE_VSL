'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DashboardShell } from '../../../components/Nav';

const DEFAULT_API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://bevsl-production.up.railway.app/api'
    : 'http://localhost:5050/api';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;

export default function CreateTeacherPage() {
  const [currentUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    const rawUser = localStorage.getItem('slms_user');
    return rawUser ? JSON.parse(rawUser) : null;
  });
  const [message, setMessage] = useState(() => {
    if (typeof window === 'undefined') return '';
    const rawUser = localStorage.getItem('slms_user');
    if (!rawUser) return 'Admin login is required.';
    const parsedUser = JSON.parse(rawUser);
    return parsedUser.role === 'ADMIN' ? '' : 'Only Admin can create teacher accounts.';
  });

  async function onSubmit(event) {
    event.preventDefault();
    if (!currentUser) return;

    setMessage('Creating teacher account...');
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/teachers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          temporaryPassword: form.get('temporaryPassword'),
          status: form.get('status')
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.message || 'Could not create teacher account.');
        return;
      }

      event.currentTarget.reset();
      setMessage(`Teacher account created for ${payload.data.teacher.email}. First-login password change is required.`);
    } catch (error) {
      setMessage('Network error or backend is offline.');
    }
  }

  return (
    <DashboardShell role="admin" title="Create Teacher">
      <div className="stack">
        <div className="card" style={{ boxShadow: 'none' }}>
          <form className="form-grid" onSubmit={onSubmit}>
            <div className="field">
              <label>Full name</label>
              <input name="name" placeholder="Tran Thi B" required />
            </div>
            <div className="field">
              <label>Email</label>
              <input name="email" type="email" placeholder="teacher@example.com" required />
            </div>
            <div className="field">
              <label>Temporary password</label>
              <input name="temporaryPassword" type="password" minLength="6" required />
            </div>
            <div className="field">
              <label>Status</label>
              <select name="status" defaultValue="ACTIVE">
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
            <div className="actions" style={{ marginTop: 4 }}>
              <button className="btn btn-primary" type="submit" disabled={!currentUser}>Create teacher</button>
              <Link className="btn" href="/admin/users">Back to users</Link>
            </div>
          </form>
        </div>

        {message && <div className="empty">{message}</div>}
      </div>
    </DashboardShell>
  );
}
