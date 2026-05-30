import Link from 'next/link';
import Nav from '../../components/Nav';
import { backendAssetUrl, fetchApi } from '../../../lib/api';
import Image from 'next/image';

async function getLesson(slug) {
  const response = await fetchApi(`/lessons/${slug}`);
  return response.data;
}

export default async function LessonDetailPage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const data = await getLesson(slug);
  const mode = query?.mode === 'book' ? 'book' : 'learn';

  if (!data) {
    return (
      <>
        <Nav />
        <main className="page">
          <div className="empty">Lesson not found or backend is not available.</div>
        </main>
      </>
    );
  }

  const { lesson, content, pages, navigation } = data;

  return (
    <>
      <Nav />
      <main className="page">
        <header className="page-head">
          <div>
            <Link className="muted" href="/lessons">All lessons</Link>
            <h1>{lesson.title}</h1>
            <p>{lesson.part_title} / {lesson.chapter_title}</p>
          </div>
          <div className="actions">
            <Link className={`btn ${mode === 'learn' ? 'btn-primary' : ''}`} href={`/lessons/${lesson.slug}?mode=learn`}>
              Learn mode
            </Link>
            <Link className={`btn ${mode === 'book' ? 'btn-primary' : ''}`} href={`/lessons/${lesson.slug}?mode=book`}>
              Book mode
            </Link>
          </div>
        </header>

        <div className="lesson-detail">
          <section className="stack">
            {mode === 'learn' && (
              <>
                {!content.length && <div className="empty">This lesson has no structured cards yet. Use Book mode.</div>}
                {content.map((section) => (
                  <div className="card stack" key={section.id}>
                    <h2>{section.title || 'Lesson section'}</h2>
                    {section.type === 'grid' && (
                      <div className="sign-grid">
                        {(section.items || []).map((item) => (
                          <article className="card sign-card" key={item.id}>
                            {item.normalized_image_url && (
                              <Image src={backendAssetUrl(item.normalized_image_url)} alt={item.title} width={300} height={200} style={{ width: '100%', height: 'auto', objectFit: 'cover' }} />
                            )}
                            <h3>{item.title}</h3>
                            <p className="muted">{item.description}</p>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {mode === 'book' && (
              <div className="book-grid">
                {pages.map((page) => (
                  <article className="book-page" key={page.id}>
                    <span className="pill">Page {page.page_number}</span>
                    <Image src={backendAssetUrl(page.image_path)} alt={`Page ${page.page_number}`} width={800} height={1000} style={{ width: '100%', height: 'auto' }} />
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="card sidebar-card">
            <span className="eyebrow">Navigation</span>
            <div className="stack" style={{ marginTop: 16 }}>
              {navigation.prev && <Link className="btn" href={`/lessons/${navigation.prev.slug}`}>Previous lesson</Link>}
              {navigation.next && <Link className="btn btn-primary" href={`/lessons/${navigation.next.slug}`}>Next lesson</Link>}
              {!navigation.prev && !navigation.next && <p className="muted">No adjacent lesson in this chapter.</p>}
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
