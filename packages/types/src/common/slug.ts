import { z } from 'zod';

export const OrganizationSlugSchema = z
  .string()
  .min(2, 'Slug must be at least 2 characters')
  .max(64, 'Slug must be at most 64 characters')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case');

export type OrganizationSlug = z.infer<typeof OrganizationSlugSchema>;
