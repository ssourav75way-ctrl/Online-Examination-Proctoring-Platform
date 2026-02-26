import { Response } from "express";
import { HttpStatusCode } from "../constants/http-status";
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, statusCode?: HttpStatusCode, meta?: PaginationMeta) => void;
export declare const sendError: (res: Response, message: string, statusCode?: HttpStatusCode, errors?: string[]) => void;
export declare const sendCreated: <T>(res: Response, data: T, message?: string) => void;
export declare const sendNoContent: (res: Response) => void;
//# sourceMappingURL=response.util.d.ts.map