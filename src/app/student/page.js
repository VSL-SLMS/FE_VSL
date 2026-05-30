import Link from 'next/link';
import { DashboardShell } from '../components/Nav';
import { fetchApi } from '../../lib/api';

async function getLessons() {
  const response = await fetchApi('/lessons');
  return response.data.parts || [];
}

export default async function StudentPage() {
  const parts = await getLessons();
  const lessons = parts.flatMap((part) => part.chapters || []).flatMap((chapter) => chapter.lessons || []);
  const shownLessons = lessons.slice(17, 23);

  return (
    <DashboardShell role="student" title="Welcome back 👋">
      <div className="stack">
        <section className="role-grid">
          <div className="card">
            <span className="eyebrow">Sign Language 101</span>
            <h2>Course progress</h2>
            <div className="progress-track"><div className="progress-bar" style={{ width: '18%' }} /></div>
            <p className="muted">0 completed lessons · {lessons.length || 28} lessons available</p>
          </div>
          <div className="card">
            <span className="eyebrow">Your teacher</span>
            <h2>Choose a teacher</h2>
            <p className="muted">First login requires exactly one teacher selection.</p>
            <Link className="btn btn-primary" href="/student/select-teacher">Select teacher</Link>
          </div>
          <div className="card">
            <span className="eyebrow">Assignments</span>
            <h2>No pending work</h2>
            <p className="muted">Assignment submission and grading workflow is prepared for the next phase.</p>
          </div>
        </section>

        <section>
          <div className="page-title">
            <div>
              <span className="eyebrow">Continue learning</span>
              <h2>Practice lessons</h2>
            </div>
            <Link className="btn" href="/student/lessons">View all</Link>
          </div>
          <div className="lesson-grid">
            {shownLessons.map((lesson) => (
              <Link className="lesson-card" href={`/lessons/${lesson.slug}`} key={lesson.id}>
                <span className="pill">{lesson.lesson_type}</span>
                <h3>{lesson.title}</h3>
                <p className="muted">{lesson.estimated_minutes || 15} min · 0% complete</p>
                <div className="progress-track"><div className="progress-bar" style={{ width: '0%' }} /></div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
