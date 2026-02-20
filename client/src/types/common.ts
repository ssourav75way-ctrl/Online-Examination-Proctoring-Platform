export interface ApiError {
  data?: {
    message?: string;
    errors?: Record<string, string[]>;
  };
  status?: number | string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
}
