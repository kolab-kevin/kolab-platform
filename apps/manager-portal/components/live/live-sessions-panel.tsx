import { WorkspaceCard } from '@/components/common/workspace-layout';
import { LiveHealthBadge, LiveStatusBadge } from '@/components/live/live-status-badge';
import type { ManagerLiveSessionItem } from '@/types/live-operations';

type LiveSessionsPanelProps = {
  sessions: ManagerLiveSessionItem[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
};

export function LiveSessionsPanel({
  sessions,
  selectedSessionId,
  onSelectSession,
}: LiveSessionsPanelProps) {
  return (
    <WorkspaceCard
      title="Live sessions"
      description="Active and recent sessions across the portfolio"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-muted-foreground border-b border-white/10 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-2 py-2 font-medium">Creator</th>
              <th className="px-2 py-2 font-medium">Session</th>
              <th className="px-2 py-2 font-medium">Status</th>
              <th className="px-2 py-2 font-medium">Viewers</th>
              <th className="px-2 py-2 font-medium">Gift revenue</th>
              <th className="px-2 py-2 font-medium">Duration</th>
              <th className="px-2 py-2 font-medium">Health</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => {
              const selected = session.id === selectedSessionId;

              return (
                <tr
                  key={session.id}
                  className={
                    selected
                      ? 'cursor-pointer border-b border-white/10 bg-white/[0.04]'
                      : 'cursor-pointer border-b border-white/10 hover:bg-white/[0.02]'
                  }
                  onClick={() => onSelectSession(session.id)}
                >
                  <td className="px-2 py-3 font-medium">{session.creatorDisplayName}</td>
                  <td className="px-2 py-3">
                    <div>{session.title}</div>
                    <div className="text-muted-foreground text-xs">{session.platform}</div>
                  </td>
                  <td className="px-2 py-3">
                    <LiveStatusBadge status={session.status} />
                  </td>
                  <td className="px-2 py-3">{session.viewerCount ?? '—'}</td>
                  <td className="px-2 py-3">
                    {session.giftRevenue ? `$${session.giftRevenue}` : '—'}
                  </td>
                  <td className="px-2 py-3">{session.durationLabel}</td>
                  <td className="px-2 py-3">
                    <LiveHealthBadge health={session.health} score={session.healthScore} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </WorkspaceCard>
  );
}
