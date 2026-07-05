import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

type PerformanceNarrativeListProps = {
  title: string;
  items: string[];
  emptyMessage: string;
  tone?: 'default' | 'warning';
};

export function PerformanceNarrativeList({
  title,
  items,
  emptyMessage,
  tone = 'default',
}: PerformanceNarrativeListProps) {
  return (
    <Card
      className={
        tone === 'warning'
          ? 'border-amber-500/20 bg-amber-500/5'
          : 'border-white/10 bg-white/[0.03]'
      }
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {items.map((item) => (
              <li key={item} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
