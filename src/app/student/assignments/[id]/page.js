'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { DashboardShell } from '../../../components/Nav';
import { apiUrl } from '../../../../lib/api';
import { useStoredUser } from '../../../../lib/authStorage';

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const ALLOWED_VIDEO_FORMATS = ['mp4', 'mov', 'webm'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

function formatDate(value) {
  if (!value) return 'No deadline';
  return new Date(value).toLocaleString();
}

function formatBytes(value) {
  if (!value) return '0 MB';
  return `${(Number(value) / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileFormat(file) {
  const match = file?.name?.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : '';
}

function validateVideoFile(file) {
  if (!file?.name) throw new Error('Practice video is required.');
  const format = getFileFormat(file);
  if (!ALLOWED_VIDEO_FORMATS.includes(format)) {
    throw new Error('Use MP4, MOV, or WEBM video.');
  }
  if (file.type && !ALLOWED_VIDEO_TYPES.includes(file.type)) {
    throw new Error('Use MP4, MOV, or WEBM video.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Video must be 100 MB or smaller.');
  }
  return format;
}

function uploadToCloudinary(signature, file, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    Object.entries(signature.params || {}).forEach(([key, value]) => {
      form.append(key, value);
    });
    form.append('api_key', signature.apiKey);
    form.append('signature', signature.signature);
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', signature.uploadUrl);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onerror = () => reject(new Error('Cloudinary upload failed.'));
    xhr.onload = () => {
      let payload = {};
      try {
        payload = JSON.parse(xhr.responseText || '{}');
      } catch {
        reject(new Error('Cloudinary returned an invalid response.'));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload);
        return;
      }
      reject(new Error(payload.error?.message || 'Cloudinary upload failed.'));
    };
    xhr.send(form);
  });
}

export default function StudentAssignmentDetailPage() {
  const params = useParams();
  const assignmentId = params?.id;
  const { ready: authReady, user: currentUser } = useStoredUser('STUDENT');
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [message, setMessage] = useState('Loading assignment...');

  const loadAssignment = useCallback(async () => {
    if (!authReady || !assignmentId) return;
    if (!currentUser?.token) {
      setMessage('Student login is required.');
      return;
    }

    const response = await fetch(apiUrl(`/student/assignments/${assignmentId}`), {
      headers: { Authorization: `Bearer ${currentUser.token}` }
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'Could not load assignment.');

    setAssignment(payload.data);
    setMessage('');
  }, [assignmentId, authReady, currentUser]);

  useEffect(() => {
    loadAssignment().catch((error) => setMessage(error.message || 'Backend is offline.'));
  }, [loadAssignment]);

  async function onSubmit(event) {
    event.preventDefault();
    if (!currentUser?.token || !assignmentId || loading) return;

    setLoading(true);
    setUploadProgress(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = selectedFile || form.get('video');
    const wasRevision = assignment?.workflow_status === 'NEEDS_REVISION';

    try {
      const format = validateVideoFile(file);
      setMessage('Preparing upload...');
      const signatureResponse = await fetch(apiUrl(`/student/assignments/${assignmentId}/upload-signature`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
          format
        })
      });
      const signaturePayload = await signatureResponse.json();
      if (!signatureResponse.ok) throw new Error(signaturePayload.message || 'Could not prepare video upload.');

      setMessage('Uploading video...');
      setUploadProgress(0);
      const uploaded = await uploadToCloudinary(signaturePayload.data, file, setUploadProgress);

      setMessage('Finalizing submission...');
      const response = await fetch(apiUrl(`/student/assignments/${assignmentId}/submit`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          content: form.get('content'),
          cloudinary: {
            public_id: uploaded.public_id,
            asset_id: uploaded.asset_id,
            secure_url: uploaded.secure_url,
            resource_type: uploaded.resource_type,
            format: uploaded.format,
            bytes: uploaded.bytes,
            duration: uploaded.duration,
            original_filename: uploaded.original_filename || file.name,
            type: uploaded.type || signaturePayload.data.deliveryType
          }
        })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Could not submit assignment.');

      setAssignment(payload.data);
      setMessage(wasRevision ? 'Assignment resubmitted.' : 'Assignment submitted.');
      setSelectedFile(null);
      setUploadProgress(null);
      formElement.reset();
    } catch (error) {
      setMessage(error.message || 'Backend is offline.');
    } finally {
      setLoading(false);
    }
  }

  async function onAddComment(event) {
    event.preventDefault();
    if (!currentUser?.token || !assignment?.submission_id || commentLoading || !commentText.trim()) return;

    setCommentLoading(true);
    try {
      const response = await fetch(apiUrl(`/submissions/${assignment.submission_id}/comments`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ content: commentText })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Could not add comment.');
      setAssignment((current) => ({
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

            {assignment.workflow_status === 'NEEDS_REVISION' && assignment.revision_note ? (
              <div className="empty">
                <strong>Teacher revision note:</strong> {assignment.revision_note}
              </div>
            ) : null}

            {assignment.submission_id ? (
              <div className="card" style={{ boxShadow: 'none' }}>
                <span className="eyebrow">Your submission</span>
                <p>{assignment.submission_content || 'No text answer'}</p>
                {assignment.media?.playback_url ? (
                  <video className="submission-video" src={assignment.media.playback_url} controls preload="metadata" />
                ) : null}
                {assignment.media ? (
                  <p className="muted">
                    {assignment.media.original_filename || assignment.media.public_id} · {formatBytes(assignment.media.bytes)}
                  </p>
                ) : null}
                {assignment.score !== null && assignment.score !== undefined ? (
                  <p><strong>Score:</strong> {assignment.score} · <strong>Feedback:</strong> {assignment.feedback || 'No feedback'}</p>
                ) : null}
              </div>
            ) : null}

            {assignment.submission_id ? (
              <section className="stack">
                <span className="eyebrow">Comments</span>
                {assignment.comments?.length ? (
                  assignment.comments.map((comment) => (
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
                <form className="form-grid" onSubmit={onAddComment}>
                  <div className="field" style={{ gridColumn: '1 / -1' }}>
                    <label>Add comment</label>
                    <textarea
                      rows="3"
                      value={commentText}
                      maxLength="1000"
                      onChange={(event) => setCommentText(event.target.value)}
                      placeholder="Ask a question or respond to feedback."
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

            {assignment.can_submit ? (
              <form className="form-grid" onSubmit={onSubmit}>
                <div className="field">
                  <label>Answer</label>
                  <textarea
                    name="content"
                    rows="5"
                    defaultValue={assignment.workflow_status === 'NEEDS_REVISION' ? assignment.submission_content || '' : ''}
                    placeholder="Optional note for Teacher"
                  />
                </div>
                <div className="field">
                  <label>Practice video</label>
                  <input
                    name="video"
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                    required
                    onChange={(event) => {
                      setSelectedFile(event.target.files?.[0] || null);
                      setUploadProgress(null);
                    }}
                  />
                  {selectedFile ? (
                    <p className="muted">{selectedFile.name} · {formatBytes(selectedFile.size)}</p>
                  ) : null}
                  {uploadProgress !== null ? (
                    <progress className="upload-progress" value={uploadProgress} max="100">{uploadProgress}%</progress>
                  ) : null}
                </div>
                <div className="actions" style={{ marginTop: 4 }}>
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Submitting...' : assignment.workflow_status === 'NEEDS_REVISION' ? 'Resubmit' : 'Submit assignment'}
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
