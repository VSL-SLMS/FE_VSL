'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '../../components/Nav';
import { apiUrl } from '../../../lib/api';

function readCurrentUser() {
  if (typeof window === 'undefined') return null;
  const rawUser = localStorage.getItem('slms_user');
  return rawUser ? JSON.parse(rawUser) : null;
}

export default function SelectTeacherPage() {
  const router = useRouter();
  const [currentUser] = useState(readCurrentUser);
  const [teachers, setTeachers] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [message, setMessage] = useState(() =>
    currentUser?.token ? 'Loading teachers...' : 'Student login is required.'
  );

  useEffect(() => {
    if (!currentUser?.token) return;

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
  const pendingRequest = dashboard?.teacherChangeRequests?.find((request) => request.status === 'PENDING');
  const hasPendingRequest = Boolean(pendingRequest || requestSubmitted);

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
              ? { reason }
              : { teacherId }
          )
        }
      );

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Request failed.');

      setMessage(
        hasTeacher
          ? payload.data?.alreadyPending
            ? 'Your teacher change request is already pending Admin approval.'
            : 'Teacher change request submitted. If Admin approves it, your current Teacher will be cleared and you can choose a new Teacher.'
          : 'Teacher selected successfully. Lessons are now unlocked.'
      );
      if (hasTeacher) setRequestSubmitted(true);
      setSelectedTeacherId('');
      setReason('');
      if (!hasTeacher) router.push('/student');
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
            <p className="muted">
              Admin approval will remove your current Teacher assignment. After approval, return here to choose a new Teacher.
            </p>
            {hasPendingRequest && (
              <div className="empty">
                Your teacher change request is pending Admin approval.
              </div>
            )}
            {!hasPendingRequest && (
              <>
                <div className="field">
                  <label>Reason for change request</label>
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Explain why you want to change Teacher..."
                    required
                  />
                </div>
                <div className="actions">
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={loading || !reason.trim()}
                    onClick={() => submitSelection(null)}
                  >
                    {loading ? 'Submitting...' : 'Send request to Admin'}
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        {!hasTeacher && <div className="role-grid">
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
        </div>}
      </div>
    </DashboardShell>
  );
}
