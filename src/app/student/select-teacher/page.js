import { DashboardShell } from '../../components/Nav';
import { fetchApi } from '../../../lib/api';

async function getTeachers() {
  try {
    const response = await fetchApi('/teachers');
    return response.data.teachers || [];
  } catch {
    return [];
  }
}

export default async function SelectTeacherPage() {
  const teachers = await getTeachers();

  return (
    <DashboardShell role="student" title="Choose teacher">
      <div className="role-grid">
        {teachers.map((teacher) => (
          <article className="card" key={teacher.id}>
            <span className="brand-mark">{teacher.display_name?.[0] || 'T'}</span>
            <h2>{teacher.display_name}</h2>
            <p className="muted">{teacher.email}</p>
            <p className="pill">{teacher.accuracy}% accuracy</p>
            <button className="btn btn-primary" type="button">Select teacher</button>
          </article>
        ))}
        {!teachers.length && (
          <div className="empty">No teacher account exists yet. Register a teacher account first.</div>
        )}
      </div>
    </DashboardShell>
  );
}
