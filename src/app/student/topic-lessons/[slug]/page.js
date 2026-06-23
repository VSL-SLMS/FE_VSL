'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardShell } from '../../../components/Nav';
import { apiUrl } from '../../../../lib/api';
import { readStoredUser } from '../../../../lib/authStorage';

function formatDuration(seconds) {
  const value = Number(seconds || 0);
  if (!value) return 'Short video';
  return `${Math.ceil(value)} sec`;
}

export default function StudentTopicLessonDetailPage() {
  const params = useParams();
  const slug = params?.slug;
  const [currentUser] = useState(() => readStoredUser('STUDENT'));
  const [topic, setTopic] = useState(null);
  const [items, setItems] = useState([]);
  const [activeItemId, setActiveItemId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [message, setMessage] = useState(() =>
    currentUser?.token ? 'Loading topic lesson...' : 'Student login is required.'
  );

  const activeItem = useMemo(() => {
    return items.find((item) => Number(item.id) === Number(activeItemId)) || items[0] || null;
  }, [items, activeItemId]);

  function applyTopicData(data) {
    const nextItems = data.items || [];
    setTopic(data.topic || null);
    setItems(nextItems);
    setActiveItemId((current) => {
      if (current && nextItems.some((item) => Number(item.id) === Number(current))) return current;
      return nextItems.find((item) => item.progress_status !== 'COMPLETED')?.id || nextItems[0]?.id || null;
    });
  }

  function loadTopic() {
    if (!currentUser?.token || !slug) return Promise.resolve();

    return fetch(apiUrl(`/student/topic-lessons/${slug}`), {
      headers: { Authorization: `Bearer ${currentUser.token}` }
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load topic lesson.');
        return payload.data;
      })
      .then((data) => {
        applyTopicData(data);
        setMessage('');
      });
  }

  useEffect(() => {
    loadTopic().catch((error) => setMessage(error.message || 'Backend is offline.'));
  }, [currentUser, slug]);

  async function completeItem(itemId) {
    if (!currentUser?.token || !slug || loadingId) return;
    setLoadingId(itemId);
    setMessage('Saving progress...');

    try {
      const response = await fetch(apiUrl(`/student/topic-lessons/${slug}/items/${itemId}/complete`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Could not update progress.');

      setItems((current) => current.map((item) => (
        Number(item.id) === Number(itemId)
          ? { ...item, progress_status: 'COMPLETED', completed_at: new Date().toISOString() }
          : item
      )));
      setTopic((current) => current ? { ...current, ...payload.data.progress } : current);
      setMessage('Progress saved.');
    } catch (error) {
      setMessage(error.message || 'Backend is offline.');
    } finally {
      setLoadingId(null);
    }
  }

  async function completeTopic() {
    if (!currentUser?.token || !slug || loadingId) return;
    setLoadingId('topic');
    setMessage('Completing topic...');

    try {
      const response = await fetch(apiUrl(`/student/topic-lessons/${slug}/complete`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Could not complete topic.');

      setItems((current) => current.map((item) => ({
        ...item,
        progress_status: 'COMPLETED',
        completed_at: item.completed_at || new Date().toISOString()
      })));
      setTopic((current) => current ? { ...current, ...payload.data.topic } : current);
      setMessage('Topic completed.');
    } catch (error) {
      setMessage(error.message || 'Backend is offline.');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <DashboardShell role="student" title={topic?.title || 'Topic lesson'}>
      <div className="stack">
        {message && <div className="empty">{message}</div>}

        {topic && (
          <section className="card stack" style={{ boxShadow: 'none' }}>
            <div className="page-title" style={{ marginBottom: 0 }}>
              <div>
                <span className="eyebrow">Video topic</span>
                <h2>{topic.title}</h2>
                <p className="muted">{topic.description}</p>
              </div>
              <Link className="btn" href="/student/topic-lessons">All topics</Link>
            </div>
            <div className="progress-track">
              <div className="progress-bar" style={{ width: `${topic.progress_percent || 0}%` }} />
            </div>
            <p className="muted">
              {topic.completed_items || 0}/{topic.total_items || 0} words learned · {topic.status}
            </p>
          </section>
        )}

        {activeItem && (
          <section className="topic-study-layout">
            <div className="card topic-video-panel">
              <video
                key={activeItem.id}
                className="topic-video"
                controls
                playsInline
                preload="metadata"
                src={activeItem.cloudinary_secure_url}
              />
              <div className="stack">
                <span className="pill">{activeItem.progress_status}</span>
                <h2>{activeItem.word}</h2>
                <p className="muted">{activeItem.description}</p>
                <p className="muted">
                  {formatDuration(activeItem.duration_seconds)} · {activeItem.width}x{activeItem.height} · Cloudinary ID: {activeItem.cloudinary_public_id}
                </p>
                <div className="actions">
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={activeItem.progress_status === 'COMPLETED' || loadingId === activeItem.id}
                    onClick={() => completeItem(activeItem.id)}
                  >
                    {activeItem.progress_status === 'COMPLETED' ? 'Learned' : 'Mark this word learned'}
                  </button>
                  <button className="btn" type="button" disabled={loadingId === 'topic'} onClick={completeTopic}>
                    Complete whole topic
                  </button>
                </div>
              </div>
            </div>

            <aside className="card topic-word-list">
              <span className="eyebrow">Words in this topic</span>
              {items.map((item) => (
                <button
                  className={`topic-word-button ${Number(item.id) === Number(activeItem.id) ? 'is-active' : ''}`}
                  key={item.id}
                  type="button"
                  onClick={() => setActiveItemId(item.id)}
                >
                  <span>
                    <strong>{item.word}</strong>
                    <small>{formatDuration(item.duration_seconds)}</small>
                  </span>
                  <span className="pill">{item.progress_status === 'COMPLETED' ? 'Done' : 'Open'}</span>
                </button>
              ))}
            </aside>
          </section>
        )}

        {!message && !activeItem && <div className="empty">No videos found for this topic.</div>}
      </div>
    </DashboardShell>
  );
}
