import { z } from 'zod';

import { DateTimeStringSchema } from '../common/datetime';
import { JsonObjectSchema } from '../common/json';
import { OrganizationSlugSchema } from '../common/slug';
import { OrganizationStatusSchema, OrganizationTypeSchema } from './enums';

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: OrganizationSlugSchema,
  type: OrganizationTypeSchema,
  status: OrganizationStatusSchema,
  settings: JsonObjectSchema,
  createdAt: DateTimeStringSchema,
  updatedAt: DateTimeStringSchema,
});

export type Organization = z.infer<typeof OrganizationSchema>;

export const OrganizationSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: OrganizationSlugSchema,
  type: OrganizationTypeSchema,
  status: OrganizationStatusSchema,
});

export type OrganizationSummary = z.infer<typeof OrganizationSummarySchema>;

export const CreateOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).trim(),
  slug: OrganizationSlugSchema.optional(),
  type: OrganizationTypeSchema.optional(),
  settings: JsonObjectSchema.optional(),
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;

export const UpdateOrganizationSchema = z
  .object({
    name: z.string().min(1).max(255).trim().optional(),
    slug: OrganizationSlugSchema.optional(),
    type: OrganizationTypeSchema.optional(),
    status: OrganizationStatusSchema.optional(),
    settings: JsonObjectSchema.optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.slug !== undefined ||
      value.type !== undefined ||
      value.status !== undefined ||
      value.settings !== undefined,
    { message: 'At least one field must be provided' },
  );

export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;

export const UpdateOrganizationSettingsSchema = z.object({
  settings: JsonObjectSchema,
});

export type UpdateOrganizationSettingsInput = z.infer<typeof UpdateOrganizationSettingsSchema>;

export const OrganizationListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: OrganizationStatusSchema.optional(),
  type: OrganizationTypeSchema.optional(),
  search: z.string().max(255).trim().optional(),
});

export type OrganizationListQuery = z.infer<typeof OrganizationListQuerySchema>;

export const UpdateOrganizationStatusSchema = z.object({
  status: OrganizationStatusSchema,
});

export type UpdateOrganizationStatusInput = z.infer<typeof UpdateOrganizationStatusSchema>;
