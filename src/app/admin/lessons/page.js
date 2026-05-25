import { DashboardShell } from '../../components/Nav';
import { fetchApi } from '../../../lib/api';

async function getParts() {
  try {
    const response = await fetchApi('/lessons');
    return response.data.parts || [];
  } catch {
    return [];
  }
}

export default async function AdminLessonsPage() {
  const parts = await getParts();

  return (
    <DashboardShell role="admin" title="Lessons">
      <div className="stack">
        {parts.map((part) => (
          <section className="card" key={part.id}>
            <span className="eyebrow">Part {part.order_index}</span>
            <h2>{part.title}</h2>
            <p className="muted">{(part.chapters || []).length} chapters</p>
          </section>
        ))}
      </div>
    </DashboardShell>
  );
}
