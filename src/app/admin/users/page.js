'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashboardShell } from '../../components/Nav';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050/api';

export default function AdminUsersPage() {
  const [currentUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    const rawUser = localStorage.getItem('slms_user');
    return rawUser ? JSON.parse(rawUser) : null;
  });
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState(() => {
    if (typeof window === 'undefined') return 'Loading users...';
    const rawUser = localStorage.getItem('slms_user');
    if (!rawUser) return 'Admin login is required.';
    const parsedUser = JSON.parse(rawUser);
    return parsedUser.role === 'ADMIN' ? 'Loading users...' : 'Only Admin can view user management.';
  });

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    if (currentUser.role !== 'ADMIN') {
      return;
    }

    fetch(`${API_BASE_URL}/admin/users`, {
      headers: {
        Authorization: `Bearer ${currentUser.token}`
      }
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.message || 'Could not load users.');
        }
        setUsers(payload.data.users || []);
        setMessage('');
      })
      .catch((error) => {
        setMessage(error.message || 'Backend is offline.');
      });
  }, [currentUser]);

  return (
    <DashboardShell role="admin" title="Users">
      <div className="stack">
        <div className="card" style={{ boxShadow: 'none' }}>
          <div className="admin-card-head">
            <div>
              <strong>User access control</strong>
              <p className="muted" style={{ marginBottom: 0 }}>
                Students register publicly. Teacher accounts are created by Admin and require first-login password change.
              </p>
            </div>
            <Link className="btn btn-primary" href="/admin/users/create-teacher">Create teacher</Link>
          </div>
        </div>

        {message && <div className="empty">{message}</div>}

        {users.map((user) => (
          <div className="card user-row" style={{ boxShadow: 'none' }} key={user.id}>
            <div>
              <strong>{user.display_name || user.email}</strong>
              <p className="muted">{user.email}</p>
            </div>
            <div className="user-badges">
              <span className="pill">{user.role}</span>
              <span className="pill">{user.status}</span>
              {user.must_change_password ? <span className="pill">Password change required</span> : null}
            </div>
          </div>
        ))}

        {!message && !users.length && <div className="empty">No users found.</div>}
      </div>
    </DashboardShell>
  );
}
