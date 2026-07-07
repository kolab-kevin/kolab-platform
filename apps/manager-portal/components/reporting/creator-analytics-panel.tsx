import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerCreatorAnalytics } from '@/types/reporting-workspace';

type CreatorAnalyticsPanelProps = {
  analytics: ManagerCreatorAnalytics;
};

export function CreatorAnalyticsPanel({ analytics }: CreatorAnalyticsPanelProps) {
  return (
    <WorkspaceCard
      title="Creator analytics"
      description="Portfolio growth and performance distribution"
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3">
            <div className="text-muted-foreground text-xs uppercase tracking-wide">Growth</div>
            <div className="mt-1 text-lg font-semibold">{analytics.growthLabel}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3">
            <div className="text-muted-foreground text-xs uppercase tracking-wide">Retention</div>
            <div className="mt-1 text-lg font-semibold">{analytics.retentionLabel}</div>
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold">Performance distribution</h4>
          <div className="grid gap-2 sm:grid-cols-3">
            {analytics.performanceDistribution.map((item) => (
              <div
                key={item.label}
                className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
              >
                <div>{item.label}</div>
                <div className="text-lg font-semibold">{item.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ListSection title="Top performers" items={analytics.topPerformers} />
          <ListSection title="At-risk creators" items={analytics.atRiskCreators} />
        </div>
      </div>
    </WorkspaceCard>
  );
}

function ListSection({
  title,
  items,
}: {
  title: string;
  items: Array<{ name: string; value: string; detail: string | null }>;
}) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold">{title}</h4>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No items.</p>
      ) : (
        items.map((item) => (
          <div
            key={`${title}-${item.name}`}
            className="border-b border-white/5 py-2 text-sm last:border-0"
          >
            <div className="font-medium">{item.name}</div>
            <div className="text-muted-foreground text-xs">
              {item.value}
              {item.detail ? ` · ${item.detail}` : ''}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
