import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerIntegrations } from '@/types/administration-workspace';

type IntegrationsPanelProps = {
  integrations: ManagerIntegrations;
};

export function IntegrationsPanel({ integrations }: IntegrationsPanelProps) {
  return (
    <WorkspaceCard title="Integrations" description="Connected services, API keys, and webhooks">
      <div className="grid gap-4 xl:grid-cols-2">
        <div>
          <div className="mb-2 text-sm font-medium">Connected services</div>
          <div className="space-y-2">
            {integrations.connectedServices.length === 0 ? (
              <div className="text-muted-foreground rounded-lg border border-white/10 px-3 py-4 text-sm">
                No connected services in live mode yet.
              </div>
            ) : (
              integrations.connectedServices.map((service) => (
                <div
                  key={service.id}
                  className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
                >
                  <div className="font-medium">{service.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {service.status} · {service.connectedLabel}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium">API keys (masked)</div>
          <div className="space-y-2">
            {integrations.apiKeys.map((key) => (
              <div
                key={key.id}
                className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
              >
                <div className="font-medium">{key.name}</div>
                <div className="font-mono text-xs">{key.maskedKey}</div>
                <div className="text-muted-foreground text-xs">{key.createdLabel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div>
          <div className="mb-2 text-sm font-medium">Webhooks (read-only)</div>
          <div className="space-y-2">
            {integrations.webhooks.length === 0 ? (
              <div className="text-muted-foreground rounded-lg border border-white/10 px-3 py-4 text-sm">
                No webhooks configured.
              </div>
            ) : (
              integrations.webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
                >
                  <div className="font-mono text-xs">{webhook.url}</div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    {webhook.eventsLabel} · {webhook.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium">Future integrations</div>
          <div className="space-y-2">
            {integrations.futureIntegrations.map((integration) => (
              <div
                key={integration.name}
                className="rounded-lg border border-dashed border-white/10 px-3 py-2 text-sm"
              >
                <div className="font-medium">{integration.name}</div>
                <div className="text-muted-foreground text-xs">{integration.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WorkspaceCard>
  );
}
