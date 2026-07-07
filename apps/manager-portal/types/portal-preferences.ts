import { z } from 'zod';

export const PortalThemeSchema = z.enum(['dark', 'light', 'system']);

export type PortalTheme = z.infer<typeof PortalThemeSchema>;

export const PortalPreferencesSchema = z.object({
  sidebarCollapsed: z.boolean(),
  theme: PortalThemeSchema,
  compactWorkspaces: z.boolean(),
  workspaceViewState: z.record(z.string(), z.string()),
});

export type PortalPreferences = z.infer<typeof PortalPreferencesSchema>;

export const DEFAULT_PORTAL_PREFERENCES: PortalPreferences = {
  sidebarCollapsed: false,
  theme: 'dark',
  compactWorkspaces: false,
  workspaceViewState: {},
};
