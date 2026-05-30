import Link from 'next/link';
import { HomeNav } from '../components/Nav';
import { fetchApi } from '../../lib/api';
import { FREE_LESSON_PATH } from './free-lesson';

async function getCurriculum() {
  try {
    const response = await fetchApi('/course-overview');
    return response.data.parts || [];
  } catch {
    return [];
  }
}

function flattenLessons(parts) {
  return parts
    .flatMap((part) => (part.chapters || []).map((chapter) => ({ part, chapter })))
    .flatMap(({ part, chapter }) => (
      (chapter.lessons || []).map((lesson) => ({ ...lesson, part, chapter }))
    ));
}

function getLessonSummary(lesson, index) {
  const fallbackSummaries = [
    'Learn the history and basics of sign language communication.',
    'Master the first half of the manual alphabet.',
    'Complete the manual alphabet with letters N through Z.',
    'Sign numbers from 1 to 100 and basic counting.',
    'Hello, goodbye, please, thank you and more.',
    'Mother, father, sister, brother, and family signs.',
    'Build sentences for daily interactions.',
    'Comprehensive evaluation of all learned skills.'
  ];

  return lesson.description || lesson.chapter?.description || fallbackSummaries[index] || 'Build practical VSL vocabulary step by step.';
}

export default async function CurriculumPage() {
  const parts = await getCurriculum();
  const lessons = flattenLessons(parts);
  const journeyLessons = lessons.slice(0, 8);
  const chapterCount = parts.reduce((total, part) => total + (part.chapters?.length || 0), 0);
  const totalMinutes = lessons.reduce(
    (total, lesson) => total + Number(lesson.estimated_minutes || 15),
    0
  );

  const outcomes = [
    'Fingerspell the full VSL alphabet with confidence',
    'Sign numbers, dates and basic time expressions',
    'Greet, introduce yourself and hold a short chat',
    'Talk about your family and daily routine in VSL',
    'Understand regional variations across Vietnam',
    'Pass the final assessment and earn a certificate'
  ];

  return (
    <>
      <HomeNav />
      <main className="curriculum-shell">
        <section className="curriculum-hero">
          <div className="curriculum-container">
            <span className="curriculum-kicker">Sign Language 101 · Curriculum overview</span>
            <h1>
              A clear path from your <span className="text-teal">first sign</span> to{' '}
              <span className="text-orange">real conversations</span>
            </h1>
            <p>
              {chapterCount || 1} chapters · {lessons.length || 8} bite-sized lessons · {totalMinutes || 157} minutes
              of guided learning taught by real Deaf-community teachers.
            </p>
            <div className="actions">
              <Link className="btn btn-primary" href="/register">Enroll for free</Link>
              <Link className="btn" href="/login">I already have an account</Link>
            </div>

            <div className="curriculum-stats">
              <div className="curriculum-stat">
                <span>📚</span>
                <div>
                  <strong>{lessons.length || 8} lessons</strong>
                  <small>Full course outline</small>
                </div>
              </div>
              <div className="curriculum-stat">
                <span>🧭</span>
                <div>
                  <strong>{chapterCount || 1} chapters</strong>
                  <small>Clear learning path</small>
                </div>
              </div>
              <div className="curriculum-stat">
                <span>⏱</span>
                <div>
                  <strong>~{Math.max(1, Math.round((totalMinutes || 157) / 60))}h total</strong>
                  <small>At your own pace</small>
                </div>
              </div>
              <div className="curriculum-stat">
                <span>🔓</span>
                <div>
                  <strong>Lesson 1</strong>
                  <small>Free guest preview</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="curriculum-section">
          <div className="curriculum-container curriculum-narrow">
            <span className="eyebrow">What you will learn</span>
            <h2>A guided path across {chapterCount || 1} chapters</h2>
            <p className="journey-intro">
              This preview highlights the first {journeyLessons.length || 8} lessons in the course. The full curriculum
              continues across every chapter after you log in as a student.
            </p>

            <div className="journey-list">
              {journeyLessons.map((lesson, index) => {
                const isUnlocked = index === 0;
                const lessonHref = isUnlocked
                  ? FREE_LESSON_PATH
                  : `/login?redirect=${encodeURIComponent(`/lessons/${lesson.slug}`)}`;

                return (
                  <Link className="journey-card" href={lessonHref} key={lesson.id}>
                    <span className="journey-number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="journey-body">
                      <span className="journey-title">
                        {lesson.title}
                        {isUnlocked && <span className="free-badge">Free preview</span>}
                      </span>
                      <span className="journey-copy">{getLessonSummary(lesson, index)}</span>
                      <span className="journey-meta">
                        {lesson.estimated_minutes || 15} min · PDF + video
                      </span>
                    </span>
                    <span className={`journey-action ${isUnlocked ? 'is-open' : ''}`}>
                      {isUnlocked ? 'Open' : 'Locked'}
                    </span>
                  </Link>
                );
              })}

              {!journeyLessons.length && (
                <div className="empty">No curriculum returned from backend. Check the backend API connection and import the VSL database.</div>
              )}
            </div>
          </div>
        </section>

        <section className="curriculum-outcomes">
          <div className="curriculum-container">
            <span className="eyebrow">By the end</span>
            <h2>You will be able to...</h2>
            <div className="outcome-grid">
              {outcomes.map((outcome) => (
                <div className="outcome-pill" key={outcome}>
                  <span>✓</span>
                  {outcome}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="curriculum-final">
          <div className="curriculum-cta-card">
            <p>★★★★★ Loved by 2,400+ learners</p>
            <h2>Ready to start lesson 1?</h2>
            <span>Free preview · No credit card · Learn at your own pace.</span>
            <Link className="btn" href={FREE_LESSON_PATH}>Open free lesson</Link>
          </div>
        </section>

        <footer className="footer">
          © 2026 SignLearn · Vietnamese Sign Language Curriculum
        </footer>
      </main>
    </>
  );
}
