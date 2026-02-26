import { HttpStatusCode } from "../constants/http-status";
export declare class AppError extends Error {
    readonly statusCode: HttpStatusCode;
    readonly isOperational: boolean;
    readonly errors: string[];
    constructor(message: string, statusCode: HttpStatusCode, errors?: string[], isOperational?: boolean);
}
export declare class BadRequestError extends AppError {
    constructor(message?: string, errors?: string[]);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
//# sourceMappingURL=app-error.d.ts.map