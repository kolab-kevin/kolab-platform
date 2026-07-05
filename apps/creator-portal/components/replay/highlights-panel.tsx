import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import {
  type GroupedHighlights,
  HIGHLIGHT_GROUP_LABELS,
  type HighlightGroup,
} from '@/types/replay-adapters';

type HighlightsPanelProps = {
  highlights: GroupedHighlights;
};

export function HighlightsPanel({ highlights }: HighlightsPanelProps) {
  const total = Object.values(highlights).reduce((count, items) => count + items.length, 0);

  return (
    <Card className="border-white/10 bg-white/[0.03] xl:min-h-[560px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Highlights</CardTitle>
        <p className="text-muted-foreground text-xs">{total} highlights</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {total === 0 ? (
          <p className="text-muted-foreground text-sm">No highlights available.</p>
        ) : (
          (Object.keys(HIGHLIGHT_GROUP_LABELS) as HighlightGroup[]).map((group) => (
            <div key={group}>
              <h3 className="mb-2 text-sm font-semibold">{HIGHLIGHT_GROUP_LABELS[group]}</h3>
              {highlights[group].length === 0 ? (
                <p className="text-muted-foreground text-xs">None</p>
              ) : (
                <ul className="space-y-2">
                  {highlights[group].map((item) => (
                    <li
                      key={`${item.type}-${item.label}-${item.offsetMs ?? 'na'}`}
                      className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
                    >
                      <p className="font-medium">{item.label}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {item.offsetMs !== null
                          ? `${Math.round(item.offsetMs / 60000)}m into session`
                          : new Date(item.occurredAt).toLocaleTimeString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
