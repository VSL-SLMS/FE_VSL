import { DashboardShell } from '../components/Nav';
import { fetchApi } from '../../lib/api';

async function getOverview() {
  try {
    const response = await fetchApi('/course-overview');
    return response.data.parts || [];
  } catch {
    return [];
  }
}

export default async function AdminPage() {
  const parts = await getOverview();
  const lessonCount = parts.reduce(
    (total, part) => total + (part.chapters || []).reduce((sum, chapter) => sum + (chapter.lessons?.length || 0), 0),
    0
  );

  return (
    <DashboardShell role="admin" title="Admin dashboard">
      <div className="role-grid">
        <div className="card"><span className="eyebrow">Course</span><h2>{lessonCount} lessons</h2><p className="muted">VSL content source is MySQL.</p></div>
        <div className="card"><span className="eyebrow">Users</span><h2>Manage accounts</h2><p className="muted">Suspend/delete users and monitor roles.</p></div>
        <div className="card"><span className="eyebrow">Escalations</span><h2>Final decision</h2><p className="muted">Admin resolves appeals after teacher review limits.</p></div>
      </div>
    </DashboardShell>
  );
}
