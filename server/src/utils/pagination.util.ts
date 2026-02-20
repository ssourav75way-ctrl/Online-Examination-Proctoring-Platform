export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const parsePagination = (query: {
  page?: string;
  limit?: string;
}): PaginationParams => {
  const page = Math.max(1, parseInt(query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10)));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const calculateTotalPages = (total: number, limit: number): number => {
  return Math.ceil(total / limit);
};
