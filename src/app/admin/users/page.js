'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashboardShell } from '../../components/Nav';
import { apiUrl } from '../../../lib/api';
import { readStoredUser } from '../../../lib/authStorage';

export default function AdminUsersPage() {
  const [currentUser] = useState(() => readStoredUser('ADMIN'));
  const [users, setUsers] = useState([]);
  const [teacherAccounts, setTeacherAccounts] = useState([]);
  const [updatingTeacherId, setUpdatingTeacherId] = useState(null);
  const [editingTeacherId, setEditingTeacherId] = useState(null);
  const [savingTeacherProfileId, setSavingTeacherProfileId] = useState(null);
  const [message, setMessage] = useState(() => {
    const storedAdmin = readStoredUser('ADMIN');
    return storedAdmin?.token ? 'Loading users...' : 'Admin login is required.';
  });

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    if (currentUser.role !== 'ADMIN') {
      return;
    }

    Promise.all([
      fetch(apiUrl('/admin/users'), {
        headers: {
          Authorization: `Bearer ${currentUser.token}`
        }
      }).then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load users.');
        return payload.data.users || [];
      }),
      fetch(apiUrl('/admin/teachers'), {
        headers: {
          Authorization: `Bearer ${currentUser.token}`
        }
      }).then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load teachers.');
        return payload.data.teachers || [];
      })
    ])
      .then(([userRows, teacherRows]) => {
        setUsers(userRows);
        setTeacherAccounts(teacherRows);
        setMessage('');
      })
      .catch((error) => {
        setMessage(error.message || 'Backend is offline.');
      });
  }, [currentUser]);

  async function updateTeacherStatus(teacher, status) {
    if (!currentUser?.token || updatingTeacherId) return;

    setUpdatingTeacherId(teacher.id);
    try {
      const response = await fetch(apiUrl(`/admin/teachers/${teacher.id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ status })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Could not update teacher status.');

      setTeacherAccounts((items) =>
        items.map((item) => (item.id === teacher.id ? payload.data.teacher : item))
      );
      setUsers((items) =>
        items.map((item) =>
          item.id === payload.data.teacher.user_id
            ? { ...item, status: payload.data.teacher.status }
            : item
        )
      );
      setMessage('');
    } catch (error) {
      setMessage(error.message || 'Backend is offline.');
    } finally {
      setUpdatingTeacherId(null);
    }
  }

  async function updateTeacherProfile(event, teacher) {
    event.preventDefault();
    if (!currentUser?.token || savingTeacherProfileId) return;

    setSavingTeacherProfileId(teacher.id);
    setMessage('Saving teacher profile...');
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(apiUrl(`/admin/teachers/${teacher.id}/profile`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          name: form.get('name'),
          avatarUrl: form.get('avatarUrl'),
          bio: form.get('bio'),
          specialization: form.get('specialization'),
          availabilityStatus: form.get('availabilityStatus'),
          maxStudents: Number(form.get('maxStudents') || 30),
          reliabilityLabel: form.get('reliabilityLabel')
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Could not update teacher profile.');

      setTeacherAccounts((items) =>
        items.map((item) => (item.id === teacher.id ? payload.data.teacher : item))
      );
      setUsers((items) =>
        items.map((item) =>
          item.id === payload.data.teacher.user_id
            ? {
                ...item,
                display_name: payload.data.teacher.display_name,
                avatar_url: payload.data.teacher.avatar_url
              }
            : item
        )
      );
      setEditingTeacherId(null);
      setMessage('Teacher profile updated.');
    } catch (error) {
      setMessage(error.message || 'Backend is offline.');
    } finally {
      setSavingTeacherProfileId(null);
    }
  }

  const students = users.filter((user) => user.role === 'STUDENT');
  const admins = users.filter((user) => user.role === 'ADMIN');

  function renderUser(user) {
    return (
      <div className="card user-row" style={{ boxShadow: 'none' }} key={user.id}>
        <div>
          <strong>{user.display_name || user.email}</strong>
          <p className="muted">
            {user.email}
            {user.role === 'STUDENT' && user.assigned_teacher_name ? ` · Teacher: ${user.assigned_teacher_name}` : ''}
          </p>
        </div>
        <div className="user-badges">
          <span className="pill">{user.role}</span>
          <span className="pill">{user.status}</span>
          {user.must_change_password ? <span className="pill">Password change required</span> : null}
        </div>
      </div>
    );
  }

  function renderTeacher(teacher) {
    const nextStatus = teacher.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const isEditingProfile = editingTeacherId === teacher.id;
    return (
      <div className="card stack" style={{ boxShadow: 'none' }} key={teacher.id}>
        <div className="user-row">
          <div>
            <strong>{teacher.display_name || teacher.email}</strong>
            <p className="muted">
              {teacher.email} · {teacher.specialization || 'General VSL learning'}
            </p>
            <p className="muted">
              {teacher.current_student_count || 0}/{teacher.max_students || 30} Students · {teacher.availability_status || 'OPEN'} · {teacher.reliability_label || 'NEW'}
            </p>
          </div>
          <div className="user-badges">
            <span className="pill">TEACHER</span>
            <span className="pill">{teacher.status}</span>
            {teacher.must_change_password ? <span className="pill">Password change required</span> : null}
            <button
              className="btn"
              type="button"
              onClick={() => setEditingTeacherId(isEditingProfile ? null : teacher.id)}
            >
              {isEditingProfile ? 'Cancel edit' : 'Edit profile'}
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => updateTeacherStatus(teacher, nextStatus)}
              disabled={updatingTeacherId === teacher.id}
            >
              {updatingTeacherId === teacher.id ? 'Saving...' : nextStatus === 'SUSPENDED' ? 'Suspend' : 'Activate'}
            </button>
          </div>
        </div>

        {!isEditingProfile && teacher.bio ? (
          <p className="muted" style={{ margin: 0 }}>{teacher.bio}</p>
        ) : null}

        {isEditingProfile && (
          <form className="form-grid" onSubmit={(event) => updateTeacherProfile(event, teacher)}>
            <div className="field">
              <label>Full name</label>
              <input name="name" defaultValue={teacher.display_name || ''} required />
            </div>
            <div className="field">
              <label>Avatar URL</label>
              <input name="avatarUrl" defaultValue={teacher.avatar_url || ''} placeholder="https://example.com/avatar.png" />
            </div>
            <div className="field">
              <label>Specialization</label>
              <input name="specialization" defaultValue={teacher.specialization || ''} placeholder="Beginner VSL, alphabet, family signs" />
            </div>
            <div className="field">
              <label>Availability</label>
              <select name="availabilityStatus" defaultValue={teacher.availability_status || 'OPEN'}>
                <option value="OPEN">OPEN</option>
                <option value="LIMITED">LIMITED</option>
                <option value="FULL">FULL</option>
              </select>
            </div>
            <div className="field">
              <label>Max students</label>
              <input name="maxStudents" type="number" min="1" max="500" defaultValue={teacher.max_students || 30} required />
            </div>
            <div className="field">
              <label>Reliability label</label>
              <select name="reliabilityLabel" defaultValue={teacher.reliability_label || 'NEW'}>
                <option value="NEW">NEW</option>
                <option value="RELIABLE">RELIABLE</option>
                <option value="HIGHLY_RELIABLE">HIGHLY_RELIABLE</option>
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Bio</label>
              <textarea name="bio" rows="3" defaultValue={teacher.bio || ''} placeholder="Short profile shown to Students during teacher selection." />
            </div>
            <div className="actions" style={{ marginTop: 4 }}>
              <button className="btn btn-primary" type="submit" disabled={savingTeacherProfileId === teacher.id}>
                {savingTeacherProfileId === teacher.id ? 'Saving...' : 'Save teacher profile'}
              </button>
              <button className="btn" type="button" onClick={() => setEditingTeacherId(null)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <DashboardShell role="admin" title="Users">
      <div className="stack">
        <div className="card" style={{ boxShadow: 'none' }}>
          <div className="admin-card-head">
            <div>
              <strong>User access control</strong>
              <p className="muted" style={{ marginBottom: 0 }}>
                Students register publicly. Teacher accounts are created by Admin and require first-login password change.
              </p>
            </div>
            <div className="actions">
              <Link className="btn" href="/admin/teacher-change-requests">Teacher requests</Link>
              <Link className="btn btn-primary" href="/admin/users/create-teacher">Create teacher</Link>
            </div>
          </div>
        </div>

        {message && <div className="empty">{message}</div>}

        {!message && (
          <>
            <section className="stack">
              <div className="page-title"><h2>Teachers ({teacherAccounts.length})</h2></div>
              {teacherAccounts.map(renderTeacher)}
              {!teacherAccounts.length && <div className="empty">No teachers found.</div>}
            </section>

            <section className="stack">
              <div className="page-title"><h2>Students ({students.length})</h2></div>
              {students.map(renderUser)}
              {!students.length && <div className="empty">No students found.</div>}
            </section>

            <section className="stack">
              <div className="page-title"><h2>Admin ({admins.length})</h2></div>
              {admins.map(renderUser)}
            </section>
          </>
        )}

        {!message && !users.length && <div className="empty">No users found.</div>}
      </div>
    </DashboardShell>
  );
}
