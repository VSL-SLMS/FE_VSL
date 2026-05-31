'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '../../components/Nav';
import { apiUrl } from '../../../lib/api';

function readCurrentUser() {
  if (typeof window === 'undefined') return null;
  const rawUser = localStorage.getItem('slms_user');
  return rawUser ? JSON.parse(rawUser) : null;
}

export default function AdminTeacherChangeRequestsPage() {
  const [currentUser] = useState(readCurrentUser);
  const [requests, setRequests] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [message, setMessage] = useState('Loading teacher change requests...');

  function loadRequests() {
    if (!currentUser?.token) {
      setMessage('Admin login is required.');
      return;
    }

    fetch(apiUrl('/admin/teacher-change-requests'), {
      headers: { Authorization: `Bearer ${currentUser.token}` }
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load requests.');
        setRequests(payload.data.requests || []);
        setMessage('');
      })
      .catch((error) => setMessage(error.message || 'Backend is offline.'));
  }

  useEffect(loadRequests, [currentUser]);

  async function reviewRequest(id, status) {
    if (!currentUser?.token || loadingId) return;
    setLoadingId(id);
    setMessage('');

    try {
      const response = await fetch(apiUrl(`/admin/teacher-change-requests/${id}/review`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ status })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Could not review request.');
      loadRequests();
    } catch (error) {
      setMessage(error.message || 'Backend is offline.');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <DashboardShell role="admin" title="Teacher change requests">
      <div className="stack">
        {message && <div className="empty">{message}</div>}

        {requests.map((request) => (
          <section className="card user-row" style={{ boxShadow: 'none' }} key={request.id}>
            <div>
              <strong>{request.student_name}</strong>
              <p className="muted">
                {request.student_email} · {request.current_teacher_name || 'No current teacher'} → {request.requested_teacher_name}
              </p>
              <p className="muted">{request.reason}</p>
            </div>
            <div className="user-badges">
              <span className="pill">{request.status}</span>
              {request.status === 'PENDING' && (
                <>
                  <button className="btn btn-primary" type="button" disabled={loadingId === request.id} onClick={() => reviewRequest(request.id, 'APPROVED')}>
                    Approve
                  </button>
                  <button className="btn" type="button" disabled={loadingId === request.id} onClick={() => reviewRequest(request.id, 'REJECTED')}>
                    Reject
                  </button>
                </>
              )}
            </div>
          </section>
        ))}

        {!message && !requests.length && <div className="empty">No teacher change requests.</div>}
      </div>
    </DashboardShell>
  );
}
