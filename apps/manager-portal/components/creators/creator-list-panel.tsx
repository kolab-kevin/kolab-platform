import { Button, cn } from '@kolab/ui';

import { CreatorStatusBadge } from '@/components/creators/creator-status-badge';
import { PORTAL_CARD_CLASS } from '@/lib/portal-ui';
import type {
  CreatorManagementSortField,
  ManagerCreatorListItem,
} from '@/types/creator-management';

type CreatorListPanelProps = {
  items: ManagerCreatorListItem[];
  selectedCreatorId: string | null;
  search: string;
  sortField: CreatorManagementSortField;
  sortDirection: 'asc' | 'desc';
  page: number;
  totalPages: number;
  totalFilteredCount: number;
  onSearchChange: (value: string) => void;
  onSortFieldChange: (field: CreatorManagementSortField) => void;
  onSortDirectionChange: (direction: 'asc' | 'desc') => void;
  onPageChange: (page: number) => void;
  onSelectCreator: (creatorId: string) => void;
};

export function CreatorListPanel({
  items,
  selectedCreatorId,
  search,
  sortField,
  sortDirection,
  page,
  totalPages,
  totalFilteredCount,
  onSearchChange,
  onSortFieldChange,
  onSortDirectionChange,
  onPageChange,
  onSelectCreator,
}: CreatorListPanelProps) {
  return (
    <section className={cn('rounded-xl border p-4', PORTAL_CARD_CLASS)}>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-base font-semibold">Creator list</h2>
          <p className="text-muted-foreground text-sm">
            {totalFilteredCount} creators · Page {page} of {totalPages}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search creators…"
            className="bg-background/60 min-w-[220px] rounded-md border border-white/10 px-3 py-2 text-sm"
            aria-label="Search creators"
          />
          <select
            className="bg-background/60 rounded-md border border-white/10 px-2 py-2 text-sm"
            value={sortField}
            onChange={(event) =>
              onSortFieldChange(event.target.value as CreatorManagementSortField)
            }
            aria-label="Sort creators"
          >
            <option value="displayName">Name</option>
            <option value="status">Status</option>
            <option value="performanceScore">Performance</option>
            <option value="intelligenceScore">Intelligence</option>
            <option value="updatedAt">Latest activity</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'asc' ? 'Asc' : 'Desc'}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-muted-foreground border-b border-white/10 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-2 py-2">Creator</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Onboarding</th>
              <th className="px-2 py-2">Compliance</th>
              <th className="px-2 py-2">Scores</th>
              <th className="px-2 py-2">Manager</th>
              <th className="px-2 py-2">Platforms</th>
              <th className="px-2 py-2">Latest activity</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const selected = item.id === selectedCreatorId;
              return (
                <tr
                  key={item.id}
                  className={cn(
                    'border-b border-white/5 transition-colors',
                    selected ? 'bg-primary/10' : 'hover:bg-white/[0.02]',
                  )}
                >
                  <td className="px-2 py-3">
                    <button
                      type="button"
                      className="text-left"
                      onClick={() => onSelectCreator(item.id)}
                    >
                      <div className="font-medium">{item.displayName}</div>
                      <div className="text-muted-foreground text-xs">{item.email ?? '—'}</div>
                    </button>
                  </td>
                  <td className="px-2 py-3">
                    <CreatorStatusBadge label={item.status} />
                  </td>
                  <td className="px-2 py-3">
                    <CreatorStatusBadge label={item.onboardingStatus} />
                  </td>
                  <td className="px-2 py-3">
                    <CreatorStatusBadge label={item.complianceStatus} />
                  </td>
                  <td className="px-2 py-3">
                    <div className="text-xs">
                      <div>Perf {item.performanceScore ?? '—'}</div>
                      <div className="text-muted-foreground">
                        Intel {item.intelligenceScore ?? '—'}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3">{item.managerName ?? '—'}</td>
                  <td className="px-2 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.platformBadges.map((badge) => (
                        <CreatorStatusBadge key={badge} label={badge} />
                      ))}
                    </div>
                  </td>
                  <td className="text-muted-foreground px-2 py-3 text-xs">{item.latestActivity}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          Pagination placeholder · cursor API in live mode
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}
