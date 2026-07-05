import type { SessionIntelligenceSnapshot } from '@kolab/types';
import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

type SessionSignalsPanelProps = {
  intelligence: SessionIntelligenceSnapshot | null;
};

function SignalList({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: string[];
  emptyMessage: string;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SessionSignalsPanel({ intelligence }: SessionSignalsPanelProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Session Signals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!intelligence ? (
          <p className="text-muted-foreground text-sm">No session signals available.</p>
        ) : (
          <>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Top signals</h3>
              {intelligence.topSignals.length === 0 ? (
                <p className="text-muted-foreground text-sm">No top signals recorded.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {intelligence.topSignals.map((signal) => (
                    <li
                      key={`${signal.signalType}-${signal.label}`}
                      className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2"
                    >
                      <p className="font-medium">{signal.label}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {signal.signalType}
                        {signal.value !== null ? ` · ${signal.value}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <SignalList
              title="Strengths"
              items={intelligence.keyStrengths}
              emptyMessage="None recorded."
            />
            <SignalList title="Risks" items={intelligence.keyRisks} emptyMessage="None recorded." />
            <SignalList
              title="Recommended actions"
              items={intelligence.recommendedNextActions}
              emptyMessage="None recorded."
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
