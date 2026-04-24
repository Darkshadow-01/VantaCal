import type { NextRequest } from "next/server";
import type { ApiError } from "./response";
import { parsePageParams, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "./pagination";

export interface RouteContext {
  params: Promise<Record<string, string>>;
  searchParams: URLSearchParams;
}

export function createRouteHandler(request: NextRequest) {
  const pagination = parsePageParams(request.nextUrl.searchParams);
  
  return {
    request,
    searchParams: request.nextUrl.searchParams,
    pagination,
    get userId(): string | null {
      return request.headers.get("x-user-id") ?? null;
    },
    getPath(): string {
      return request.nextUrl.pathname;
    },
  };
}

export function createErrorResponse(error: unknown, path?: string): { error: ApiError } {
  const message = error instanceof Error ? error.message : "An unexpected error occurred";
  return {
    error: {
      error: "INTERNAL_ERROR",
      message,
      timestamp: new Date().toISOString(),
      path,
    },
  };
}

export type { ApiError };

export const API_CONSTANTS = {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
};