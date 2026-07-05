'use client';

import * as React from 'react';

import {
  readStudioWorkspacePreferences,
  type StudioWorkspacePreferences,
  writeStudioWorkspacePreferences,
} from '@/lib/studio-preferences';

export function useStudioPreferences(): [
  StudioWorkspacePreferences,
  (next: StudioWorkspacePreferences) => void,
] {
  const [preferences, setPreferences] = React.useState<StudioWorkspacePreferences>(
    readStudioWorkspacePreferences(),
  );

  React.useEffect(() => {
    setPreferences(readStudioWorkspacePreferences());
  }, []);

  const updatePreferences = React.useCallback((next: StudioWorkspacePreferences) => {
    setPreferences(next);
    writeStudioWorkspacePreferences(next);
    window.dispatchEvent(new Event('studio-preferences-changed'));
  }, []);

  return [preferences, updatePreferences];
}
