import { QuickActionsBar } from '@/components/common/workspace-toolbar';

const ACTIONS = [
  'Invite User',
  'Create Role',
  'Edit Organization',
  'Export Audit',
  'Refresh Status',
] as const;

type QuickActionsPanelProps = {
  onRefresh?: () => void;
};

export function QuickActionsPanel({ onRefresh }: QuickActionsPanelProps) {
  return (
    <QuickActionsBar
      actions={ACTIONS.map((label) => ({
        label,
        disabled: label !== 'Refresh Status',
        onClick: label === 'Refresh Status' ? onRefresh : undefined,
      }))}
    />
  );
}
