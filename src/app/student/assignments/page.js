import { DashboardShell } from '../../components/Nav';

export default function StudentAssignmentsPage() {
  return (
    <DashboardShell role="student" title="Assignments">
      <div className="empty">Assignments, submissions, scores, and feedback will connect to the backend in the next workflow phase.</div>
    </DashboardShell>
  );
}
