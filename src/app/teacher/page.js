'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashboardShell } from '../components/Nav';
import { apiUrl } from '../../lib/api';
import { useStoredUser } from '../../lib/authStorage';

export default function TeacherPage() {
  const { ready: authReady, user: currentUser } = useStoredUser('TEACHER');
  const [dashboard, setDashboard] = useState(null);
  const [message, setMessage] = useState('Loading dashboard...');

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser?.token) {
      setMessage('Teacher login is required.');
      return;
    }

    fetch(apiUrl('/teacher/dashboard'), {
      headers: { Authorization: `Bearer ${currentUser.token}` }
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load teacher dashboard.');
        setDashboard(payload.data);
        setMessage('');
      })
      .catch((error) => setMessage(error.message || 'Backend is offline.'));
  }, [authReady, currentUser]);

  return (
    <DashboardShell role="teacher" title="Teacher dashboard">
      <div className="stack">
        {message && <div className="empty">{message}</div>}
        <div className="role-grid">
          <div className="card">
            <span className="eyebrow">Students</span>
            <h2>{dashboard?.student_count || 0} assigned</h2>
            <p className="muted">Students appear after they select you as Teacher.</p>
            <Link className="btn" href="/teacher/students">View students</Link>
          </div>
          <div className="card">
            <span className="eyebrow">Assignments</span>
            <h2>{dashboard?.assignment_count || 0} created</h2>
            <p className="muted">Create assignments for students under your supervision.</p>
            <Link className="btn" href="/teacher/assignments">Manage assignments</Link>
          </div>
          <div className="card">
            <span className="eyebrow">Grading</span>
            <h2>{dashboard?.pending_submission_count || 0} pending</h2>
            <p className="muted">Submitted assignments are locked after grading.</p>
            <Link className="btn" href="/teacher/grading">Open grading</Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
