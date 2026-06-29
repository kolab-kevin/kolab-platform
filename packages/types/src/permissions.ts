import { z } from 'zod';

export const PermissionSchema = z.enum([
  'org:read',
  'org:update',
  'members:read',
  'members:invite',
  'members:update_role',
  'members:remove',
  'audit:read',
  'sessions:revoke',
]);

export type Permission = z.infer<typeof PermissionSchema>;

export const PERMISSIONS = PermissionSchema.options;
