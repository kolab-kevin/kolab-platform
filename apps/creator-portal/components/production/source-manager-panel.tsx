'use client';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';
import * as React from 'react';

import { formatProductionLabel, type ProductionSourceItem } from '@/types/production-adapters';

type SourceManagerPanelProps = {
  sources: ProductionSourceItem[];
};

export function SourceManagerPanel({ sources: initialSources }: SourceManagerPanelProps) {
  const [sources, setSources] = React.useState(initialSources);

  React.useEffect(() => {
    setSources(initialSources);
  }, [initialSources]);

  return (
    <Card className="border-white/10 bg-white/[0.03] xl:h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Source Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {sources.map((source) => (
            <li
              key={source.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{source.label}</p>
                <p className="text-muted-foreground text-xs">
                  {formatProductionLabel(source.type)}
                </p>
              </div>
              <Button
                size="sm"
                variant={source.visible ? 'default' : 'outline'}
                onClick={() =>
                  setSources((current) =>
                    current.map((item) =>
                      item.id === source.id ? { ...item, visible: !item.visible } : item,
                    ),
                  )
                }
              >
                {source.visible ? 'Visible' : 'Hidden'}
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
