import Link from 'next/link';
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

export default async function StudentLessonsPage() {
  const parts = await getParts();

  return (
    <DashboardShell role="student" title="Lessons">
      <div className="stack">
        {parts.map((part) => (
          <section className="card stack" key={part.id}>
            <div>
              <span className="eyebrow">Part {part.order_index}</span>
              <h2>{part.title}</h2>
              <p className="muted">{part.description}</p>
            </div>
            {(part.chapters || []).map((chapter) => (
              <div className="chapter-block" key={chapter.id}>
                <div className="chapter-head">
                  <h3>{chapter.title}</h3>
                  <span className="pill">{chapter.lesson_count} lessons</span>
                </div>
                <div className="lesson-grid">
                  {(chapter.lessons || []).map((lesson) => (
                    <Link className="lesson-card" href={`/lessons/${lesson.slug}`} key={lesson.id}>
                      <span className="pill">{lesson.lesson_type}</span>
                      <h3>{lesson.title}</h3>
                      <p className="muted">{lesson.estimated_minutes || 15} min</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </DashboardShell>
  );
}
