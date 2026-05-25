import { DashboardShell } from '../../components/Nav';

export default function TeacherAssignmentsPage() {
  return (
    <DashboardShell role="teacher" title="Assignments">
      <div className="empty">Teacher assignment creation/editing will connect to the `assignments` and `assignment_students` tables.</div>
    </DashboardShell>
  );
}
