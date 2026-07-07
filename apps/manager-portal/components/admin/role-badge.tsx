import type { OrganizationRole } from '@kolab/types';

const ROLE_STYLES: Partial<Record<OrganizationRole, string>> = {
  ORG_OWNER: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
  ORG_ADMIN: 'border-orange-400/30 bg-orange-400/10 text-orange-100',
  AGENCY_MANAGER: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
  RECRUITER: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
  FINANCE: 'border-violet-400/30 bg-violet-400/10 text-violet-100',
  SUPPORT: 'border-slate-400/30 bg-slate-400/10 text-slate-100',
  VIEWER: 'border-white/20 bg-white/5 text-muted-foreground',
};

type RoleBadgeProps = {
  role: string;
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const normalized = role.replace(/\s+/g, '_').toUpperCase() as OrganizationRole;
  const style = ROLE_STYLES[normalized] ?? 'border-white/20 bg-white/5 text-muted-foreground';

  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${style}`}>{role}</span>
  );
}
