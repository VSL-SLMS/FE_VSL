import { DashboardShell } from '../../components/Nav';

export default function StudentProgressPage() {
  return (
    <DashboardShell role="student" title="Progress">
      <div className="card">
        <span className="eyebrow">Progress tracking</span>
        <h2>Lesson completion is the next backend task</h2>
        <div className="progress-track"><div className="progress-bar" style={{ width: '0%' }} /></div>
        <p className="muted">Student-facing progress will use the `lesson_progress` table.</p>
      </div>
    </DashboardShell>
  );
}
