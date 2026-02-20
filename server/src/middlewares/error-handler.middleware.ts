import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error";
import { sendError } from "../utils/response.util";
import winston from "winston";
import { Prisma } from "@prisma/client";

const logger = winston.createLogger({
  level: "error",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      sendError(res, "Unique constraint violation", 409);
      return;
    }
  }

  logger.error("Unhandled error:", {
    message: err.message,
    stack: err.stack,
  });

  sendError(res, "Internal server error", 500);
};
