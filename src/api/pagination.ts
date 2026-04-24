export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function parsePageParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10)));
  const sortBy = searchParams.get("sortBy") ?? undefined;
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") ?? "asc";

  return { page, pageSize, sortBy, sortOrder };
}

export function parseCursorParams(searchParams: URLSearchParams): CursorPaginationParams {
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE), 10)));

  return { cursor, limit };
}

export function encodeCursor(items: unknown[], index: number): string {
  const item = items[index];
  if (!item || typeof item !== "object") {
    return btoa(String(index));
  }
  const id = (item as Record<string, unknown>).id;
  if (!id) {
    return btoa(String(index));
  }
  return btoa(String(id));
}

export function decodeCursor(cursor: string): string {
  try {
    return atob(cursor);
  } catch {
    return cursor;
  }
}

export function createPaginationMeta(
  page: number,
  pageSize: number,
  total: number
) {
  const totalPages = Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}