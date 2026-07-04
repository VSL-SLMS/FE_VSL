'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashboardShell } from '../components/Nav';
import { apiUrl, fetchApi } from '../../lib/api';
import { useStoredUser } from '../../lib/authStorage';

export default function AdminPage() {
  const { ready: authReady, user: currentUser } = useStoredUser('ADMIN');
  const [lessonCount, setLessonCount] = useState(0);
  const [teacherRequests, setTeacherRequests] = useState([]);
  const [message, setMessage] = useState('Loading admin dashboard...');

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser?.token) {
      setMessage('Admin login is required.');
      return;
    }

    let cancelled = false;

    Promise.all([
      fetchApi('/course-overview').then((payload) => payload.data.parts || []),
      fetch(apiUrl('/admin/teacher-change-requests'), {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      }).then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load teacher requests.');
        return payload.data.requests || [];
      })
    ])
      .then(([parts, requests]) => {
        if (cancelled) return;

        const totalLessons = parts.reduce(
          (total, part) => total + (part.chapters || []).reduce((sum, chapter) => sum + (chapter.lessons?.length || 0), 0),
          0
        );

        setLessonCount(totalLessons);
        setTeacherRequests(requests);
        setMessage('');
      })
      .catch((error) => {
        if (!cancelled) setMessage(error.message || 'Backend is offline.');
      });

    return () => {
      cancelled = true;
    };
  }, [authReady, currentUser]);

  const pendingRequests = teacherRequests.filter((request) => request.status === 'PENDING');

  return (
    <DashboardShell role="admin" title="Admin dashboard">
      <div className="stack">
        {message && <div className="empty">{message}</div>}

        <div className="role-grid">
          <div className="card">
            <span className="eyebrow">Course</span>
            <h2>{lessonCount || 28} lessons</h2>
            <p className="muted">VSL content source is MySQL.</p>
          </div>
          <div className="card">
            <span className="eyebrow">Users</span>
            <h2>Manage accounts</h2>
            <p className="muted">Suspend/delete users and monitor roles.</p>
            <Link className="btn" href="/admin/users">Open users</Link>
          </div>
          <div className="card">
            <span className="eyebrow">Teacher Requests</span>
            <h2>{pendingRequests.length} pending</h2>
            <p className="muted">Approve requests to clear the current Teacher, then Student chooses again.</p>
            <Link className="btn btn-primary" href="/admin/teacher-change-requests">Review requests</Link>
          </div>
        </div>

        <section className="card stack" style={{ boxShadow: 'none' }}>
          <div className="page-title">
            <div>
              <span className="eyebrow">Pending Teacher Changes</span>
              <h2>Requests waiting for Admin</h2>
            </div>
            <Link className="btn" href="/admin/teacher-change-requests">View all</Link>
          </div>

          {pendingRequests.map((request) => (
            <div className="user-row" key={request.id}>
              <div>
                <strong>{request.student_name}</strong>
                <p className="muted">
                  {request.student_email} · Current Teacher: {request.current_teacher_name || 'None'}
                </p>
                <p className="muted">{request.reason}</p>
              </div>
              <span className="pill">{request.status}</span>
            </div>
          ))}

          {!message && !pendingRequests.length && (
            <div className="empty">No pending teacher change requests.</div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
