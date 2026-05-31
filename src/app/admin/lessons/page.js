'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '../../components/Nav';
import { apiUrl } from '../../../lib/api';
import { readStoredUser } from '../../../lib/authStorage';

function flattenLessons(parts) {
  return parts.flatMap((part) =>
    (part.chapters || []).flatMap((chapter) =>
      (chapter.lessons || []).map((lesson) => ({
        ...lesson,
        partTitle: part.title,
        chapterTitle: chapter.title
      }))
    )
  );
}

export default function AdminLessonsPage() {
  const [currentUser] = useState(() => readStoredUser('ADMIN'));
  const [parts, setParts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(() =>
    currentUser?.token ? 'Loading lessons...' : 'Admin login is required.'
  );

  useEffect(() => {
    if (!currentUser?.token) return;

    fetch(apiUrl('/lessons'))
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load lessons.');
        setParts(payload.data.parts || []);
        setMessage('');
      })
      .catch((error) => setMessage(error.message || 'Backend is offline.'));
  }, [currentUser]);

  const lessons = useMemo(() => flattenLessons(parts), [parts]);

  async function updateLesson(event, lessonId) {
    event.preventDefault();
    if (!currentUser?.token) return;

    const form = new FormData(event.currentTarget);
    setMessage('Saving lesson...');

    const response = await fetch(apiUrl(`/admin/lessons/${lessonId}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentUser.token}`
      },
      body: JSON.stringify({
        title: form.get('title'),
        description: form.get('description'),
        lessonType: form.get('lessonType'),
        estimatedMinutes: Number(form.get('estimatedMinutes') || 15),
        orderIndex: Number(form.get('orderIndex') || 0)
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.message || 'Could not update lesson.');
      return;
    }

    const updatedLesson = payload.data.lesson;
    setParts((currentParts) =>
      currentParts.map((part) => ({
        ...part,
        chapters: (part.chapters || []).map((chapter) => ({
          ...chapter,
          lessons: (chapter.lessons || []).map((lesson) =>
            lesson.id === updatedLesson.id
              ? { ...lesson, ...updatedLesson }
              : lesson
          )
        }))
      }))
    );
    setEditingId(null);
    setMessage('Lesson updated.');
  }

  return (
    <DashboardShell role="admin" title="Lessons">
      <div className="stack">
        {message && <div className="empty">{message}</div>}

        {lessons.map((lesson) => (
          <section className="card stack" key={lesson.id}>
            <div className="page-title">
              <div>
                <span className="eyebrow">{lesson.partTitle} · {lesson.chapterTitle}</span>
                <h2>{lesson.title}</h2>
                <p className="muted">
                  {lesson.lesson_type} · {lesson.estimated_minutes || 15} minutes · Order {lesson.order_index}
                </p>
              </div>
              <button className="btn" type="button" onClick={() => setEditingId(editingId === lesson.id ? null : lesson.id)}>
                {editingId === lesson.id ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editingId === lesson.id && (
              <form className="form-grid" onSubmit={(event) => updateLesson(event, lesson.id)}>
                <div className="field">
                  <label>Title</label>
                  <input name="title" defaultValue={lesson.title || ''} required />
                </div>
                <div className="field">
                  <label>Description</label>
                  <textarea name="description" defaultValue={lesson.description || ''} />
                </div>
                <div className="field">
                  <label>Lesson type</label>
                  <select name="lessonType" defaultValue={lesson.lesson_type || 'theory'}>
                    <option value="theory">theory</option>
                    <option value="practice">practice</option>
                    <option value="quiz">quiz</option>
                    <option value="exercise">exercise</option>
                  </select>
                </div>
                <div className="field">
                  <label>Estimated minutes</label>
                  <input name="estimatedMinutes" type="number" min="1" defaultValue={lesson.estimated_minutes || 15} />
                </div>
                <div className="field">
                  <label>Order</label>
                  <input name="orderIndex" type="number" min="0" defaultValue={lesson.order_index || 0} />
                </div>
                <button className="btn btn-primary" type="submit">Save lesson</button>
              </form>
            )}
          </section>
        ))}

        {!message && !lessons.length && <div className="empty">No lessons found.</div>}
      </div>
    </DashboardShell>
  );
}
