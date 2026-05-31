'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashboardShell } from '../components/Nav';
import { apiUrl } from '../../lib/api';

function readCurrentUser() {
  if (typeof window === 'undefined') return null;
  const rawUser = localStorage.getItem('slms_user');
  return rawUser ? JSON.parse(rawUser) : null;
}

export default function StudentPage() {
  const [currentUser] = useState(readCurrentUser);
  const [dashboard, setDashboard] = useState(null);
  const [message, setMessage] = useState(() =>
    currentUser?.token ? 'Loading dashboard...' : 'Student login is required.'
  );

  useEffect(() => {
    if (!currentUser?.token) return;

    fetch(apiUrl('/student/dashboard'), {
      headers: { Authorization: `Bearer ${currentUser.token}` }
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load student dashboard.');
        setDashboard(payload.data);
        setMessage('');
      })
      .catch((error) => setMessage(error.message || 'Backend is offline.'));
  }, [currentUser]);

  const student = dashboard?.student;
  const hasTeacher = Boolean(student?.teacher_id);
  const completedLessons = dashboard?.progress?.completed_lessons || 0;
  const totalLessons = dashboard?.totalLessons || 0;
  const progressPercent = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <DashboardShell role="student" title="Welcome back">
      <div className="stack">
        {message && <div className="empty">{message}</div>}

        {!message && !hasTeacher && (
          <div className="card stack" style={{ boxShadow: 'none' }}>
            <span className="eyebrow">Required first step</span>
            <h2>Choose exactly one Teacher before learning</h2>
            <p className="muted">
              Lessons are locked until your Student account is assigned to a Teacher.
            </p>
            <div className="actions">
              <Link className="btn btn-primary" href="/student/select-teacher">Select teacher</Link>
            </div>
          </div>
        )}

        <section className="role-grid">
          <div className="card">
            <span className="eyebrow">Sign Language 101</span>
            <h2>Course progress</h2>
            <div className="progress-track"><div className="progress-bar" style={{ width: `${progressPercent}%` }} /></div>
            <p className="muted">{completedLessons} completed lessons · {totalLessons || 28} lessons available</p>
          </div>
          <div className="card">
            <span className="eyebrow">Your teacher</span>
            <h2>{hasTeacher ? student.teacher_name : 'Not selected'}</h2>
            <p className="muted">
              {hasTeacher ? student.teacher_email : 'First login requires exactly one teacher selection.'}
            </p>
            <Link className="btn btn-primary" href="/student/select-teacher">
              {hasTeacher ? 'Request teacher change' : 'Select teacher'}
            </Link>
          </div>
          <div className="card">
            <span className="eyebrow">Assignments</span>
            <h2>No pending work</h2>
            <p className="muted">Assigned work will appear after your Teacher creates assignments.</p>
          </div>
        </section>

        {dashboard?.teacherChangeRequests?.length ? (
          <section className="card stack" style={{ boxShadow: 'none' }}>
            <span className="eyebrow">Teacher change requests</span>
            {dashboard.teacherChangeRequests.map((request) => (
              <div className="user-row" key={request.id}>
                <div>
                  <strong>{request.requested_teacher_name}</strong>
                  <p className="muted">{request.reason}</p>
                </div>
                <span className="pill">{request.status}</span>
              </div>
            ))}
          </section>
        ) : null}

        {hasTeacher && (
          <section className="card stack" style={{ boxShadow: 'none' }}>
            <div className="page-title">
              <div>
                <span className="eyebrow">Continue learning</span>
                <h2>Lessons unlocked</h2>
              </div>
              <Link className="btn" href="/student/lessons">View lessons</Link>
            </div>
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
