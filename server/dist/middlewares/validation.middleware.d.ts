import { Request, Response, NextFunction } from "express";
type ValidationSchema<T> = {
    [K in keyof T]: {
        required?: boolean;
        type?: "string" | "number" | "boolean" | "object" | "array";
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
        enum?: readonly string[];
        pattern?: RegExp;
        custom?: (value: T[K]) => string | null;
    };
};
export declare const validate: <T extends Record<string, unknown>>(schema: ValidationSchema<T>, source?: "body" | "query" | "params") => (req: Request, _res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=validation.middleware.d.ts.map