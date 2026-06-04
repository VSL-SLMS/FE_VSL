import { DashboardShell } from '../../components/Nav';
import ProfileForm from '../../components/ProfileForm';

export default function TeacherProfilePage() {
  return (
    <DashboardShell role="teacher" title="Profile">
      <ProfileForm role="TEACHER" />
    </DashboardShell>
  );
}
