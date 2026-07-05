import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import { CampaignStatusBadge } from '@/components/common/campaign-status-badge';
import { type ComplianceDisplayModel, formatProfileLabel } from '@/types/profile-adapters';

type CompliancePanelProps = {
  compliance: ComplianceDisplayModel | null;
};

export function CompliancePanel({ compliance }: CompliancePanelProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Compliance</CardTitle>
        <p className="text-muted-foreground text-xs">Read-only compliance overview</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!compliance ? (
          <p className="text-muted-foreground text-sm">No compliance data available.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <CampaignStatusBadge status={compliance.overallStatus} />
              <span className="text-muted-foreground text-xs">
                Onboarding {compliance.onboardingCompletionPercent}% complete
              </span>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Onboarding completion</h3>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${compliance.onboardingCompletionPercent}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-2 text-xs">
                Status: {formatProfileLabel(compliance.onboardingStatus)}
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Verification status</h3>
              <p className="text-sm">{formatProfileLabel(compliance.verificationStatus)}</p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Missing requirements</h3>
              {compliance.missingRequirements.length === 0 ? (
                <p className="text-muted-foreground text-sm">None outstanding.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {compliance.missingRequirements.map((item) => (
                    <li key={item}>{formatProfileLabel(item)}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3 text-sm">
                <h3 className="mb-2 font-semibold">Document status</h3>
                <dl className="space-y-1 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Missing</dt>
                    <dd>{compliance.documentSummary.missing}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Expiring</dt>
                    <dd>{compliance.documentSummary.expiring}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Expired</dt>
                    <dd>{compliance.documentSummary.expired}</dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3 text-sm">
                <h3 className="mb-2 font-semibold">Contract status</h3>
                <dl className="space-y-1 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Expiring</dt>
                    <dd>{compliance.contractSummary.expiring}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Expired</dt>
                    <dd>{compliance.contractSummary.expired}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Onboarding checklist</h3>
              <ul className="space-y-2">
                {compliance.onboardingItems.map((item) => (
                  <li
                    key={item.key}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
                  >
                    <span>{item.label}</span>
                    <CampaignStatusBadge status={item.status} />
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
