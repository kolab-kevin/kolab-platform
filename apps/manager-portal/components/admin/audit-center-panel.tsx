import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerAuditCenter } from '@/types/administration-workspace';

type AuditCenterPanelProps = {
  auditCenter: ManagerAuditCenter;
};

function AuditList({ title, entries }: { title: string; entries: ManagerAuditCenter['auditLog'] }) {
  if (entries.length === 0) {
    return (
      <div>
        <div className="mb-2 text-sm font-medium">{title}</div>
        <div className="text-muted-foreground rounded-lg border border-white/10 px-3 py-4 text-sm">
          No entries available.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 text-sm font-medium">{title}</div>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{entry.action}</span>
              <span className="text-muted-foreground text-xs">{entry.timestampLabel}</span>
            </div>
            <div className="text-muted-foreground mt-1 text-xs">
              {entry.actorLabel} · {entry.targetLabel} · {entry.category}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuditCenterPanel({ auditCenter }: AuditCenterPanelProps) {
  return (
    <WorkspaceCard title="Audit center" description="Administrative actions and security events">
      <div className="grid gap-4 xl:grid-cols-3">
        <AuditList title="Audit log" entries={auditCenter.auditLog} />
        <AuditList title="Recent admin actions" entries={auditCenter.recentAdminActions} />
        <AuditList title="Security events" entries={auditCenter.securityEvents} />
      </div>
    </WorkspaceCard>
  );
}
