import type { Campaign, LeadSummary, LiveSession, SessionCoachAlertsResponse } from '@kolab/types';
import {
  ListExpiringCreatorContractsResponseSchema,
  ListExpiringCreatorDocumentsResponseSchema,
} from '@kolab/types';

import type { ManagerAlertCenter } from '@/types/operations-center';
import {
  emptyAlertCenter,
  mapCampaignAlert,
  mapComplianceAlert,
  mapLiveCoachAlert,
  mapLiveSessionAlert,
  mapRecruitingAlert,
} from '@/types/operations-center-adapters';

function isOverdueFollowUp(nextFollowUpAt: string | null, now = new Date()): boolean {
  if (!nextFollowUpAt) return false;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return new Date(nextFollowUpAt).getTime() < startOfToday.getTime();
}

export function buildAlertCenter(input: {
  liveSessions: LiveSession[];
  coachAlerts: Array<{ session: LiveSession; alerts: SessionCoachAlertsResponse | null }>;
  campaigns: Campaign[];
  leads: LeadSummary[];
  expiringDocuments: ReturnType<typeof ListExpiringCreatorDocumentsResponseSchema.parse> | null;
  expiringContracts: ReturnType<typeof ListExpiringCreatorContractsResponseSchema.parse> | null;
  creatorNames: Map<string, string>;
}): ManagerAlertCenter {
  const center = emptyAlertCenter();

  for (const session of input.liveSessions.filter((item) => item.status === 'LIVE')) {
    center.live.push(
      mapLiveSessionAlert(
        session,
        input.creatorNames.get(session.creatorProfileId) ?? session.title,
      ),
    );
  }

  for (const bundle of input.coachAlerts) {
    const creatorName =
      input.creatorNames.get(bundle.session.creatorProfileId) ?? bundle.session.title;
    const generatedAt = bundle.alerts?.generatedAt ?? bundle.session.updatedAt;

    for (const alert of bundle.alerts?.alerts ?? []) {
      if (alert.priority === 'HIGH' || alert.priority === 'MEDIUM') {
        center.coach.push(mapLiveCoachAlert(bundle.session, alert, creatorName, generatedAt));
      }
    }
  }

  for (const campaign of input.campaigns) {
    if (campaign.status === 'PAUSED') {
      center.campaign.push(mapCampaignAlert(campaign, `Campaign paused: ${campaign.title}`));
    }
  }

  for (const lead of input.leads) {
    if (isOverdueFollowUp(lead.nextFollowUpAt)) {
      center.recruiting.push(mapRecruitingAlert(lead, `Overdue follow-up for ${lead.name}`));
    }
  }

  for (const document of input.expiringDocuments?.items ?? []) {
    center.compliance.push(
      mapComplianceAlert(
        document.document.id,
        `Document expiring: ${document.document.documentType}`,
        'HIGH',
      ),
    );
  }

  for (const contract of input.expiringContracts?.items ?? []) {
    center.compliance.push(
      mapComplianceAlert(
        contract.contract.id,
        `Contract expiring: ${contract.contract.contractType}`,
        'MEDIUM',
      ),
    );
  }

  return center;
}
