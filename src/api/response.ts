export type ErrorCode = 
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE";

export interface ApiError {
  error: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  path?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  links?: {
    self: string;
    next?: string;
    prev?: string;
  };
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export class ApiErrorBuilder {
  private error: ApiError;

  constructor(code: ErrorCode, message: string) {
    this.error = {
      error: code,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  withDetails(details: Record<string, unknown>): ApiErrorBuilder {
    this.error.details = details;
    return this;
  }

  withPath(path: string): ApiErrorBuilder {
    this.error.path = path;
    return this;
  }

  build(): ApiError {
    return this.error;
  }

  static badRequest(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiErrorBuilder("BAD_REQUEST", message)
      .withDetails(details ?? {})
      .build();
  }

  static unauthorized(message: string = "Authentication required"): ApiError {
    return new ApiErrorBuilder("UNAUTHORIZED", message).build();
  }

  static forbidden(message: string = "Access denied"): ApiError {
    return new ApiErrorBuilder("FORBIDDEN", message).build();
  }

  static notFound(resource: string, id?: string): ApiError {
    return new ApiErrorBuilder("NOT_FOUND", `${resource} not found`)
      .withDetails(id ? { id } : {})
      .build();
  }

  static conflict(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiErrorBuilder("CONFLICT", message)
      .withDetails(details ?? {})
      .build();
  }

  static validationError(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiErrorBuilder("VALIDATION_ERROR", message)
      .withDetails(details ?? {})
      .build();
  }

  static internalError(message: string = "An unexpected error occurred"): ApiError {
    return new ApiErrorBuilder("INTERNAL_ERROR", message).build();
  }

  static serviceUnavailable(message: string = "Service temporarily unavailable"): ApiError {
    return new ApiErrorBuilder("SERVICE_UNAVAILABLE", message).build();
  }
}

export function mapToApiError(error: unknown, path?: string): ApiError {
  if (error instanceof Error) {
    return new ApiErrorBuilder("INTERNAL_ERROR", error.message)
      .withPath(path ?? "")
      .build();
  }
  return ApiErrorBuilder.internalError();
}

export const HTTP_STATUS: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};