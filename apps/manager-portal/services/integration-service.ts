import type { ManagerIntegrations } from '@/types/administration-workspace';

export function buildIntegrationsPresentation(): ManagerIntegrations {
  return {
    connectedServices: [],
    apiKeys: [],
    webhooks: [],
    futureIntegrations: [
      {
        name: 'TikTok Shop',
        description: 'Commerce catalog sync and order webhooks',
      },
      {
        name: 'Slack',
        description: 'Operational alerts and manager notifications',
      },
      {
        name: 'Stripe',
        description: 'Payout reconciliation and billing exports',
      },
    ],
  };
}

export function buildMockIntegrations(): ManagerIntegrations {
  return {
    connectedServices: [
      {
        id: 'svc_email',
        name: 'Email delivery',
        status: 'Connected',
        connectedLabel: 'Connected 90 days ago',
      },
      {
        id: 'svc_storage',
        name: 'Document storage',
        status: 'Connected',
        connectedLabel: 'Connected 120 days ago',
      },
    ],
    apiKeys: [
      {
        id: 'key_live_001',
        name: 'Reporting export key',
        maskedKey: 'kolab_live_••••••••4f2a',
        createdLabel: 'Created Jan 2026',
      },
      {
        id: 'key_live_002',
        name: 'Webhook signing key',
        maskedKey: 'kolab_wh_••••••••9b11',
        createdLabel: 'Created Feb 2026',
      },
    ],
    webhooks: [
      {
        id: 'wh_001',
        url: 'https://hooks.example.com/kolab/admin',
        eventsLabel: 'member.invited, audit.created',
        status: 'Active (read-only)',
      },
    ],
    futureIntegrations: buildIntegrationsPresentation().futureIntegrations,
  };
}
