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

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function formatBytes(value) {
  if (!value) return '0 MB';
  return `${(Number(value) / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileFormat(file) {
  const match = file?.name?.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : '';
}

function validateAvatarFile(file) {
  if (!file?.name) return null;
  const format = getFileFormat(file);
  if (!ALLOWED_AVATAR_FORMATS.includes(format)) {
    throw new Error('Use JPG, PNG, or WEBP avatar images.');
  }
  if (file.type && !ALLOWED_AVATAR_TYPES.includes(file.type)) {
    throw new Error('Use JPG, PNG, or WEBP avatar images.');
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error('Avatar image must be 5 MB or smaller.');
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

export default function ProfileForm({ role }) {
  const expectedRole = String(role || '').toUpperCase();
  const { ready: authReady, user: storedUser } = useStoredUser(expectedRole);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
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
    setUploadProgress(null);
    setMessage('Saving profile...');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const avatarFile = selectedAvatarFile || form.get('avatarFile');

    try {
      let avatarUrl = currentUser.avatar_url || '';
      const avatarFormat = validateAvatarFile(avatarFile);
      if (avatarFile?.name) {
        setMessage('Preparing avatar upload...');
        const signatureResponse = await fetch(apiUrl('/users/me/avatar/upload-signature'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentUser.token}`
          },
          body: JSON.stringify({
            fileName: avatarFile.name,
            fileSize: avatarFile.size,
            contentType: avatarFile.type,
            format: avatarFormat
          })
        });
        const signaturePayload = await signatureResponse.json();
        if (!signatureResponse.ok) throw new Error(signaturePayload.message || 'Could not prepare avatar upload.');

        setMessage('Uploading avatar...');
        setUploadProgress(0);
        const uploaded = await uploadToCloudinary(signaturePayload.data, avatarFile, setUploadProgress);
        avatarUrl = uploaded.secure_url;
      }

      setMessage('Saving profile...');
      const response = await fetch(apiUrl('/users/me/profile'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          name: form.get('name'),
          email: expectedRole === 'STUDENT' ? form.get('email') : undefined,
          avatarUrl,
          dateOfBirth: expectedRole === 'STUDENT' ? form.get('dateOfBirth') : undefined,
          bio: expectedRole === 'TEACHER' ? form.get('bio') : undefined
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
      setSelectedAvatarFile(null);
      setUploadProgress(null);
      if (formElement.elements.avatarFile) {
        formElement.elements.avatarFile.value = '';
      }
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
      setSelectedAvatarFile(null);
      setUploadProgress(null);
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
          {expectedRole === 'TEACHER' && (
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Bio</label>
              <textarea
                name="bio"
                rows="4"
                maxLength="1000"
                defaultValue={currentUser?.bio || ''}
                placeholder="Short profile shown to Students during teacher selection."
              />
            </div>
          )}
          <div className="field">
            <label>Avatar</label>
            <input
              name="avatarFile"
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              disabled={loading}
              onChange={(event) => {
                setSelectedAvatarFile(event.target.files?.[0] || null);
                setUploadProgress(null);
              }}
            />
            {selectedAvatarFile ? (
              <p className="muted">{selectedAvatarFile.name} · {formatBytes(selectedAvatarFile.size)}</p>
            ) : null}
            {uploadProgress !== null ? (
              <progress className="upload-progress" value={uploadProgress} max="100">{uploadProgress}%</progress>
            ) : null}
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
