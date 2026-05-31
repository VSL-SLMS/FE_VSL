'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashboardShell } from '../../components/Nav';
import { apiUrl } from '../../../lib/api';
import { readStoredUser } from '../../../lib/authStorage';

export default function StudentLessonsPage() {
  const [currentUser] = useState(() => readStoredUser('STUDENT'));
  const [parts, setParts] = useState([]);
  const [hasTeacher, setHasTeacher] = useState(false);
  const [hasCourseAccess, setHasCourseAccess] = useState(false);
  const [message, setMessage] = useState(() =>
    currentUser?.token ? 'Loading lessons...' : 'Student login is required.'
  );

  useEffect(() => {
    if (!currentUser?.token) return;

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
  }, [currentUser]);

  return (
    <DashboardShell role="student" title="Lessons">
      <div className="stack">
        {message && (
          <div className="empty">
            {message}
            {!currentUser?.token && <div style={{ marginTop: 14 }}><Link className="btn btn-primary" href="/login">Log in</Link></div>}
            {currentUser?.token && !hasTeacher && <div style={{ marginTop: 14 }}><Link className="btn btn-primary" href="/student/select-teacher">Select teacher</Link></div>}
            {hasTeacher && !hasCourseAccess && <div style={{ marginTop: 14 }}><Link className="btn btn-primary" href="/payment">Purchase course</Link></div>}
          </div>
        )}

        {hasTeacher && parts.map((part) => (
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
                      <span className="pill">{lesson.progress_status === 'COMPLETED' ? 'Completed' : 'Not started'}</span>
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
