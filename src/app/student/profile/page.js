import { DashboardShell } from '../../components/Nav';
import ProfileForm from '../../components/ProfileForm';

export default function StudentProfilePage() {
  return (
    <DashboardShell role="student" title="Profile">
      <ProfileForm role="STUDENT" />
    </DashboardShell>
  );
}
