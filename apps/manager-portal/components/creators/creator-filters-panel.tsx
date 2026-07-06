import type { CreatorManagementFilters } from '@/types/creator-management';

type CreatorFiltersPanelProps = {
  filters: CreatorManagementFilters;
  onChange: (filters: CreatorManagementFilters) => void;
};

const FILTER_OPTIONS = {
  status: ['ALL', 'ACTIVE', 'SUSPENDED', 'REMOVED'],
  country: ['ALL', 'US', 'CA', 'MX', 'IN', 'UK', 'IT'],
  language: ['ALL', 'en', 'es', 'zh', 'hi', 'it'],
  platform: ['ALL', 'TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'TWITCH'],
  performanceBand: ['ALL', 'EXCELLENT', 'STRONG', 'DEVELOPING', 'AT_RISK'],
  compliance: ['ALL', 'COMPLIANT', 'AT_RISK', 'BLOCKED'],
} as const;

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <select
        className="bg-background/60 rounded-md border border-white/10 px-2 py-1.5 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === 'ALL' ? 'All' : option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CreatorFiltersPanel({ filters, onChange }: CreatorFiltersPanelProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <FilterSelect
        label="Status"
        value={filters.status}
        options={FILTER_OPTIONS.status}
        onChange={(status) => onChange({ ...filters, status })}
      />
      <FilterSelect
        label="Country"
        value={filters.country}
        options={FILTER_OPTIONS.country}
        onChange={(country) => onChange({ ...filters, country })}
      />
      <FilterSelect
        label="Language"
        value={filters.language}
        options={FILTER_OPTIONS.language}
        onChange={(language) => onChange({ ...filters, language })}
      />
      <FilterSelect
        label="Platform"
        value={filters.platform}
        options={FILTER_OPTIONS.platform}
        onChange={(platform) => onChange({ ...filters, platform })}
      />
      <FilterSelect
        label="Performance Band"
        value={filters.performanceBand}
        options={FILTER_OPTIONS.performanceBand}
        onChange={(performanceBand) => onChange({ ...filters, performanceBand })}
      />
      <FilterSelect
        label="Compliance"
        value={filters.compliance}
        options={FILTER_OPTIONS.compliance}
        onChange={(compliance) => onChange({ ...filters, compliance })}
      />
    </div>
  );
}
