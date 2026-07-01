import { DashboardShell } from '../../components/Nav';

export default function TeacherAccuracyPage() {
  return (
    <DashboardShell role="teacher" title="Accuracy">
      <div className="card">
        <span className="eyebrow">Teacher accuracy</span>
        <h2>Not available</h2>
        <p className="muted">Accuracy reporting needs real verification data before it can be shown.</p>
      </div>
    </DashboardShell>
  );
}
