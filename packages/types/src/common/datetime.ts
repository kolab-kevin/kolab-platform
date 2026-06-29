import { z } from 'zod';

/** ISO-8601 datetime string for API responses. */
export const DateTimeStringSchema = z.string().datetime();

export type DateTimeString = z.infer<typeof DateTimeStringSchema>;
