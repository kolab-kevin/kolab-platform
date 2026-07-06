import { WorkspaceCard } from '@/components/common/workspace-layout';
import { PriorityBadge } from '@/components/operations-center/priority-badge';
import type { ManagerAiRecommendations } from '@/types/operations-center';

type AiRecommendationsPanelProps = {
  aiRecommendations: ManagerAiRecommendations;
};

const SECTIONS: Array<{ key: keyof ManagerAiRecommendations; label: string }> = [
  { key: 'high', label: 'High priority' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
];

export function AiRecommendationsPanel({ aiRecommendations }: AiRecommendationsPanelProps) {
  return (
    <WorkspaceCard title="AI recommendations" description="Read-only recommendation queue">
      <div className="grid gap-4 md:grid-cols-3">
        {SECTIONS.map((section) => (
          <div key={section.key} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{section.label}</h3>
              <span className="text-muted-foreground text-xs">
                {aiRecommendations[section.key].length}
              </span>
            </div>
            <div className="space-y-2">
              {aiRecommendations[section.key].length === 0 ? (
                <p className="text-muted-foreground text-xs">No recommendations</p>
              ) : (
                aiRecommendations[section.key].map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-white/10 bg-white/[0.02] p-2 text-sm"
                  >
                    <div className="font-medium">{item.title}</div>
                    <p className="text-muted-foreground mt-1 text-xs">{item.summary}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <PriorityBadge priority={item.priority} />
                      <span className="text-muted-foreground text-xs">{item.sourceLabel}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </WorkspaceCard>
  );
}
