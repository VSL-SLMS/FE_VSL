'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashboardShell } from '../../components/Nav';
import { apiUrl } from '../../../lib/api';
import { useStoredUser } from '../../../lib/authStorage';

function flattenLessons(parts) {
  return (parts || [])
    .flatMap((part) => (part.chapters || []).map((chapter) => ({ part, chapter })))
    .flatMap(({ part, chapter }) => (
      (chapter.lessons || []).map((lesson) => ({ ...lesson, part, chapter }))
    ));
}

function getProgress(parts) {
  const lessons = flattenLessons(parts);
  const completed = lessons.filter((lesson) => lesson.progress_status === 'COMPLETED').length;
  return {
    lessons,
    completed,
    total: lessons.length,
    percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0
  };
}

export default function StudentLessonsPage() {
  const { ready: authReady, user: currentUser } = useStoredUser('STUDENT');
  const [parts, setParts] = useState([]);
  const [hasTeacher, setHasTeacher] = useState(false);
  const [hasCourseAccess, setHasCourseAccess] = useState(false);
  const [message, setMessage] = useState('Loading lessons...');

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser?.token) {
      setMessage('Student login is required.');
      return;
    }

    fetch(apiUrl('/student/lessons'), {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          const error = new Error(payload.message || 'Could not load student lessons.');
          error.code = payload.code;
          throw error;
        }
        return payload.data.parts || [];
      })
      .then((lessonParts) => {
        setHasTeacher(true);
        setHasCourseAccess(true);
        setParts(lessonParts);
        setMessage('');
      })
      .catch((error) => {
        setParts([]);
        if (error.code === 'TEACHER_REQUIRED') {
          setHasTeacher(false);
          setMessage('Choose a Teacher before accessing lessons.');
          return;
        }
        setHasTeacher(true);
        if (error.code === 'COURSE_PURCHASE_REQUIRED') {
          setHasCourseAccess(false);
          setMessage('Purchase the course to unlock full lesson content.');
          return;
        }
        setMessage(error.message || 'Backend is offline.');
      });
  }, [authReady, currentUser]);

  const progress = getProgress(parts);
  const continueLesson = progress.lessons.find((lesson) => lesson.progress_status === 'IN_PROGRESS')
    || progress.lessons.find((lesson) => lesson.progress_status !== 'COMPLETED')
    || progress.lessons.at(-1);

  return (
    <DashboardShell role="student" title="Learning journey">
      <div className="stack">
        {message && (
          <div className="empty">
            {message}
            {!currentUser?.token && <div style={{ marginTop: 14 }}><Link className="btn btn-primary" href="/login">Log in</Link></div>}
            {currentUser?.token && !hasTeacher && <div style={{ marginTop: 14 }}><Link className="btn btn-primary" href="/student/select-teacher">Select teacher</Link></div>}
            {hasTeacher && !hasCourseAccess && <div style={{ marginTop: 14 }}><Link className="btn btn-primary" href="/payment">Purchase course</Link></div>}
          </div>
        )}

        {hasTeacher && hasCourseAccess && parts.length > 0 && (
          <>
            <section className="card stack">
              <div className="page-title" style={{ marginBottom: 0 }}>
                <div>
                  <span className="eyebrow">Sign Language 101</span>
                  <h2>Continue your learning journey</h2>
                  <p className="muted">
                    {progress.completed} of {progress.total} lessons completed.
                  </p>
                </div>
                {continueLesson && (
                  <Link className="btn btn-primary" href={`/lessons/${continueLesson.slug}`}>
                    Continue Learning
                  </Link>
                )}
              </div>
              <div className="progress-track" aria-label={`Course progress ${progress.percent}%`}>
                <div className="progress-bar" style={{ width: `${progress.percent}%` }} />
              </div>
              <p className="muted" style={{ margin: 0 }}>{progress.percent}% complete</p>
            </section>

            <section className="card stack">
              <span className="eyebrow">Curriculum</span>
              {parts.map((part, partIndex) => (
                <details className="learning-section" key={part.id} open={partIndex === 0}>
                  <summary>
                    <span>
                      <strong>Part {part.order_index}: {part.title}</strong>
                      {part.description && <small>{part.description}</small>}
                    </span>
                  </summary>
                  {(part.chapters || []).map((chapter) => {
                    const lessons = chapter.lessons || [];
                    const completed = lessons.filter((lesson) => lesson.progress_status === 'COMPLETED').length;
                    return (
                      <details className="learning-chapter" key={chapter.id} open>
                        <summary>
                          <span>{chapter.title}</span>
                          <span className="pill">{completed}/{lessons.length} complete</span>
                        </summary>
                        <div className="learning-lesson-list">
                          {lessons.map((lesson) => {
                            const completedLesson = lesson.progress_status === 'COMPLETED';
                            return (
                              <Link className="learning-lesson-row" href={`/lessons/${lesson.slug}`} key={lesson.id}>
                                <span aria-hidden="true">{completedLesson ? '✓' : '○'}</span>
                                <span>
                                  <strong>{lesson.title}</strong>
                                  <small>{lesson.lesson_type} · {lesson.estimated_minutes || 15} min</small>
                                </span>
                                <span className="pill">{completedLesson ? 'Completed' : 'Open'}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </details>
                    );
                  })}
                </details>
              ))}
            </section>
          </>
        )}

        {hasTeacher && hasCourseAccess && !message && !parts.length && (
          <div className="empty">No lessons returned from backend. Check the backend API connection and import the VSL database.</div>
        )}
      </div>
    </DashboardShell>
  );
}
