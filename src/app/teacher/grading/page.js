'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import { DashboardShell } from '../../components/Nav';
import { apiUrl } from '../../../lib/api';
import { useStoredUser } from '../../../lib/authStorage';

function statusLabel(status) {
  if (status === 'NEEDS_REVISION') return 'Returned for revision';
  if (status === 'SUBMITTED') return 'Waiting for review';
  if (status === 'GRADED') return 'Graded';
  return status === 'NOT_SUBMITTED' ? 'Not submitted' : status;
}

function formatBytes(value) {
  if (!value) return '0 MB';
  return `${(Number(value) / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TeacherGradingPage() {
  const { ready: authReady, user: currentUser } = useStoredUser('TEACHER');
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [detailLoadingId, setDetailLoadingId] = useState(null);
  const [gradingId, setGradingId] = useState(null);
  const [revisionId, setRevisionId] = useState(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [revisionText, setRevisionText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [message, setMessage] = useState('Loading submissions...');

  const loadSubmissions = useCallback(async () => {
    if (!authReady) return;
    if (!currentUser?.token) {
      setMessage('Teacher login is required.');
      return;
    }

    const response = await fetch(apiUrl('/teacher/submissions'), {
      headers: { Authorization: `Bearer ${currentUser.token}` }
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'Could not load submissions.');

    setSubmissions(payload.data || []);
    setMessage('');
  }, [authReady, currentUser]);

  const loadSubmissionDetail = useCallback(async (submissionId) => {
    if (!currentUser?.token) return;

    setDetailLoadingId(submissionId);
    const response = await fetch(apiUrl(`/teacher/submissions/${submissionId}`), {
      headers: { Authorization: `Bearer ${currentUser.token}` }
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'Could not load submission detail.');

    setSelectedSubmission(payload.data);
    setRevisionText('');
    setCommentText('');
    setDetailLoadingId(null);
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
      setSelectedSubmission(null);
      setMessage('Submission graded and locked.');
    } catch (error) {
      setMessage(error.message || 'Backend is offline.');
    } finally {
      setGradingId(null);
    }
  }

  async function onReturnRevision(event, submissionId) {
    event.preventDefault();
    if (!currentUser?.token || revisionId || !revisionText.trim()) return;

    setRevisionId(submissionId);
    setMessage('Returning submission for revision...');

    try {
      const response = await fetch(apiUrl(`/teacher/submissions/${submissionId}/return-revision`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ comment: revisionText })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Could not return submission.');

      await loadSubmissions();
      setSelectedSubmission(payload.data);
      setRevisionText('');
      setMessage('Submission returned for revision.');
    } catch (error) {
      setMessage(error.message || 'Backend is offline.');
    } finally {
      setRevisionId(null);
    }
  }

  async function onAddComment(event, submissionId) {
    event.preventDefault();
    if (!currentUser?.token || commentLoading || !commentText.trim()) return;

    setCommentLoading(true);
    try {
      const response = await fetch(apiUrl(`/submissions/${submissionId}/comments`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ content: commentText })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Could not add comment.');
      setSelectedSubmission((current) => ({
        ...current,
        comments: payload.data.comments || current.comments || []
      }));
      setCommentText('');
      setMessage('');
    } catch (error) {
      setMessage(error.message || 'Backend is offline.');
    } finally {
      setCommentLoading(false);
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

        {submissions.map((submission) => {
          const isSelected = selectedSubmission?.id === submission.submission_id;
          const detail = isSelected ? selectedSubmission : submission;
          const media = detail.media;

          return (
            <section className="card stack" key={`${submission.assignment_id}-${submission.student_id}`} style={{ boxShadow: 'none' }}>
              <div className="page-title">
                <div>
                  <span className="eyebrow">{submission.assignment_title}</span>
                  <h2>{submission.student_name}</h2>
                  <p className="muted">{submission.student_email}</p>
                </div>
                <span className="pill">{submission.teacher_facing_status || statusLabel(submission.submission_status)}</span>
              </div>

              <div className="card" style={{ boxShadow: 'none' }}>
                <p><strong>Answer:</strong> {detail.content || 'No text answer'}</p>
                {media ? (
                  <p className="muted">{media.original_filename || media.public_id} · {formatBytes(media.bytes)}</p>
                ) : null}
                {detail.score !== null && detail.score !== undefined ? (
                  <p><strong>Score:</strong> {detail.score} · <strong>Feedback:</strong> {detail.feedback}</p>
                ) : null}
              </div>

              <div className="actions">
                <button
                  className="btn"
                  type="button"
                  disabled={detailLoadingId === submission.submission_id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedSubmission(null);
                      return;
                    }
                    loadSubmissionDetail(submission.submission_id)
                      .catch((error) => {
                        setDetailLoadingId(null);
                        setMessage(error.message || 'Backend is offline.');
                      });
                  }}
                >
                  {detailLoadingId === submission.submission_id ? 'Loading...' : isSelected ? 'Close review' : 'Review video'}
                </button>
              </div>

              {isSelected && media?.playback_url ? (
                <video className="submission-video" src={media.playback_url} controls preload="metadata" />
              ) : null}

              {isSelected ? (
                <section className="stack">
                  <span className="eyebrow">Comments</span>
                  {detail.comments?.length ? (
                    detail.comments.map((comment) => (
                      <div className="user-row" key={comment.id}>
                        <div>
                          <strong>{comment.author_name || comment.author_role}</strong>
                          <p className="muted" style={{ marginBottom: 0 }}>{comment.content}</p>
                        </div>
                        <span className="pill">{comment.event_type === 'COMMENT' ? comment.author_role : comment.event_type}</span>
                      </div>
                    ))
                  ) : (
                    <p className="muted">No comments yet.</p>
                  )}
                  <form className="form-grid" onSubmit={(event) => onAddComment(event, submission.submission_id)}>
                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                      <label>Add comment</label>
                      <textarea
                        rows="3"
                        maxLength="1000"
                        value={commentText}
                        onChange={(event) => setCommentText(event.target.value)}
                      />
                    </div>
                    <div className="actions" style={{ marginTop: 4 }}>
                      <button className="btn" type="submit" disabled={commentLoading || !commentText.trim()}>
                        {commentLoading ? 'Posting...' : 'Post comment'}
                      </button>
                    </div>
                  </form>
                </section>
              ) : null}

              {isSelected && detail.can_return_revision ? (
                <form className="form-grid" onSubmit={(event) => onReturnRevision(event, submission.submission_id)}>
                  <div className="field" style={{ gridColumn: '1 / -1' }}>
                    <label>Revision note</label>
                    <textarea
                      rows="3"
                      required
                      maxLength="1000"
                      value={revisionText}
                      onChange={(event) => setRevisionText(event.target.value)}
                      placeholder="Tell the Student what to improve before resubmitting."
                    />
                  </div>
                  <div className="actions" style={{ marginTop: 4 }}>
                    <button className="btn" type="submit" disabled={revisionId === submission.submission_id || !revisionText.trim()}>
                      {revisionId === submission.submission_id ? 'Returning...' : 'Return for revision'}
                    </button>
                  </div>
                </form>
              ) : null}

              {isSelected && detail.can_grade ? (
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
          );
        })}
      </div>
    </DashboardShell>
  );
}
