'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '../../components/Nav';
import { apiUrl } from '../../../lib/api';

function readCurrentUser() {
  if (typeof window === 'undefined') return null;
  const rawUser = localStorage.getItem('slms_user');
  return rawUser ? JSON.parse(rawUser) : null;
}

export default function SelectTeacherPage() {
  const [currentUser] = useState(readCurrentUser);
  const [teachers, setTeachers] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Loading teachers...');

  useEffect(() => {
    if (!currentUser?.token) {
      setMessage('Student login is required.');
      return;
    }

    Promise.all([
      fetch(apiUrl('/teachers'), {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      }).then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load teachers.');
        return payload.data.teachers || [];
      }),
      fetch(apiUrl('/student/dashboard'), {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      }).then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load student profile.');
        return payload.data;
      })
    ])
      .then(([teacherRows, dashboardData]) => {
        setTeachers(teacherRows);
        setDashboard(dashboardData);
        setMessage('');
      })
      .catch((error) => setMessage(error.message || 'Backend is offline.'));
  }, [currentUser]);

  const hasTeacher = Boolean(dashboard?.student?.teacher_id);

  async function submitSelection(teacherId) {
    if (!currentUser?.token || loading) return;
    setLoading(true);
    setMessage(hasTeacher ? 'Submitting teacher change request...' : 'Selecting teacher...');

    try {
      const response = await fetch(
        apiUrl(hasTeacher ? '/student/request-teacher-change' : '/student/choose-teacher'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentUser.token}`
          },
          body: JSON.stringify(
            hasTeacher
              ? { requestedTeacherId: teacherId, reason }
              : { teacherId }
          )
        }
      );

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Request failed.');

      setMessage(
        hasTeacher
          ? 'Teacher change request submitted. Admin approval is required before the change takes effect.'
          : 'Teacher selected successfully. Lessons are now unlocked.'
      );
      setSelectedTeacherId('');
      setReason('');
      if (!hasTeacher) window.location.href = '/student';
    } catch (error) {
      setMessage(error.message || 'Backend is offline.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell role="student" title={hasTeacher ? 'Request teacher change' : 'Choose teacher'}>
      <div className="stack">
        {message && <div className="empty">{message}</div>}

        {hasTeacher && (
          <section className="card stack" style={{ boxShadow: 'none' }}>
            <span className="eyebrow">Current Teacher</span>
            <h2>{dashboard.student.teacher_name}</h2>
            <p className="muted">{dashboard.student.teacher_email}</p>
            <div className="field">
              <label>Reason for change request</label>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explain why you want to change Teacher..."
                required
              />
            </div>
          </section>
        )}

        <div className="role-grid">
          {teachers.map((teacher) => {
            const isCurrentTeacher = Number(teacher.id) === Number(dashboard?.student?.teacher_id);
            return (
              <article className="card" key={teacher.id}>
                <span className="brand-mark">{teacher.display_name?.[0] || 'T'}</span>
                <h2>{teacher.display_name}</h2>
                <p className="muted">{teacher.email}</p>
                <p className="pill">{teacher.accuracy}% accuracy</p>
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={loading || isCurrentTeacher || (hasTeacher && !reason.trim())}
                  onClick={() => {
                    setSelectedTeacherId(teacher.id);
                    submitSelection(teacher.id);
                  }}
                >
                  {isCurrentTeacher ? 'Current teacher' : selectedTeacherId === teacher.id && loading ? 'Submitting...' : hasTeacher ? 'Request change' : 'Select teacher'}
                </button>
              </article>
            );
          })}
          {!teachers.length && !message && (
            <div className="empty">No teacher account exists yet. Ask Admin to create a teacher account first.</div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
