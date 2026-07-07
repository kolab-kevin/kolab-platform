import { z } from 'zod';

export const WorkspaceDataSourceSchema = z.enum(['mock', 'live', 'partial', 'empty']);

export type WorkspaceDataSource = z.infer<typeof WorkspaceDataSourceSchema>;
