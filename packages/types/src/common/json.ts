import { z } from 'zod';

/** JSON object values stored in Prisma `Json` columns. */
export const JsonObjectSchema = z.record(z.string(), z.unknown());

export type JsonObject = z.infer<typeof JsonObjectSchema>;
