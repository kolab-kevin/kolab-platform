'use client';

import * as React from 'react';

import { readStudioTabPreference, writeStudioTabPreference } from '@/lib/studio-preferences';

export function useWorkspaceTabs<T extends string>(
  workspaceKey: string,
  defaultTab: T,
  allowedTabs: readonly T[],
): [T, (tab: T) => void] {
  const [tab, setTabState] = React.useState<T>(defaultTab);

  React.useEffect(() => {
    const stored = readStudioTabPreference(workspaceKey, defaultTab);
    if (allowedTabs.includes(stored as T)) {
      setTabState(stored as T);
    }
  }, [allowedTabs, defaultTab, workspaceKey]);

  const setTab = React.useCallback(
    (next: T) => {
      setTabState(next);
      writeStudioTabPreference(workspaceKey, next);
    },
    [workspaceKey],
  );

  return [tab, setTab];
}
