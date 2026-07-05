'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashboardShell } from '../../components/Nav';
import { apiUrl } from '../../../lib/api';
import { useStoredUser } from '../../../lib/authStorage';

function formatDate(value) {
  if (!value) return 'No deadline';
  return new Date(value).toLocaleString();
}

export default function StudentAssignmentsPage() {
  const { ready: authReady, user: currentUser } = useStoredUser('STUDENT');
  const [assignments, setAssignments] = useState([]);
  const [message, setMessage] = useState('Loading assignments...');

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser?.token) {
      setMessage('Student login is required.');
      return;
    }

    fetch(apiUrl('/student/assignments'), {
      headers: { Authorization: `Bearer ${currentUser.token}` }
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load assignments.');
        setAssignments(payload.data || []);
        setMessage('');
      })
      .catch((error) => setMessage(error.message || 'Backend is offline.'));
  }, [authReady, currentUser]);

  return (
    <DashboardShell role="student" title="Assignments">
      <div className="stack">
        {message && <div className="empty">{message}</div>}
        {!message && !assignments.length ? <div className="empty">No assignments have been assigned yet.</div> : null}

        {assignments.map((assignment) => (
          <section className="card stack" key={assignment.id} style={{ boxShadow: 'none' }}>
            <div className="page-title">
              <div>
                <span className="eyebrow">{assignment.teacher_name}</span>
                <h2>{assignment.title}</h2>
                <p className="muted">{formatDate(assignment.deadline)}</p>
              </div>
              <span className="pill">{assignment.student_facing_status}</span>
            </div>
            <p className="muted">{assignment.instructions}</p>
            {assignment.score !== null && assignment.score !== undefined ? (
              <p><strong>Score:</strong> {assignment.score} · <strong>Feedback:</strong> {assignment.feedback || 'No feedback'}</p>
            ) : null}
            <div className="actions">
              <Link className="btn btn-primary" href={`/student/assignments/${assignment.id}`}>
                {assignment.workflow_status === 'NEEDS_REVISION' ? 'Open and resubmit' : assignment.can_submit ? 'Open and submit' : 'View detail'}
              </Link>
            </div>
          </section>
        ))}
      </div>
    </DashboardShell>
  );
}
