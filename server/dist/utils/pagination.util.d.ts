export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}
export declare const parsePagination: (query: {
    page?: string;
    limit?: string;
}) => PaginationParams;
export declare const calculateTotalPages: (total: number, limit: number) => number;
//# sourceMappingURL=pagination.util.d.ts.map