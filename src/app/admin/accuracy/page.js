import { DashboardShell } from '../../components/Nav';

export default function AdminAccuracyPage() {
  return (
    <DashboardShell role="admin" title="Teacher accuracy">
      <div className="empty">Admin accuracy dashboard will aggregate all teacher accuracy logs and penalty severity.</div>
    </DashboardShell>
  );
}
