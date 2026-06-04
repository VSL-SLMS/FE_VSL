'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { DashboardShell } from '../../../components/Nav';
import { apiUrl } from '../../../../lib/api';
import { readStoredUser } from '../../../../lib/authStorage';

function formatDate(value) {
  if (!value) return 'No deadline';
  return new Date(value).toLocaleString();
}

export default function StudentAssignmentDetailPage() {
  const params = useParams();
  const assignmentId = params?.id;
  const [currentUser] = useState(() => readStoredUser('STUDENT'));
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(() =>
    currentUser?.token ? 'Loading assignment...' : 'Student login is required.'
  );

  const loadAssignment = useCallback(async () => {
    if (!currentUser?.token || !assignmentId) return;

    const response = await fetch(apiUrl(`/student/assignments/${assignmentId}`), {
      headers: { Authorization: `Bearer ${currentUser.token}` }
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'Could not load assignment.');

    setAssignment(payload.data);
    setMessage('');
  }, [assignmentId, currentUser]);

  useEffect(() => {
    loadAssignment().catch((error) => setMessage(error.message || 'Backend is offline.'));
  }, [loadAssignment]);

  async function onSubmit(event) {
    event.preventDefault();
    if (!currentUser?.token || !assignmentId || loading) return;

    setLoading(true);
    setMessage('Submitting assignment...');
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(apiUrl(`/student/assignments/${assignmentId}/submit`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          content: form.get('content'),
          fileUrl: form.get('fileUrl')
        })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Could not submit assignment.');

      setAssignment(payload.data);
      setMessage('Assignment submitted.');
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error.message || 'Backend is offline.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell role="student" title="Assignment detail">
      <div className="stack">
        {message && <div className="empty">{message}</div>}

        {assignment ? (
          <section className="card stack" style={{ boxShadow: 'none' }}>
            <div className="page-title">
              <div>
                <span className="eyebrow">{assignment.teacher_name}</span>
                <h2>{assignment.title}</h2>
                <p className="muted">{formatDate(assignment.deadline)}</p>
              </div>
              <span className="pill">{assignment.student_facing_status}</span>
            </div>

            <p>{assignment.instructions}</p>

            {assignment.submission_id ? (
              <div className="card" style={{ boxShadow: 'none' }}>
                <span className="eyebrow">Your submission</span>
                <p>{assignment.submission_content || 'No text answer'}</p>
                {assignment.file_path ? <p className="muted">File: {assignment.file_path}</p> : null}
                {assignment.score !== null && assignment.score !== undefined ? (
                  <p><strong>Score:</strong> {assignment.score} · <strong>Feedback:</strong> {assignment.feedback || 'No feedback'}</p>
                ) : null}
              </div>
            ) : null}

            {assignment.can_submit ? (
              <form className="form-grid" onSubmit={onSubmit}>
                <div className="field">
                  <label>Answer</label>
                  <textarea name="content" rows="5" placeholder="Write your answer or describe your uploaded practice video." />
                </div>
                <div className="field">
                  <label>File URL</label>
                  <input name="fileUrl" placeholder="https://example.com/submission.mp4" />
                </div>
                <div className="actions" style={{ marginTop: 4 }}>
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit assignment'}
                  </button>
                  <Link className="btn" href="/student/assignments">Back to assignments</Link>
                </div>
              </form>
            ) : (
              <div className="actions">
                <Link className="btn" href="/student/assignments">Back to assignments</Link>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </DashboardShell>
  );
}
