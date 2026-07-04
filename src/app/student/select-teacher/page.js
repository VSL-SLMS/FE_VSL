'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '../../components/Nav';
import { apiUrl } from '../../../lib/api';
import { useStoredUser } from '../../../lib/authStorage';

export default function SelectTeacherPage() {
  const router = useRouter();
  const { ready: authReady, user: currentUser } = useStoredUser('STUDENT');
  const [teachers, setTeachers] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [recommendedTeacherId, setRecommendedTeacherId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [message, setMessage] = useState('Loading teachers...');

  useEffect(() => {
    if (!authReady) return;
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
  }, [authReady, currentUser]);

  const hasTeacher = Boolean(dashboard?.student?.teacher_id);
  const pendingRequest = dashboard?.teacherChangeRequests?.find((request) => request.status === 'PENDING');
  const hasPendingRequest = Boolean(pendingRequest || requestSubmitted);

  async function recommendTeacher() {
    if (!currentUser?.token || recommendLoading) return;

    setRecommendLoading(true);
    setMessage('Finding a recommended Teacher...');

    try {
      const response = await fetch(apiUrl('/teachers?recommend=true'), {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Could not recommend a Teacher.');

      const recommendedTeachers = payload.data.teachers || [];
      setTeachers(recommendedTeachers);
      setRecommendedTeacherId(payload.data.recommendedTeacher?.id || recommendedTeachers[0]?.id || '');
      setMessage(
        recommendedTeachers.length
          ? 'Recommended Teachers are sorted by available capacity first, then reliability.'
          : 'No Teacher is currently accepting new Students.'
      );
    } catch (error) {
      setMessage(error.message || 'Backend is offline.');
    } finally {
      setRecommendLoading(false);
    }
  }

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

        {!hasTeacher && (
          <section className="card stack" style={{ boxShadow: 'none' }}>
            <div className="page-title">
              <div>
                <span className="eyebrow">Teacher selection</span>
                <h2>Choose one Teacher</h2>
                <p className="muted">
                  Recommendation uses availability and current student count first. Reliability is secondary.
                </p>
              </div>
              <button className="btn" type="button" onClick={recommendTeacher} disabled={recommendLoading || loading}>
                {recommendLoading ? 'Finding...' : 'Recommend teacher for me'}
              </button>
            </div>
          </section>
        )}

        {!hasTeacher && <div className="role-grid">
          {teachers.map((teacher) => {
            const isCurrentTeacher = Number(teacher.id) === Number(dashboard?.student?.teacher_id);
            const isFull = !teacher.is_accepting_students || teacher.availability_status === 'FULL';
            const isRecommended = Number(recommendedTeacherId) === Number(teacher.id) || teacher.is_recommended;
            const name = teacher.full_name || teacher.display_name || teacher.email;
            return (
              <article className="card" key={teacher.id}>
                <div className="page-title" style={{ alignItems: 'flex-start' }}>
                  <span className="brand-mark">{name?.[0] || 'T'}</span>
                  <div className="user-badges">
                    {isRecommended && <span className="pill">Recommended</span>}
                    <span className="pill">{teacher.availability_status || 'OPEN'}</span>
                  </div>
                </div>
                <h2>{name}</h2>
                <p className="muted">{teacher.email}</p>
                <p className="muted">{teacher.bio || 'No bio provided yet.'}</p>
                <div className="stack" style={{ gap: 8 }}>
                  <p className="pill">{teacher.specialization || 'General VSL learning'}</p>
                  <p className="pill">
                    {teacher.current_student_count || 0}/{teacher.max_students || 30} Students
                  </p>
                  <p className="pill">
                    {teacher.accuracy_verified
                      ? `${teacher.reliability_label} · ${teacher.accuracy}% verified accuracy`
                      : 'NEW · no verified grading history yet'}
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={loading || isCurrentTeacher || isFull || (hasTeacher && !reason.trim())}
                  onClick={() => {
                    setSelectedTeacherId(teacher.id);
                    submitSelection(teacher.id);
                  }}
                >
                  {isCurrentTeacher
                    ? 'Current teacher'
                    : isFull
                      ? 'Full'
                      : selectedTeacherId === teacher.id && loading
                        ? 'Submitting...'
                        : hasTeacher
                          ? 'Request change'
                          : 'Select teacher'}
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
