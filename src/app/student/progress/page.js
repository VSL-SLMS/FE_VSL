'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardShell } from '../../components/Nav';
import { apiUrl } from '../../../lib/api';
import { readStoredUser } from '../../../lib/authStorage';

export default function StudentProgressPage() {
  const [currentUser] = useState(() => readStoredUser('STUDENT'));
  const [progress, setProgress] = useState(null);
  const [message, setMessage] = useState(() =>
    currentUser?.token ? 'Loading progress...' : 'Student login is required.'
  );

  useEffect(() => {
    if (!currentUser?.token) return;

    fetch(apiUrl('/student/progress'), {
      headers: { Authorization: `Bearer ${currentUser.token}` }
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load progress.');
        return payload.data;
      })
      .then((data) => {
        setProgress(data);
        setMessage('');
      })
      .catch((error) => setMessage(error.message || 'Backend is offline.'));
  }, [currentUser]);

  const summary = progress?.summary || { totalLessons: 0, completedLessons: 0, progressPercent: 0 };

  return (
    <DashboardShell role="student" title="Progress">
      <div className="stack">
        {message && <div className="empty">{message}</div>}

        {progress && (
          <>
            <section className="card stack">
              <span className="eyebrow">Course progress</span>
              <h2>{summary.progressPercent}% completed</h2>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${summary.progressPercent}%` }} />
              </div>
              <p className="muted">
                {summary.completedLessons} of {summary.totalLessons} lessons completed.
              </p>
            </section>

            <section className="card stack">
              <span className="eyebrow">Lesson history</span>
              {(progress.lessons || []).map((lesson) => (
                <Link className="lesson-card" href={`/lessons/${lesson.slug}`} key={lesson.lesson_id}>
                  <span className="pill">{lesson.status}</span>
                  <h3>{lesson.title}</h3>
                  <p className="muted">
                    {lesson.part_title} / {lesson.chapter_title}
                    {lesson.completed_at ? ` · Completed ${new Date(lesson.completed_at).toLocaleDateString('vi-VN')}` : ''}
                  </p>
                </Link>
              ))}
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
