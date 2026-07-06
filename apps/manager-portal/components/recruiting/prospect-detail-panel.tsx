import { WorkspaceCard } from '@/components/common/workspace-layout';
import { RecruitmentStatusBadge } from '@/components/recruiting/recruitment-status-badge';
import type { ManagerProspectDetail } from '@/types/recruiting-workspace';

type ProspectDetailPanelProps = {
  detail: ManagerProspectDetail | null;
  loading?: boolean;
  error?: string | null;
};

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value ?? '—'}</span>
    </div>
  );
}

export function ProspectDetailPanel({ detail, loading, error }: ProspectDetailPanelProps) {
  return (
    <WorkspaceCard title="Prospect detail" description="Selected lead profile and activity">
      {loading ? <p className="text-muted-foreground text-sm">Loading prospect detail…</p> : null}
      {!loading && error ? <p className="text-sm text-red-300">{error}</p> : null}
      {!loading && !error && !detail ? (
        <p className="text-muted-foreground text-sm">Select a prospect to view details.</p>
      ) : null}
      {!loading && !error && detail ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{detail.name}</h3>
            <div className="mt-2">
              <RecruitmentStatusBadge status={detail.status} />
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Contact info</h4>
            {detail.contactInfo.map((entry) => (
              <DetailRow key={entry.label} label={entry.label} value={entry.value} />
            ))}
          </div>

          <DetailRow label="Source" value={detail.source} />
          <DetailRow label="Assigned recruiter" value={detail.assignedRecruiterName} />
          <DetailRow label="Audience" value={detail.audienceLabel} />

          <div>
            <h4 className="mb-2 text-sm font-semibold">Platforms</h4>
            {detail.platforms.length === 0 ? (
              <p className="text-muted-foreground text-sm">No platform accounts.</p>
            ) : (
              detail.platforms.map((platform) => (
                <DetailRow
                  key={`${platform.platform}-${platform.username}`}
                  label={platform.platform}
                  value={`@${platform.username}${platform.followers ? ` · ${platform.followers.toLocaleString()} followers` : ''}`}
                />
              ))
            )}
          </div>

          <DetailRow
            label="Languages"
            value={detail.languages.length > 0 ? detail.languages.join(', ') : null}
          />

          <div>
            <h4 className="mb-2 text-sm font-semibold">Tags</h4>
            {detail.tags.length === 0 ? (
              <p className="text-muted-foreground text-sm">No tags.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {detail.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 px-2 py-0.5 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Notes</h4>
            {detail.notes.length === 0 ? (
              <p className="text-muted-foreground text-sm">No notes.</p>
            ) : (
              detail.notes.map((note) => (
                <div key={note.id} className="border-b border-white/5 py-2 text-sm last:border-0">
                  <p>{note.content}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Follow-up history</h4>
            {detail.followUpHistory.map((entry) => (
              <div key={entry.id} className="border-b border-white/5 py-2 text-sm last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <span>{entry.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(entry.occurredAt).toLocaleString()}
                  </span>
                </div>
                {entry.note ? (
                  <p className="text-muted-foreground mt-1 text-xs">{entry.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </WorkspaceCard>
  );
}
