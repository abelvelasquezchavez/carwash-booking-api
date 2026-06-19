export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Translates 1-based page/limit into a Prisma `skip`/`take` pair. */
export const toSkipTake = ({
  page,
  limit,
}: PaginationParams): { skip: number; take: number } => ({
  skip: (page - 1) * limit,
  take: limit,
});

export const buildPaginationMeta = (
  { page, limit }: PaginationParams,
  total: number,
): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});
