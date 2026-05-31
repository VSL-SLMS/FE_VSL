'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashboardShell } from '../../components/Nav';
import { apiUrl } from '../../../lib/api';
import { readStoredUser } from '../../../lib/authStorage';

export default function AdminUsersPage() {
  const [currentUser] = useState(() => readStoredUser('ADMIN'));
  const [users, setUsers] = useState([]);
  const [teacherAccounts, setTeacherAccounts] = useState([]);
  const [updatingTeacherId, setUpdatingTeacherId] = useState(null);
  const [message, setMessage] = useState(() => {
    const storedAdmin = readStoredUser('ADMIN');
    return storedAdmin?.token ? 'Loading users...' : 'Admin login is required.';
  });

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    if (currentUser.role !== 'ADMIN') {
      return;
    }

    Promise.all([
      fetch(apiUrl('/admin/users'), {
        headers: {
          Authorization: `Bearer ${currentUser.token}`
        }
      }).then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load users.');
        return payload.data.users || [];
      }),
      fetch(apiUrl('/admin/teachers'), {
        headers: {
          Authorization: `Bearer ${currentUser.token}`
        }
      }).then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load teachers.');
        return payload.data.teachers || [];
      })
    ])
      .then(([userRows, teacherRows]) => {
        setUsers(userRows);
        setTeacherAccounts(teacherRows);
        setMessage('');
      })
      .catch((error) => {
        setMessage(error.message || 'Backend is offline.');
      });
  }, [currentUser]);

  async function updateTeacherStatus(teacher, status) {
    if (!currentUser?.token || updatingTeacherId) return;

    setUpdatingTeacherId(teacher.id);
    try {
      const response = await fetch(apiUrl(`/admin/teachers/${teacher.id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ status })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Could not update teacher status.');

      setTeacherAccounts((items) =>
        items.map((item) => (item.id === teacher.id ? payload.data.teacher : item))
      );
      setUsers((items) =>
        items.map((item) =>
          item.id === payload.data.teacher.user_id
            ? { ...item, status: payload.data.teacher.status }
            : item
        )
      );
      setMessage('');
    } catch (error) {
      setMessage(error.message || 'Backend is offline.');
    } finally {
      setUpdatingTeacherId(null);
    }
  }

  const students = users.filter((user) => user.role === 'STUDENT');
  const admins = users.filter((user) => user.role === 'ADMIN');

  function renderUser(user) {
    return (
      <div className="card user-row" style={{ boxShadow: 'none' }} key={user.id}>
        <div>
          <strong>{user.display_name || user.email}</strong>
          <p className="muted">
            {user.email}
            {user.role === 'STUDENT' && user.assigned_teacher_name ? ` · Teacher: ${user.assigned_teacher_name}` : ''}
          </p>
        </div>
        <div className="user-badges">
          <span className="pill">{user.role}</span>
          <span className="pill">{user.status}</span>
          {user.must_change_password ? <span className="pill">Password change required</span> : null}
        </div>
      </div>
    );
  }

  function renderTeacher(teacher) {
    const nextStatus = teacher.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    return (
      <div className="card user-row" style={{ boxShadow: 'none' }} key={teacher.id}>
        <div>
          <strong>{teacher.display_name || teacher.email}</strong>
          <p className="muted">
            {teacher.email} · Accuracy: {teacher.accuracy ?? 100}%
          </p>
        </div>
        <div className="user-badges">
          <span className="pill">TEACHER</span>
          <span className="pill">{teacher.status}</span>
          {teacher.must_change_password ? <span className="pill">Password change required</span> : null}
          <button
            className="btn"
            type="button"
            onClick={() => updateTeacherStatus(teacher, nextStatus)}
            disabled={updatingTeacherId === teacher.id}
          >
            {updatingTeacherId === teacher.id ? 'Saving...' : nextStatus === 'SUSPENDED' ? 'Suspend' : 'Activate'}
          </button>
        </div>
      </div>
    );
  }

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
            <div className="actions">
              <Link className="btn" href="/admin/teacher-change-requests">Teacher requests</Link>
              <Link className="btn btn-primary" href="/admin/users/create-teacher">Create teacher</Link>
            </div>
          </div>
        </div>

        {message && <div className="empty">{message}</div>}

        {!message && (
          <>
            <section className="stack">
              <div className="page-title"><h2>Teachers ({teacherAccounts.length})</h2></div>
              {teacherAccounts.map(renderTeacher)}
              {!teacherAccounts.length && <div className="empty">No teachers found.</div>}
            </section>

            <section className="stack">
              <div className="page-title"><h2>Students ({students.length})</h2></div>
              {students.map(renderUser)}
              {!students.length && <div className="empty">No students found.</div>}
            </section>

            <section className="stack">
              <div className="page-title"><h2>Admin ({admins.length})</h2></div>
              {admins.map(renderUser)}
            </section>
          </>
        )}

        {!message && !users.length && <div className="empty">No users found.</div>}
      </div>
    </DashboardShell>
  );
}
