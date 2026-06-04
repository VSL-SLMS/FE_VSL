'use client';

import { useCallback, useEffect, useState } from 'react';
import { DashboardShell } from '../../components/Nav';
import { apiUrl } from '../../../lib/api';
import { readStoredUser } from '../../../lib/authStorage';

function formatDate(value) {
  if (!value) return 'No deadline';
  return new Date(value).toLocaleString();
}

export default function TeacherAssignmentsPage() {
  const [currentUser] = useState(() => readStoredUser('TEACHER'));
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(() =>
    currentUser?.token ? 'Loading assignments...' : 'Teacher login is required.'
  );

  const loadData = useCallback(async () => {
    if (!currentUser?.token) return;

    const headers = { Authorization: `Bearer ${currentUser.token}` };
    const [studentsResponse, assignmentsResponse] = await Promise.all([
      fetch(apiUrl('/teacher/students'), { headers }),
      fetch(apiUrl('/teacher/assignments'), { headers })
    ]);

    const studentsPayload = await studentsResponse.json();
    const assignmentsPayload = await assignmentsResponse.json();
    if (!studentsResponse.ok) throw new Error(studentsPayload.message || 'Could not load students.');
    if (!assignmentsResponse.ok) throw new Error(assignmentsPayload.message || 'Could not load assignments.');

    setStudents(studentsPayload.data || []);
    setAssignments(assignmentsPayload.data || []);
    setMessage('');
  }, [currentUser]);

  useEffect(() => {
    loadData().catch((error) => setMessage(error.message || 'Backend is offline.'));
  }, [loadData]);

  function toggleStudent(studentId) {
    setSelectedStudents((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId]
    );
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!currentUser?.token || loading) return;

    setLoading(true);
    setMessage('Creating assignment...');
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(apiUrl('/teacher/assignments'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          title: form.get('title'),
          instructions: form.get('instructions'),
          deadline: form.get('deadline') || null,
          allowLateSubmission: form.get('allowLateSubmission') === 'on',
          studentIds: selectedStudents
        })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Could not create assignment.');

      event.currentTarget.reset();
      setSelectedStudents([]);
      await loadData();
      setMessage('Assignment created.');
    } catch (error) {
      setMessage(error.message || 'Backend is offline.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell role="teacher" title="Assignments">
      <div className="stack">
        {message && <div className="empty">{message}</div>}

        <section className="card stack" style={{ boxShadow: 'none' }}>
          <span className="eyebrow">Create assignment</span>
          <form className="form-grid" onSubmit={onSubmit}>
            <div className="field">
              <label>Title</label>
              <input name="title" placeholder="Practice greeting signs" required />
            </div>
            <div className="field">
              <label>Instructions</label>
              <textarea name="instructions" rows="4" placeholder="Describe what students need to submit." required />
            </div>
            <div className="field">
              <label>Deadline</label>
              <input name="deadline" type="datetime-local" />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800 }}>
              <input name="allowLateSubmission" type="checkbox" />
              Allow late submission
            </label>

            <div className="field">
              <label>Assign to students</label>
              <div className="stack">
                {!students.length ? <p className="muted">No students are assigned to you yet.</p> : null}
                {students.map((student) => (
                  <label className="user-row" key={student.id} style={{ cursor: 'pointer' }}>
                    <div>
                      <strong>{student.display_name}</strong>
                      <p className="muted">{student.email}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="actions" style={{ marginTop: 4 }}>
              <button className="btn btn-primary" type="submit" disabled={loading || !selectedStudents.length}>
                {loading ? 'Creating...' : 'Create assignment'}
              </button>
            </div>
          </form>
        </section>

        <section className="stack">
          <span className="eyebrow">Existing assignments</span>
          {!assignments.length ? <div className="empty">No assignments yet.</div> : null}
          {assignments.map((assignment) => (
            <div className="card" key={assignment.id} style={{ boxShadow: 'none' }}>
              <div className="page-title">
                <div>
                  <h2>{assignment.title}</h2>
                  <p className="muted">{assignment.instructions}</p>
                  <p className="muted">{formatDate(assignment.deadline)}</p>
                </div>
                <span className="pill">{assignment.allow_late_submission ? 'Late allowed' : 'Strict deadline'}</span>
              </div>
              <div className="actions">
                <span className="pill">{assignment.assigned_count || 0} assigned</span>
                <span className="pill">{assignment.submitted_count || 0} submitted</span>
                <span className="pill">{assignment.graded_count || 0} graded</span>
              </div>
            </div>
          ))}
        </section>
      </div>
    </DashboardShell>
  );
}
