'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardShell } from '../../../components/Nav';
import { apiUrl } from '../../../../lib/api';
import { removeStoredUser, useStoredUser } from '../../../../lib/authStorage';

async function verifyAdminSession(adminUser) {
  if (!adminUser?.token) {
    return { ok: false, message: 'Admin login is required.' };
  }

  const response = await fetch(apiUrl('/auth/me'), {
    headers: {
      Authorization: `Bearer ${adminUser.token}`
    }
  });

  if (!response.ok) {
    return {
      ok: false,
      message: response.status === 401
        ? 'Admin session expired. Please log in again.'
        : 'Could not verify admin session.'
    };
  }

  const payload = await response.json();
  const user = payload.data?.user;
  if (user?.role !== 'ADMIN') {
    return { ok: false, message: 'Admin permission is required.' };
  }

  return { ok: true };
}

export default function CreateTeacherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createdTeacher, setCreatedTeacher] = useState(null);
  const { ready: authReady, user: currentUser } = useStoredUser('ADMIN');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (authReady && !currentUser?.token) setMessage('Admin login is required.');
  }, [authReady, currentUser]);

  async function onSubmit(event) {
    event.preventDefault();
    if (loading) return;

    if (!currentUser?.token) {
      setMessage('Admin login is required.');
      router.push('/login?redirect=/admin/users/create-teacher');
      return;
    }

    setLoading(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      setMessage('Verifying admin session...');
      const session = await verifyAdminSession(currentUser);
      if (!session.ok) {
        setMessage(session.message);
        removeStoredUser();
        router.push('/login?redirect=/admin/users/create-teacher');
        return;
      }

      setMessage('Creating teacher account...');
      const response = await fetch(apiUrl('/admin/teachers'), {
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
        setMessage(
          response.status === 401
            ? 'Admin session expired. Please log in again.'
            : response.status === 409
            ? 'This email is already registered. Use another email or check the Users page.'
            : payload.message || 'Could not create teacher account.'
        );
        if (response.status === 401) {
          removeStoredUser();
          router.push('/login?redirect=/admin/users/create-teacher');
        }
        return;
      }

      formElement.reset();
      setCreatedTeacher(payload.data.teacher);
      setMessage('');
    } catch (error) {
      setMessage('Network error or backend is offline.');
    } finally {
      setLoading(false);
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
              <button className="btn btn-primary" type="submit" disabled={!currentUser || loading}>
                {loading ? 'Creating...' : 'Create teacher'}
              </button>
              <Link className="btn" href="/admin/users">Back to users</Link>
            </div>
          </form>
        </div>

        {message && <div className="empty">{message}</div>}

        {createdTeacher && (
          <div className="modal-backdrop" role="presentation">
            <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="teacher-created-title">
              <span className="pill">{createdTeacher.temporary_password_reset ? 'Temporary password reset' : 'Teacher created'}</span>
              <h2 id="teacher-created-title">Teacher account is ready</h2>
              <p className="muted">
                {createdTeacher.email} can now log in with the temporary password and must change password on first login.
              </p>
              {createdTeacher.email_delivery?.sent ? (
                <p className="muted">Temporary password email was sent.</p>
              ) : (
                <p className="muted">
                  SMTP email was not sent
                  {createdTeacher.email_delivery?.reason ? ` (${createdTeacher.email_delivery.reason})` : ''}.
                  Share the temporary password manually.
                </p>
              )}
              <div className="actions">
                <button className="btn btn-primary" type="button" onClick={() => setCreatedTeacher(null)}>Create another</button>
                <Link className="btn" href="/admin/users">View users</Link>
              </div>
            </section>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
