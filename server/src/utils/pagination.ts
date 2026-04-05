export interface PaginationParams {
  page: number;
  limit: number;
}

export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
}

export function getOffsetPagination(params: PaginationParams) {
  const page = Math.max(1, params.page);
  const limit = Math.min(100, Math.max(1, params.limit));
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
}

export function buildPaginatedMeta(total: number, page: number, limit: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

export function getCursorPagination(params: CursorPaginationParams) {
  const limit = Math.min(100, Math.max(1, params.limit));
  const cursor = params.cursor ? { id: params.cursor } : undefined;
  return {
    take: limit + 1,
    ...(cursor ? { cursor, skip: 1 } : {}),
  };
}

export function buildCursorMeta<T extends { id: string }>(data: T[], limit: number) {
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;
  return { items, meta: { limit, nextCursor, hasMore } };
}

export function parsePaginationQuery(query: Record<string, unknown>) {
  const page = typeof query.page === 'string' ? parseInt(query.page, 10) : 1;
  const limit = typeof query.limit === 'string' ? parseInt(query.limit, 10) : 20;
  const cursor = typeof query.cursor === 'string' ? query.cursor : undefined;
  if (cursor) return { type: 'cursor' as const, cursor, limit };
  return { type: 'offset' as const, page, limit };
}
