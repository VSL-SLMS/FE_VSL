import Link from 'next/link';
import Nav from '../../components/Nav';
import CompleteLessonButton from '../../components/CompleteLessonButton';
import { apiUrl, backendAssetUrl, fetchApi } from '../../../lib/api';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function getSessionUser() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get('slms_session')?.value;

  if (!rawSession) return null;

  try {
    return JSON.parse(rawSession);
  } catch {
    return null;
  }
}

function buildLoginUrl(slug, mode) {
  const lessonPath = `/lessons/${slug}${mode === 'book' ? '?mode=book' : ''}`;
  return `/login?redirect=${encodeURIComponent(lessonPath)}`;
}

async function getStudentLesson(slug, token) {
  const response = await fetch(apiUrl(`/student/lessons/${slug}`), {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.message || 'Could not load student lesson.');
    error.status = response.status;
    error.code = payload.code;
    throw error;
  }
  return payload.data;
}

async function getLesson(slug, token, role) {
  if (role === 'STUDENT') {
    return getStudentLesson(slug, token);
  }

  try {
    const response = await fetchApi(`/lessons/${slug}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      throw error;
    }

    return null;
  }
}

async function hasSelectedTeacher(user) {
  if (user.role !== 'STUDENT') return true;

  try {
    const response = await fetchApi('/student/dashboard', {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });
    return Boolean(response.data?.student?.teacher_id);
  } catch {
    return false;
  }
}

export default async function LessonDetailPage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const mode = query?.mode === 'book' ? 'book' : 'learn';
  const user = await getSessionUser();

  if (!user?.token) {
    redirect(buildLoginUrl(slug, mode));
  }

  if (!(await hasSelectedTeacher(user))) {
    redirect('/student/select-teacher');
  }

  let data = null;

  try {
    data = await getLesson(slug, user.token, user.role);
  } catch (error) {
    if (error.code === 'COURSE_PURCHASE_REQUIRED') {
      const preview = await fetchApi(`/lessons/${slug}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      data = {
        lesson: preview.data.lesson,
        hasAccess: false
      };
    } else if (error.code === 'TEACHER_REQUIRED') {
      redirect('/student/select-teacher');
    } else {
      redirect(buildLoginUrl(slug, mode));
    }
  }

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

  const { lesson, content = [], pages = [], navigation = {}, hasAccess, progress } = data;

  if (hasAccess === false) {
    return (
      <>
        <Nav />
        <main className="page" style={{ maxWidth: 760 }}>
          <header className="page-head" style={{ marginBottom: 32 }}>
            <div>
              <Link className="muted" href="/lessons">All lessons</Link>
              <h1 style={{ marginTop: 8 }}>{lesson.title}</h1>
              <p className="muted" style={{ fontWeight: 800, marginTop: 4 }}>{lesson.part_title} / {lesson.chapter_title}</p>
            </div>
          </header>

          <div className="card center stack" style={{ padding: '54px 36px', borderTop: '6px solid var(--primary)', alignItems: 'center' }}>
            <span style={{ fontSize: 64 }}>🔒</span>
            <h2 style={{ fontSize: 26, margin: '18px 0 8px', fontWeight: 900 }}>Bài Học Giới Hạn</h2>
            <p className="muted" style={{ maxWidth: 500, margin: '0 auto 28px', lineHeight: 1.6, fontWeight: 800 }}>
              Bài học này chỉ dành cho học viên đã mua khóa học. Hãy tham gia cùng hàng ngàn học viên khác mở khóa trọn đời toàn bộ 28 bài học của SignLearn ngay hôm nay!
            </p>
            
            <div className="stack" style={{ gap: 14, margin: '0 auto', maxWidth: 320, width: '100%' }}>
              <Link href="/payment" className="btn btn-primary" style={{ width: '100%', minHeight: 46 }}>
                Mua khóa học ngay (299.000đ)
              </Link>
              <Link href="/lessons" className="btn" style={{ width: '100%', minHeight: 46 }}>
                Quay lại danh sách bài học
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

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
            {user.role === 'STUDENT' && (
              <CompleteLessonButton lessonId={lesson.id} initialCompleted={progress?.status === 'COMPLETED'} />
            )}
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
