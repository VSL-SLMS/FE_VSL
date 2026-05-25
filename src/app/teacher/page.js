import { DashboardShell } from '../components/Nav';

export default function TeacherPage() {
  return (
    <DashboardShell role="teacher" title="Teacher dashboard">
      <div className="role-grid">
        <div className="card"><span className="eyebrow">Students</span><h2>0 assigned</h2><p className="muted">Students appear after selection or admin assignment.</p></div>
        <div className="card"><span className="eyebrow">Grading</span><h2>0 pending</h2><p className="muted">Submitted assignments will appear here.</p></div>
        <div className="card"><span className="eyebrow">Accuracy</span><h2>100%</h2><p className="muted">Only admin-supported student appeals reduce accuracy.</p></div>
      </div>
    </DashboardShell>
  );
}
