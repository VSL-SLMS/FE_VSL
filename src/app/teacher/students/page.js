'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '../../components/Nav';
import { apiUrl } from '../../../lib/api';
import { useStoredUser } from '../../../lib/authStorage';

export default function TeacherStudentsPage() {
  const { ready: authReady, user: currentUser } = useStoredUser('TEACHER');
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState('Loading assigned students...');

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser?.token) {
      setMessage('Teacher login is required.');
      return;
    }

    fetch(apiUrl('/teacher/students'), {
      headers: { Authorization: `Bearer ${currentUser.token}` }
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load students.');
        setStudents(payload.data || []);
        setMessage('');
      })
      .catch((error) => setMessage(error.message || 'Backend is offline.'));
  }, [authReady, currentUser]);

  return (
    <DashboardShell role="teacher" title="Students">
      <div className="stack">
        {message && <div className="empty">{message}</div>}

        {!message && !students.length ? (
          <div className="empty">No assigned students yet.</div>
        ) : null}

        {students.map((student) => (
          <div className="user-row" key={student.id}>
            <div>
              <strong>{student.display_name}</strong>
              <p className="muted">{student.email}</p>
            </div>
            <div className="actions" style={{ marginTop: 0 }}>
              <span className="pill">{student.status}</span>
              <span className="pill">{student.assignment_count || 0} assignments</span>
              <span className="pill">{student.submitted_count || 0} submitted</span>
              <span className="pill">{student.graded_count || 0} graded</span>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
