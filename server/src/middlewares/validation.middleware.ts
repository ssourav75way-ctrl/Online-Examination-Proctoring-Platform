import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../utils/app-error";

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

export const validate = <T extends Record<string, unknown>>(
  schema: ValidationSchema<T>,
  source: "body" | "query" | "params" = "body",
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const data = req[source] as Record<string, unknown>;
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      if (
        rules.required &&
        (value === undefined || value === null || value === "")
      ) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value === undefined || value === null) continue;

      if (rules.type) {
        if (rules.type === "array" && !Array.isArray(value)) {
          errors.push(`${field} must be an array`);
          continue;
        } else if (rules.type !== "array" && typeof value !== rules.type) {
          errors.push(`${field} must be of type ${rules.type}`);
          continue;
        }
      }

      if (typeof value === "string") {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(
            `${field} must be at least ${rules.minLength} characters`,
          );
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must be at most ${rules.maxLength} characters`);
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`${field} must be one of: ${rules.enum.join(", ")}`);
        }
      }

      if (typeof value === "number") {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${field} must be at most ${rules.max}`);
        }
      }

      if (rules.custom) {
        const customError = rules.custom(value as T[keyof T]);
        if (customError) {
          errors.push(customError);
        }
      }
    }

    if (errors.length > 0) {
      next(new BadRequestError("Validation failed", errors));
      return;
    }

    next();
  };
};
