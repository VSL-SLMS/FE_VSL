import { DashboardShell } from '../../components/Nav';

export default function TeacherStudentsPage() {
  return (
    <DashboardShell role="teacher" title="Students">
      <div className="empty">Assigned students will be loaded from backend after teacher-student selection is enforced.</div>
    </DashboardShell>
  );
}
