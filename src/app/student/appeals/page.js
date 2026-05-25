import { DashboardShell } from '../../components/Nav';

export default function StudentAppealsPage() {
  return (
    <DashboardShell role="student" title="Appeal history">
      <div className="empty">Appeals will show only student-facing statuses: Rechecking and Final Result.</div>
    </DashboardShell>
  );
}
