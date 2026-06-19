import { z } from 'zod';

/** A positive integer route param like `:id`. */
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/** Standard 1-based pagination query, with sane defaults and caps. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type IdParam = z.infer<typeof idParamSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
