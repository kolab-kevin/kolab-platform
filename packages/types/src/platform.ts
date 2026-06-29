import { z } from 'zod';

export const PlatformSchema = z.enum([
  'KOLAB_AGENCY',
  'TIKTOK_CREATOR',
  'TIKTOK_SHOP',
  'AI_SERVICES',
  'LIVE_STREAMING',
  'SYMLCAST',
]);

export type Platform = z.infer<typeof PlatformSchema>;

export const PLATFORMS = PlatformSchema.options;
