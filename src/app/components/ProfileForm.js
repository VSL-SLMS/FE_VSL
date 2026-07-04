'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiUrl } from '../../lib/api';
import { useStoredUser, writeStoredUser } from '../../lib/authStorage';

function getRoleLabel(role) {
  return String(role || '').toLowerCase();
}

function formatDateInput(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

export default function ProfileForm({ role }) {
  const expectedRole = String(role || '').toUpperCase();
  const { ready: authReady, user: storedUser } = useStoredUser(expectedRole);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authReady) return;
    setCurrentUser(storedUser);
    setMessage(storedUser?.token ? '' : `${expectedRole[0]}${expectedRole.slice(1).toLowerCase()} login is required.`);
  }, [authReady, expectedRole, storedUser]);

  async function onSubmit(event) {
    event.preventDefault();
    if (!currentUser?.token || loading) return;

    setLoading(true);
    setMessage('Saving profile...');
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(apiUrl('/users/me/profile'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          name: form.get('name'),
          email: expectedRole === 'STUDENT' ? form.get('email') : undefined,
          avatarUrl: form.get('avatarUrl'),
          dateOfBirth: expectedRole === 'STUDENT' ? form.get('dateOfBirth') : undefined
        })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Could not update profile.');

      const nextUser = {
        ...currentUser,
        ...payload.data.user,
        token: currentUser.token
      };
      writeStoredUser(nextUser);
      setCurrentUser(nextUser);
      setMessage('Profile updated.');
    } catch (error) {
      setMessage(error.message || 'Backend is offline.');
    } finally {
      setLoading(false);
    }
  }

  async function removeAvatar() {
    if (!currentUser?.token || loading) return;

    setLoading(true);
    setMessage('Removing avatar...');

    try {
      const response = await fetch(apiUrl('/users/me/avatar'), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${currentUser.token}`
        }
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Could not remove avatar.');

      const nextUser = {
        ...currentUser,
        ...payload.data.user,
        token: currentUser.token
      };
      writeStoredUser(nextUser);
      setCurrentUser(nextUser);
      setMessage('Avatar removed.');
    } catch (error) {
      setMessage(error.message || 'Backend is offline.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      {message && <div className="empty">{message}</div>}

      <section className="card stack" style={{ boxShadow: 'none' }}>
        <div className="page-title">
          <div>
            <span className="eyebrow">{getRoleLabel(currentUser?.role || role)} account</span>
            <h2>{currentUser?.display_name || currentUser?.email || 'Profile'}</h2>
            <p className="muted">{currentUser?.email}</p>
          </div>
          {currentUser?.avatar_url ? (
            <div
              aria-label="Avatar preview"
              role="img"
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                border: '1px solid var(--line)',
                backgroundImage: `url(${currentUser.avatar_url})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover'
              }}
            />
          ) : (
            <span className="brand-mark" style={{ width: 72, height: 72, borderRadius: 18 }}>
              {(currentUser?.display_name || currentUser?.email || '?').slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>

        <form className="form-grid" onSubmit={onSubmit}>
          <div className="field">
            <label>Display name</label>
            <input name="name" defaultValue={currentUser?.display_name || ''} required />
          </div>
          {expectedRole === 'STUDENT' && (
            <>
              <div className="field">
                <label>Email</label>
                <input name="email" type="email" defaultValue={currentUser?.email || ''} required />
              </div>
              <div className="field">
                <label>Date of birth</label>
                <input name="dateOfBirth" type="date" defaultValue={formatDateInput(currentUser?.date_of_birth)} />
              </div>
            </>
          )}
          <div className="field">
            <label>Avatar URL</label>
            <input name="avatarUrl" defaultValue={currentUser?.avatar_url || ''} placeholder="https://example.com/avatar.png" />
          </div>
          <div className="actions" style={{ marginTop: 4 }}>
            <button className="btn btn-primary" type="submit" disabled={!currentUser?.token || loading}>
              {loading ? 'Saving...' : 'Save profile'}
            </button>
            <button className="btn" type="button" onClick={removeAvatar} disabled={!currentUser?.avatar_url || loading}>
              Remove avatar
            </button>
            <Link className="btn" href="/change-password">Change password</Link>
          </div>
        </form>
      </section>
    </div>
  );
}
