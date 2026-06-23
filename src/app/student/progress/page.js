'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardShell } from '../../components/Nav';
import { apiUrl } from '../../../lib/api';
import { readStoredUser } from '../../../lib/authStorage';

export default function StudentProgressPage() {
  const [currentUser] = useState(() => readStoredUser('STUDENT'));
  const [progress, setProgress] = useState(null);
  const [topicProgress, setTopicProgress] = useState(null);
  const [message, setMessage] = useState(() =>
    currentUser?.token ? 'Loading progress...' : 'Student login is required.'
  );

  useEffect(() => {
    if (!currentUser?.token) return;

    Promise.allSettled([
      fetch(apiUrl('/student/progress'), {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      }).then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load progress.');
        return payload.data;
      }),
      fetch(apiUrl('/student/topic-lessons/progress'), {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      }).then(async (response) => {
        const payload = await response.json();
        if (!response.ok) return null;
        return payload.data;
      })
    ])
      .then(([lessonResult, topicResult]) => {
        if (lessonResult.status === 'rejected') throw lessonResult.reason;
        setProgress(lessonResult.value);
        setTopicProgress(topicResult.status === 'fulfilled' ? topicResult.value : null);
        setMessage('');
      })
      .catch((error) => setMessage(error.message || 'Backend is offline.'));
  }, [currentUser]);

  const summary = progress?.summary || { totalLessons: 0, completedLessons: 0, progressPercent: 0 };
  const topicSummary = topicProgress?.summary || { total_topics: 0, completed_topics: 0, progress_percent: 0 };

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

            {topicProgress && (
              <section className="card stack">
                <div className="page-title" style={{ marginBottom: 0 }}>
                  <div>
                    <span className="eyebrow">Topic video progress</span>
                    <h2>{topicSummary.progress_percent}% completed</h2>
                    <p className="muted">
                      {topicSummary.completed_topics} of {topicSummary.total_topics} video topics completed.
                    </p>
                  </div>
                  <Link className="btn" href="/student/topic-lessons">Open topic videos</Link>
                </div>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${topicSummary.progress_percent}%` }} />
                </div>
                <div className="lesson-grid">
                  {(topicProgress.topics || []).map((topic) => (
                    <Link className="lesson-card" href={`/student/topic-lessons/${topic.topic_slug}`} key={topic.topic_slug}>
                      <span className="pill">{topic.status}</span>
                      <h3>{topic.title}</h3>
                      <p className="muted">
                        {topic.completed_items}/{topic.total_items} words learned
                        {topic.completed_at ? ` · Completed ${new Date(topic.completed_at).toLocaleDateString('vi-VN')}` : ''}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

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
