'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashboardShell } from '../../components/Nav';
import { apiUrl } from '../../../lib/api';
import { useStoredUser } from '../../../lib/authStorage';

export default function StudentTopicLessonsPage() {
  const { ready: authReady, user: currentUser } = useStoredUser('STUDENT');
  const [topics, setTopics] = useState([]);
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState('Loading topic lessons...');
  const [actionLink, setActionLink] = useState(null);

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser?.token) {
      setActionLink({ href: '/login', label: 'Log in' });
      setMessage('Student login is required.');
      return;
    }

    fetch(apiUrl('/student/topic-lessons'), {
      headers: { Authorization: `Bearer ${currentUser.token}` }
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          const error = new Error(payload.message || 'Could not load topic lessons.');
          error.code = payload.code;
          throw error;
        }
        return payload.data;
      })
      .then((data) => {
        setTopics(data.topics || []);
        setSummary(data.summary || null);
        setActionLink(null);
        setMessage('');
      })
      .catch((error) => {
        setTopics([]);
        if (error.code === 'TEACHER_REQUIRED') {
          setActionLink({ href: '/student/select-teacher', label: 'Select teacher' });
        } else if (error.code === 'COURSE_PURCHASE_REQUIRED') {
          setActionLink({ href: '/payment', label: 'Purchase course' });
        } else if (!currentUser?.token) {
          setActionLink({ href: '/login', label: 'Log in' });
        }
        setMessage(error.message || 'Backend is offline.');
      });
  }, [authReady, currentUser]);

  return (
    <DashboardShell role="student" title="Topic video lessons">
      <div className="stack">
        {message && (
          <div className="empty">
            {message}
            {actionLink && (
              <div style={{ marginTop: 14 }}>
                <Link className="btn btn-primary" href={actionLink.href}>{actionLink.label}</Link>
              </div>
            )}
          </div>
        )}

        {summary && (
          <section className="card stack" style={{ boxShadow: 'none' }}>
            <div className="page-title" style={{ marginBottom: 0 }}>
              <div>
                <span className="eyebrow">Cloudinary VSL practice</span>
                <h2>{summary.progress_percent}% topic progress</h2>
                <p className="muted">
                  {summary.completed_topics} of {summary.total_topics} video topics completed.
                </p>
              </div>
            </div>
            <div className="progress-track">
              <div className="progress-bar" style={{ width: `${summary.progress_percent}%` }} />
            </div>
          </section>
        )}

        <section className="lesson-grid">
          {topics.map((topic) => (
            <Link className="lesson-card topic-card" href={`/student/topic-lessons/${topic.topic_slug}`} key={topic.topic_slug}>
              <span className="pill">{topic.status}</span>
              <h3>{topic.title}</h3>
              <p className="muted">{topic.description}</p>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${topic.progress_percent}%` }} />
              </div>
              <p className="muted">
                {topic.completed_items}/{topic.total_items} words learned · {topic.estimated_minutes} min
              </p>
            </Link>
          ))}
        </section>

        {!message && !topics.length && <div className="empty">No topic lessons available.</div>}
      </div>
    </DashboardShell>
  );
}
