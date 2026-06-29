export const SERVICE_PORTS = {
  web: 3000,
  admin: 3001,
  creatorPortal: 3002,
  moderator: 3003,
  api: 4000,
  publicApi: 4001,
  mobileApi: 4002,
  aiServices: 4003,
} as const;

export const SERVICE_NAMES = {
  web: 'KŌLAB Web',
  admin: 'KŌLAB Admin',
  creatorPortal: 'KŌLAB Creator Portal',
  moderator: 'KŌLAB Moderator',
  api: 'KŌLAB API',
  publicApi: 'KŌLAB Public API',
  mobileApi: 'KŌLAB Mobile API',
  aiServices: 'KŌLAB AI Services',
} as const;

export type ServiceKey = keyof typeof SERVICE_PORTS;
