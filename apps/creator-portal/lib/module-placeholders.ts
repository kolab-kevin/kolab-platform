export const MODULE_PLACEHOLDERS = {
  goals: {
    title: 'Goals',
    description:
      'Track active goals, progress, and recalculation from your live and campaign activity.',
  },
  campaigns: {
    title: 'Campaigns',
    description: 'Review assigned campaigns, applications, and upcoming due dates.',
  },
  deliverables: {
    title: 'Deliverables',
    description: 'Submit and monitor campaign deliverables from one workspace.',
  },
  live: {
    title: 'Live',
    description: 'Manage your live schedule and go-live workflow before streaming.',
  },
  coach: {
    title: 'Coach',
    description: 'Review alerts and recommendations from your recent live sessions.',
  },
  performance: {
    title: 'Performance',
    description: 'Explore your performance score, trends, and focus areas in detail.',
  },
  intelligence: {
    title: 'Intelligence',
    description: 'View your cross-session intelligence profile and coaching priorities.',
  },
  profile: {
    title: 'Profile',
    description: 'Manage your creator profile and platform presence.',
  },
  settings: {
    title: 'Settings',
    description: 'Update account preferences and workspace settings.',
  },
} as const;

export type ModulePlaceholderKey = keyof typeof MODULE_PLACEHOLDERS;
