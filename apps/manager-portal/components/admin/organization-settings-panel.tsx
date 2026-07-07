import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerOrganizationSettings } from '@/types/administration-workspace';

type OrganizationSettingsPanelProps = {
  settings: ManagerOrganizationSettings;
};

function SettingGroup({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: string }[];
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium">{title}</div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
          >
            <span className="text-muted-foreground">{item.label}</span>
            <span className="text-right">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrganizationSettingsPanel({ settings }: OrganizationSettingsPanelProps) {
  return (
    <WorkspaceCard
      title="Organization settings"
      description="General, branding, and regional configuration"
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <SettingGroup title="General" items={settings.general} />
        <SettingGroup title="Notifications" items={settings.notifications} />
        <SettingGroup title="Branding" items={settings.branding} />
        <SettingGroup title="Regional" items={settings.regional} />
      </div>

      <div className="mt-4">
        <div className="mb-2 text-sm font-medium">Feature flags (read-only)</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {settings.featureFlags.map((flag) => (
            <div
              key={flag.key}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
            >
              <span>{flag.label}</span>
              <span className={flag.enabled ? 'text-emerald-300' : 'text-muted-foreground'}>
                {flag.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </WorkspaceCard>
  );
}
