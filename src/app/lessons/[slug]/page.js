import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import CompleteLessonButton from '../../components/CompleteLessonButton';
import { apiUrl, backendAssetUrl, fetchApi } from '../../../lib/api';
import { getLessonTypeLabel, isReviewOrPracticeLesson, REVIEW_PRACTICE_HELP_TEXT } from '../../../lib/lessonDisplay';
import { getRoleHomePath } from '../../../lib/roleRoutes';

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

function lessonHref(slug, mode) {
  return `/lessons/${slug}${mode === 'book' ? '?mode=book' : ''}`;
}

function buildLoginUrl(slug, mode) {
  return `/login?redirect=${encodeURIComponent(lessonHref(slug, mode))}`;
}

async function fetchStudentJson(path, token, fallbackMessage) {
  const response = await fetch(apiUrl(path), {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` }
  });
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.message || fallbackMessage);
    error.status = response.status;
    error.code = payload.code;
    throw error;
  }
  return payload.data;
}

async function getStudentLesson(slug, token) {
  return fetchStudentJson(`/student/lessons/${slug}`, token, 'Could not load student lesson.');
}

async function getStudentCurriculum(token) {
  return fetchStudentJson('/student/lessons', token, 'Could not load student curriculum.');
}

async function hasSelectedTeacher(user) {
  try {
    const response = await fetchApi('/student/dashboard', {
      headers: { Authorization: `Bearer ${user.token}` }
    });
    return Boolean(response.data?.student?.teacher_id);
  } catch {
    return false;
  }
}

function flattenLessons(parts) {
  return (parts || [])
    .flatMap((part) => (part.chapters || []).map((chapter) => ({ part, chapter })))
    .flatMap(({ part, chapter }) => (
      (chapter.lessons || []).map((lesson) => ({ ...lesson, part, chapter }))
    ));
}

function progressFor(lessons) {
  const completed = lessons.filter((lesson) => lesson.progress_status === 'COMPLETED').length;
  return {
    completed,
    total: lessons.length,
    percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0
  };
}

function renderBlock(block) {
  if (block.type === 'heading') return <h3 key={block.id}>{block.text_content}</h3>;
  if (block.type === 'quote') return <blockquote key={block.id}>{block.text_content}</blockquote>;
  if (block.type === 'list') {
    return (
      <ul key={block.id}>
        {String(block.text_content || '').split('\n').filter(Boolean).map((item) => <li key={item}>{item}</li>)}
      </ul>
    );
  }
  if (block.type === 'image' && block.image_url) {
    return (
      <figure key={block.id}>
        <Image src={backendAssetUrl(block.image_url)} alt={block.image_caption || 'Lesson image'} width={900} height={600} />
        {block.image_caption && <figcaption>{block.image_caption}</figcaption>}
      </figure>
    );
  }
  return <p key={block.id}>{block.text_content}</p>;
}

function CurriculumSidebar({ parts, currentSlug, mode }) {
  const lessons = flattenLessons(parts);
  const progress = progressFor(lessons);

  return (
    <aside className="learning-sidebar" aria-label="Course curriculum">
      <section className="learning-progress">
        <span className="eyebrow">Journey Progress</span>
        <strong>{progress.percent}%</strong>
        <div className="progress-track" aria-label={`${progress.completed} of ${progress.total} lessons completed`}>
          <div className="progress-bar" style={{ width: `${progress.percent}%` }} />
        </div>
        <p>{progress.completed} of {progress.total} lessons completed</p>
      </section>

      <nav className="learning-sections">
        {parts.map((part) => {
          const partLessonSlugs = flattenLessons([part]).map((lesson) => lesson.slug);
          return (
            <details className="learning-section" key={part.id} open={partLessonSlugs.includes(currentSlug)}>
              <summary>
                <span>
                  <strong>{part.title}</strong>
                  <small>Part {part.order_index}</small>
                </span>
              </summary>
              {(part.chapters || []).map((chapter) => {
                const chapterLessons = chapter.lessons || [];
                const chapterProgress = progressFor(chapterLessons);
                return (
                  <details className="learning-chapter" key={chapter.id} open={chapterLessons.some((lesson) => lesson.slug === currentSlug)}>
                    <summary>
                      <span>{chapter.title}</span>
                      <span className="pill">{chapterProgress.completed}/{chapterProgress.total}</span>
                    </summary>
                    <div className="learning-lesson-list">
                      {chapterLessons.map((lesson) => {
                        const completed = lesson.progress_status === 'COMPLETED';
                        const current = lesson.slug === currentSlug;
                        return (
                          <Link
                            aria-current={current ? 'page' : undefined}
                            className={`learning-lesson-row ${current ? 'is-current' : ''}`}
                            href={lessonHref(lesson.slug, mode)}
                            key={lesson.id}
                          >
                            <span aria-hidden="true">{completed ? '✓' : current ? '→' : '○'}</span>
                            <span>
                              <strong>{lesson.title}</strong>
                              <small>{getLessonTypeLabel(lesson.lesson_type)} · {lesson.estimated_minutes || 15} min</small>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </details>
          );
        })}
      </nav>
    </aside>
  );
}

function LessonContent({ mode, content, pages }) {
  if (mode === 'book') {
    return (
      <div className="book-grid">
        {pages.map((page) => (
          <article className="book-page" key={page.id}>
            <span className="pill">Page {page.page_number}</span>
            <Image src={backendAssetUrl(page.image_path)} alt={`Lesson page ${page.page_number}`} width={800} height={1000} />
          </article>
        ))}
        {!pages.length && <div className="empty">No book pages are available for this lesson.</div>}
      </div>
    );
  }

  return (
    <div className="stack">
      {content.map((section) => (
        <section className="lesson-content-section" key={section.id}>
          <h2>{section.title || 'Lesson section'}</h2>
          {section.type === 'article' && <div className="lesson-article">{(section.blocks || []).map(renderBlock)}</div>}
          {section.type === 'grid' && (
            <div className="sign-grid">
              {(section.items || []).map((item) => (
                <article className="sign-card" key={item.id}>
                  {item.normalized_image_url && (
                    <Image src={backendAssetUrl(item.normalized_image_url)} alt={item.title || 'Sign example'} width={300} height={200} />
                  )}
                  <h3>{item.title}</h3>
                  <p className="muted">{item.description}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      ))}
      {!content.length && <div className="empty">No structured learning content is available for this lesson.</div>}
    </div>
  );
}

function PaymentGate({ lesson }) {
  return (
    <main className="learning-shell learning-gate">
      <section className="learning-content-card">
        <span className="eyebrow">Course access required</span>
        <h1>{lesson.title}</h1>
        <p className="muted">Purchase the course to unlock this lesson and continue your learning journey.</p>
        <div className="actions">
          <Link href="/payment" className="btn btn-primary">Purchase course</Link>
          <Link href="/student/lessons" className="btn">Back to lessons</Link>
        </div>
      </section>
    </main>
  );
}

export default async function LessonDetailPage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const requestedMode = query?.mode === 'book' ? 'book' : 'learn';
  const user = await getSessionUser();

  if (!user?.token) redirect(buildLoginUrl(slug, requestedMode));
  if (user.role !== 'STUDENT') redirect(getRoleHomePath(user.role));
  if (!(await hasSelectedTeacher(user))) redirect('/student/select-teacher');

  let data;
  let curriculum = { parts: [] };

  try {
    [data, curriculum] = await Promise.all([
      getStudentLesson(slug, user.token),
      getStudentCurriculum(user.token)
    ]);
  } catch (error) {
    if (error.code === 'COURSE_PURCHASE_REQUIRED') {
      const preview = await fetchApi(`/lessons/${slug}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      return <PaymentGate lesson={preview.data.lesson} />;
    }
    if (error.code === 'TEACHER_REQUIRED') redirect('/student/select-teacher');
    redirect(buildLoginUrl(slug, requestedMode));
  }

  const { lesson, content = [], pages = [], navigation = {}, progress } = data;
  const hasLearn = content.length > 0;
  const hasBook = pages.length > 0;
  const mode = requestedMode === 'book' && hasBook ? 'book' : hasLearn ? 'learn' : 'book';

  return (
    <main className="learning-shell">
      <header className="learning-header">
        <Link href="/student/lessons" className="brand">
          <span className="brand-mark">✦</span>
          <span>
            <span>SignLearn</span>
            <small>Learning Journey</small>
          </span>
        </Link>
        <div className="learning-header-meta">
          <span>Sign Language 101</span>
          <strong>{user.display_name || user.name || user.username || 'Student'}</strong>
          <Link className="btn" href="/student/profile">Profile</Link>
        </div>
      </header>

      <details className="mobile-curriculum">
        <summary>Course curriculum</summary>
        <CurriculumSidebar parts={curriculum.parts || []} currentSlug={lesson.slug} mode={mode} />
      </details>

      <div className="learning-grid">
        <CurriculumSidebar parts={curriculum.parts || []} currentSlug={lesson.slug} mode={mode} />

        <section className="learning-main">
          <div className="lesson-content-bar">
            <div>
              <span className="eyebrow">{getLessonTypeLabel(lesson.lesson_type)}</span>
              <h1>{lesson.title}</h1>
              <p className="muted">{lesson.part_title} / {lesson.chapter_title}</p>
              {isReviewOrPracticeLesson(lesson.lesson_type) && (
                <p className="muted">{REVIEW_PRACTICE_HELP_TEXT}</p>
              )}
            </div>
            {hasLearn && hasBook && (
              <div className="actions" style={{ marginTop: 0 }}>
                <Link className={`btn ${mode === 'learn' ? 'btn-primary' : ''}`} href={lessonHref(lesson.slug, 'learn')}>Learn</Link>
                <Link className={`btn ${mode === 'book' ? 'btn-primary' : ''}`} href={lessonHref(lesson.slug, 'book')}>Book</Link>
              </div>
            )}
          </div>

          <article className="learning-content-card">
            <LessonContent mode={mode} content={content} pages={pages} />
          </article>
        </section>
      </div>

      <footer className="lesson-footer">
        {navigation.prev ? (
          <Link className="btn" href={lessonHref(navigation.prev.slug, mode)}>Previous</Link>
        ) : (
          <button className="btn" type="button" disabled>Previous</button>
        )}
        <CompleteLessonButton lessonId={lesson.id} initialCompleted={progress?.status === 'COMPLETED'} />
        {navigation.next ? (
          <Link className="btn btn-primary" href={lessonHref(navigation.next.slug, mode)}>Next</Link>
        ) : (
          <button className="btn btn-primary" type="button" disabled>Next</button>
        )}
      </footer>
    </main>
  );
}
