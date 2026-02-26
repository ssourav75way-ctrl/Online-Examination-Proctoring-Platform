"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const app_error_1 = require("../utils/app-error");
const response_util_1 = require("../utils/response.util");
const winston_1 = __importDefault(require("winston"));
const client_1 = require("@prisma/client");
const logger = winston_1.default.createLogger({
    level: "error",
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [new winston_1.default.transports.Console()],
});
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof app_error_1.AppError) {
        (0, response_util_1.sendError)(res, err.message, err.statusCode, err.errors);
        return;
    }
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            (0, response_util_1.sendError)(res, "Unique constraint violation", 409);
            return;
        }
    }
    logger.error("Unhandled error:", {
        message: err.message,
        stack: err.stack,
    });
    (0, response_util_1.sendError)(res, "Internal server error", 500);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error-handler.middleware.js.map