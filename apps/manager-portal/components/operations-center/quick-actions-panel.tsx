import { QuickActionsBar } from '@/components/common/workspace-toolbar';

const ACTIONS = [
  'Create Task',
  'Assign Task',
  'Open Creator',
  'Open Campaign',
  'Acknowledge Alert',
  'Export',
] as const;

export function QuickActionsPanel() {
  return (
    <QuickActionsBar
      actions={ACTIONS.map((label) => ({
        label,
        disabled: true,
      }))}
    />
  );
}
