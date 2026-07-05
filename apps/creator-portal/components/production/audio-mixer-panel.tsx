import { Button, Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import { formatAudioLevel, type ProductionAudioChannel } from '@/types/production-adapters';

type AudioMixerPanelProps = {
  channels: ProductionAudioChannel[];
};

export function AudioMixerPanel({ channels }: AudioMixerPanelProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Audio Mixer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{channel.label}</p>
              <Button size="sm" variant="outline" disabled>
                {channel.muted ? 'Unmute' : 'Mute'}
              </Button>
            </div>
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400/80 transition-all"
                style={{ width: `${Math.round(channel.level * 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={channel.volume}
                readOnly
                aria-label={`${channel.label} volume`}
                className="pointer-events-none w-full opacity-80"
              />
              <span className="text-muted-foreground shrink-0 text-xs">
                {channel.volume}% · {formatAudioLevel(channel.level)}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
