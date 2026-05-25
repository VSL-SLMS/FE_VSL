import { DashboardShell } from '../../components/Nav';

export default function TeacherGradingPage() {
  return (
    <DashboardShell role="teacher" title="Grading">
      <div className="empty">Submitted assignments will be graded once, then locked unless admin reopens.</div>
    </DashboardShell>
  );
}
