import { DashboardShell } from '../../components/Nav';

export default function TeacherAccuracyPage() {
  return (
    <DashboardShell role="teacher" title="Accuracy">
      <div className="card">
        <span className="eyebrow">Teacher accuracy</span>
        <h2>100%</h2>
        <p className="muted">Teachers can only view their own accuracy. Admin can monitor all teachers.</p>
      </div>
    </DashboardShell>
  );
}
