interface Meta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  nextCursor?: string;
  hasMore?: boolean;
}

export class ApiResponse {
  static success<T>(data: T, meta?: Meta) {
    return { success: true as const, data, ...(meta ? { meta } : {}) };
  }

  static error(message: string, details?: unknown) {
    return {
      success: false as const,
      error: { message, ...(details ? { details } : {}) },
    };
  }
}
