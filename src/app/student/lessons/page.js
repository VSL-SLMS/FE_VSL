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

    Promise.all([
      fetch(apiUrl('/student/dashboard'), {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      }).then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load student profile.');
        return payload.data;
      }),
      fetch(apiUrl('/lessons')).then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load lessons.');
        return payload.data.parts || [];
      }),
      fetch(apiUrl('/course-access/me'), {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      }).then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load course access.');
        return Boolean(payload.data?.hasAccess);
      })
    ])
      .then(([dashboard, lessonParts, courseAccess]) => {
        const teacherSelected = Boolean(dashboard?.student?.teacher_id);
        setHasTeacher(teacherSelected);
        setHasCourseAccess(courseAccess);
        setParts(teacherSelected ? lessonParts : []);
        if (!teacherSelected) {
          setMessage('Choose a Teacher before accessing lessons.');
          return;
        }
        setMessage(courseAccess ? '' : 'Purchase the course to unlock full lesson content.');
      })
      .catch((error) => setMessage(error.message || 'Backend is offline.'));
  }, [currentUser]);

  return (
    <DashboardShell role="student" title="Lessons">
      <div className="stack">
        {message && (
          <div className="empty">
            {message}
            {!hasTeacher && <div style={{ marginTop: 14 }}><Link className="btn btn-primary" href="/student/select-teacher">Select teacher</Link></div>}
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
                      {!hasCourseAccess && <span className="pill">Locked</span>}
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
