'use client';

import { useCallback, useEffect, useState } from 'react';
import { DashboardShell } from '../../components/Nav';
import { apiUrl } from '../../../lib/api';
import { readStoredUser } from '../../../lib/authStorage';

function statusLabel(status) {
  return status === 'NOT_SUBMITTED' ? 'Not submitted' : status;
}

export default function TeacherGradingPage() {
  const [currentUser] = useState(() => readStoredUser('TEACHER'));
  const [submissions, setSubmissions] = useState([]);
  const [gradingId, setGradingId] = useState(null);
  const [message, setMessage] = useState(() =>
    currentUser?.token ? 'Loading submissions...' : 'Teacher login is required.'
  );

  const loadSubmissions = useCallback(async () => {
    if (!currentUser?.token) return;

    const response = await fetch(apiUrl('/teacher/submissions'), {
      headers: { Authorization: `Bearer ${currentUser.token}` }
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'Could not load submissions.');

    setSubmissions(payload.data || []);
    setMessage('');
  }, [currentUser]);

  useEffect(() => {
    loadSubmissions().catch((error) => setMessage(error.message || 'Backend is offline.'));
  }, [loadSubmissions]);

  async function onGrade(event, submissionId) {
    event.preventDefault();
    if (!currentUser?.token || gradingId) return;

    setGradingId(submissionId);
    setMessage('Saving grade...');
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(apiUrl(`/teacher/submissions/${submissionId}/grade`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          score: form.get('score'),
          feedback: form.get('feedback')
        })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Could not grade submission.');

      await loadSubmissions();
      setMessage('Submission graded and locked.');
    } catch (error) {
      setMessage(error.message || 'Backend is offline.');
    } finally {
      setGradingId(null);
    }
  }

  const submittedCount = submissions.filter((item) => item.submission_status === 'SUBMITTED').length;

  return (
    <DashboardShell role="teacher" title="Grading">
      <div className="stack">
        {message && <div className="empty">{message}</div>}

        <section className="role-grid">
          <div className="card">
            <span className="eyebrow">Pending grading</span>
            <h2>{submittedCount}</h2>
            <p className="muted">Only submitted assignments can be graded.</p>
          </div>
          <div className="card">
            <span className="eyebrow">Locked after grading</span>
            <h2>Once</h2>
            <p className="muted">A graded submission is locked until a future admin reopen flow exists.</p>
          </div>
        </section>

        {!submissions.length ? <div className="empty">No submissions yet.</div> : null}

        {submissions.map((submission) => (
          <section className="card stack" key={`${submission.assignment_id}-${submission.student_id}`} style={{ boxShadow: 'none' }}>
            <div className="page-title">
              <div>
                <span className="eyebrow">{submission.assignment_title}</span>
                <h2>{submission.student_name}</h2>
                <p className="muted">{submission.student_email}</p>
              </div>
              <span className="pill">{statusLabel(submission.submission_status)}</span>
            </div>

            {submission.submission_id ? (
              <div className="card" style={{ boxShadow: 'none' }}>
                <p><strong>Answer:</strong> {submission.content || 'No text answer'}</p>
                {submission.file_path ? <p><strong>File:</strong> {submission.file_path}</p> : null}
                {submission.score !== null && submission.score !== undefined ? (
                  <p><strong>Score:</strong> {submission.score} · <strong>Feedback:</strong> {submission.feedback}</p>
                ) : null}
              </div>
            ) : (
              <p className="muted">Student has not submitted this assignment.</p>
            )}

            {submission.can_grade ? (
              <form className="form-grid" onSubmit={(event) => onGrade(event, submission.submission_id)}>
                <div className="field">
                  <label>Score</label>
                  <input name="score" type="number" min="0" max="100" step="0.01" required />
                </div>
                <div className="field">
                  <label>Feedback</label>
                  <textarea name="feedback" rows="3" required />
                </div>
                <div className="actions" style={{ marginTop: 4 }}>
                  <button className="btn btn-primary" type="submit" disabled={gradingId === submission.submission_id}>
                    {gradingId === submission.submission_id ? 'Saving...' : 'Grade and lock'}
                  </button>
                </div>
              </form>
            ) : null}
          </section>
        ))}
      </div>
    </DashboardShell>
  );
}
