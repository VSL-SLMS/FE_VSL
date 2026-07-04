'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '../../components/Nav';
import { apiUrl } from '../../../lib/api';
import { useStoredUser } from '../../../lib/authStorage';

export default function AdminTeacherChangeRequestsPage() {
  const { ready: authReady, user: currentUser } = useStoredUser('ADMIN');
  const [requests, setRequests] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState('Loading teacher change requests...');

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser?.token) {
      setMessage('Admin login is required.');
      return;
    }

    let cancelled = false;

    fetch(apiUrl('/admin/teacher-change-requests'), {
      headers: { Authorization: `Bearer ${currentUser.token}` }
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load requests.');
        if (!cancelled) {
          setRequests(payload.data.requests || []);
          setMessage('');
        }
      })
      .catch((error) => {
        if (!cancelled) setMessage(error.message || 'Backend is offline.');
      });

    return () => {
      cancelled = true;
    };
  }, [authReady, currentUser, refreshKey]);

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
      setRefreshKey((value) => value + 1);
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
                {request.student_email} · {request.current_teacher_name || 'No current teacher'} → {request.requested_teacher_name || 'Student will choose again'}
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
