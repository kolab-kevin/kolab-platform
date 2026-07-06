import { Card, CardContent, CardHeader, CardTitle, cn } from '@kolab/ui';
import type { ReactNode } from 'react';

import { LoadingSkeleton } from '@/components/common/global-loading';
import { CreatorQuickActions } from '@/components/creators/creator-quick-actions';
import { CreatorStatusBadge } from '@/components/creators/creator-status-badge';
import {
  PORTAL_CARD_CLASS,
  PORTAL_CARD_HEADER_CLASS,
  PORTAL_CARD_TITLE_CLASS,
} from '@/lib/portal-ui';
import type { ManagerCreatorDetail } from '@/types/creator-management';

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className={PORTAL_CARD_CLASS}>
      <CardHeader className={PORTAL_CARD_HEADER_CLASS}>
        <CardTitle className={PORTAL_CARD_TITLE_CLASS}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">{children}</CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/5 py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

type CreatorDetailPanelProps = {
  detail: ManagerCreatorDetail | null;
  loading: boolean;
  error: string | null;
};

export function CreatorDetailPanel({ detail, loading, error }: CreatorDetailPanelProps) {
  if (loading) {
    return (
      <section className={cn('rounded-xl border p-4', PORTAL_CARD_CLASS)}>
        <LoadingSkeleton rows={6} label="Loading creator detail" />
      </section>
    );
  }

  if (error) {
    return (
      <section className={cn('rounded-xl border p-6 text-center', PORTAL_CARD_CLASS)}>
        <p className="text-destructive text-sm">{error}</p>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className={cn('rounded-xl border p-6 text-center', PORTAL_CARD_CLASS)}>
        <p className="text-muted-foreground text-sm">Select a creator to view portfolio details.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className={cn('rounded-xl border p-4', PORTAL_CARD_CLASS)}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{detail.profile.displayName}</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {detail.profile.bio ?? 'No bio provided.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CreatorStatusBadge label={detail.profile.status} />
              {detail.performanceSummary.scoreBand ? (
                <CreatorStatusBadge label={detail.performanceSummary.scoreBand} />
              ) : null}
              <CreatorStatusBadge label={detail.compliance.overallStatus} />
            </div>
          </div>
          <CreatorQuickActions />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DetailSection title="Profile">
          <DetailRow label="Organization" value={detail.profile.organizationName} />
          <DetailRow label="Commission plan" value={detail.profile.commissionPlan ?? '—'} />
          <DetailRow label="Manager" value={detail.profile.recruiterName ?? '—'} />
        </DetailSection>

        <DetailSection title="Contact">
          <DetailRow label="Email" value={detail.contact.email ?? '—'} />
          <DetailRow label="Phone" value={detail.contact.phone ?? '—'} />
          <DetailRow label="Country" value={detail.contact.country ?? '—'} />
          <DetailRow label="Languages" value={detail.contact.languages.join(', ') || '—'} />
        </DetailSection>

        <DetailSection title="Platform accounts">
          {detail.platformAccounts.length === 0 ? (
            <p className="text-muted-foreground">No platform accounts.</p>
          ) : (
            detail.platformAccounts.map((account) => (
              <DetailRow
                key={`${account.platform}-${account.username}`}
                label={account.platform}
                value={`@${account.username} · ${account.followers?.toLocaleString() ?? '—'} followers`}
              />
            ))
          )}
        </DetailSection>

        <DetailSection title="Skills and categories">
          <DetailRow label="Categories" value={detail.skills.categories.join(', ') || '—'} />
          <DetailRow label="Skills" value={detail.skills.skills.join(', ') || '—'} />
          <DetailRow label="Content types" value={detail.skills.contentTypes.join(', ') || '—'} />
          <DetailRow label="Experience" value={detail.skills.experienceLevel ?? '—'} />
        </DetailSection>

        <DetailSection title="Availability">
          <DetailRow label="Timezone" value={detail.availability.timezone ?? '—'} />
          <DetailRow
            label="Weekly schedule"
            value={detail.availability.weeklySchedule.join(' · ') || '—'}
          />
          <DetailRow
            label="Preferred live times"
            value={detail.availability.preferredLiveTimes.join(', ') || '—'}
          />
          <DetailRow label="Notes" value={detail.availability.notes ?? '—'} />
        </DetailSection>

        <DetailSection title="Compliance">
          <DetailRow label="Overall status" value={detail.compliance.overallStatus} />
          <DetailRow label="Missing documents" value={detail.compliance.missingDocuments} />
          <DetailRow label="Expiring documents" value={detail.compliance.expiringDocuments} />
          <DetailRow label="Expiring contracts" value={detail.compliance.expiringContracts} />
        </DetailSection>

        <DetailSection title="Onboarding progress">
          <DetailRow label="Overall status" value={detail.onboarding.overallStatus} />
          <DetailRow label="Completion" value={`${detail.onboarding.completionPercent}%`} />
          <DetailRow
            label="Incomplete items"
            value={detail.onboarding.incompleteItems.join(', ') || 'None'}
          />
        </DetailSection>

        <DetailSection title="Goals summary">
          <DetailRow label="Active goals" value={detail.goalsSummary.activeGoals} />
          <DetailRow label="Completed goals" value={detail.goalsSummary.completedGoals} />
          <DetailRow label="Highlights" value={detail.goalsSummary.highlights.join(' · ') || '—'} />
        </DetailSection>

        <DetailSection title="Performance summary">
          <DetailRow label="Overall score" value={detail.performanceSummary.overallScore ?? '—'} />
          <DetailRow label="Band" value={detail.performanceSummary.scoreBand ?? '—'} />
          <DetailRow
            label="Strengths"
            value={detail.performanceSummary.strengths.join(' · ') || '—'}
          />
          <DetailRow label="Risks" value={detail.performanceSummary.risks.join(' · ') || '—'} />
        </DetailSection>

        <DetailSection title="Intelligence summary">
          <DetailRow label="Overall score" value={detail.intelligenceSummary.overallScore ?? '—'} />
          <DetailRow label="Trend" value={detail.intelligenceSummary.trendDirection ?? '—'} />
          <DetailRow
            label="Highlights"
            value={detail.intelligenceSummary.highlights.join(' · ') || '—'}
          />
        </DetailSection>

        <DetailSection title="Recent campaigns">
          {detail.recentCampaigns.length === 0 ? (
            <p className="text-muted-foreground">No recent campaigns.</p>
          ) : (
            detail.recentCampaigns.map((campaign) => (
              <DetailRow
                key={campaign.id}
                label={campaign.title}
                value={`${campaign.status}${campaign.dueAt ? ` · due ${new Date(campaign.dueAt).toLocaleDateString()}` : ''}`}
              />
            ))
          )}
        </DetailSection>

        <DetailSection title="Live summary">
          <DetailRow label="Latest session" value={detail.liveSummary.latestSessionTitle ?? '—'} />
          <DetailRow label="Session status" value={detail.liveSummary.latestSessionStatus ?? '—'} />
          <DetailRow label="Scheduled sessions" value={detail.liveSummary.scheduledCount} />
          <DetailRow label="Open alerts" value={detail.liveSummary.openAlerts} />
        </DetailSection>
      </div>
    </section>
  );
}
