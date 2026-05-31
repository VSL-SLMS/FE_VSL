'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '../../lib/api';
import { readStoredUser } from '../../lib/authStorage';

export default function CompleteLessonButton({ lessonId, initialCompleted, nextHref }) {
  const router = useRouter();
  const [completed, setCompleted] = useState(Boolean(initialCompleted));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function markComplete() {
    const user = readStoredUser('STUDENT');
    if (!user?.token || loading) return;

    if (completed) {
      if (nextHref) router.push(nextHref);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(apiUrl(`/student/lessons/${lessonId}/complete`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Could not complete lesson.');

      setCompleted(true);
      if (nextHref) {
        router.push(nextHref);
        return;
      }
      setMessage(`Completed. Course progress: ${payload.data?.progress?.progressPercent || 0}%`);
    } catch (error) {
      setMessage(error.message || 'Backend is offline.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 10 }}>
      <button className="btn btn-primary" type="button" onClick={markComplete} disabled={loading}>
        {loading
          ? 'Saving...'
          : completed && nextHref
            ? 'Next lesson'
            : nextHref
              ? 'Complete and go to next'
              : completed
                ? 'Lesson completed'
                : 'Mark lesson complete'}
      </button>
      {message && <p className="muted" style={{ margin: 0 }}>{message}</p>}
    </div>
  );
}
