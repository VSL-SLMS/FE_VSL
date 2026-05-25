import { DashboardShell } from '../../components/Nav';

export default function AdminAuditPage() {
  return (
    <DashboardShell role="admin" title="Audit logs">
      <div className="empty">Audit logs will include grading, score changes, reopen actions, appeals, and admin decisions.</div>
    </DashboardShell>
  );
}
