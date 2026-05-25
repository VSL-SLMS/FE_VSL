import { DashboardShell } from '../../components/Nav';
import { fetchApi } from '../../../lib/api';

async function getUsers() {
  try {
    const response = await fetchApi('/admin/users');
    return response.data.users || [];
  } catch {
    return [];
  }
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <DashboardShell role="admin" title="Users">
      <div className="stack">
        {users.map((user) => (
          <div className="card" style={{ boxShadow: 'none' }} key={user.id}>
            <strong>{user.display_name || user.email}</strong>
            <p className="muted">{user.email} · {user.role} · {user.status}</p>
          </div>
        ))}
        {!users.length && <div className="empty">No users yet. Register a student or teacher from the frontend.</div>}
      </div>
    </DashboardShell>
  );
}
