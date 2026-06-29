import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginatedResponseSchema = <TItem extends z.ZodTypeAny>(itemSchema: TItem) =>
  z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().nullable(),
    total: z.number().int().nonnegative().optional(),
  });

export type PaginatedResponse<TItem> = {
  items: TItem[];
  nextCursor: string | null;
  total?: number;
};
