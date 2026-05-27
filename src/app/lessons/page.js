import Link from 'next/link';
import Nav from '../components/Nav';
import { fetchApi } from '../../lib/api';

async function getLessons() {
  try {
    const response = await fetchApi('/lessons');
    return response.data.parts || [];
  } catch {
    return [];
  }
}

export default async function LessonsPage() {
  const parts = await getLessons();

  return (
    <>
      <Nav />
      <main className="page">
        <header className="page-head">
          <div>
            <span className="eyebrow">Course content</span>
            <h1>Lessons</h1>
            <p>Course structure is loaded from the Express backend and existing VSL MySQL content tables.</p>
          </div>
          <Link className="btn" href="/">Back home</Link>
        </header>

        <div className="stack">
          {parts.map((part) => (
            <section className="card stack" key={part.id}>
              <div>
                <span className="eyebrow">Part {part.order_index}</span>
                <h2>{part.title}</h2>
                <p className="muted">{part.description}</p>
              </div>

              {(part.chapters || []).map((chapter) => (
                <div className="chapter" key={chapter.id}>
                  <div className="chapter-head">
                    <div>
                      <h3>{chapter.title}</h3>
                      <p className="muted">{chapter.description}</p>
                    </div>
                    <span className="pill">{chapter.lesson_count} lessons</span>
                  </div>

                  <div className="lesson-grid">
                    {(chapter.lessons || []).map((lesson) => (
                      <Link className="lesson-card" href={`/lessons/${lesson.slug}`} key={lesson.id}>
                        <span className="pill">{lesson.lesson_type}</span>
                        <h4>{lesson.title}</h4>
                        <p className="muted">{lesson.estimated_minutes || 15} min</p>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}

          {!parts.length && (
            <div className="empty">No lessons returned from backend. Check the backend API connection and import the VSL database.</div>
          )}
        </div>
      </main>
    </>
  );
}
