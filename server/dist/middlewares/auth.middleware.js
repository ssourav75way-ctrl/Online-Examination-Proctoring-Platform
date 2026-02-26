"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const token_util_1 = require("../utils/token.util");
const app_error_1 = require("../utils/app-error");
const database_config_1 = __importDefault(require("../config/database.config"));
const authenticate = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new app_error_1.UnauthorizedError("No token provided");
        }
        const token = authHeader.split(" ")[1];
        const payload = (0, token_util_1.verifyAccessToken)(token);
        const user = await database_config_1.default.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                email: true,
                globalRole: true,
                firstName: true,
                lastName: true,
                isActive: true,
            },
        });
        if (!user || !user.isActive) {
            throw new app_error_1.UnauthorizedError("User not found or inactive");
        }
        const authenticatedUser = {
            userId: user.id,
            email: user.email,
            globalRole: user.globalRole,
            firstName: user.firstName,
            lastName: user.lastName,
        };
        req.user = authenticatedUser;
        next();
    }
    catch (error) {
        if (error instanceof app_error_1.UnauthorizedError) {
            next(error);
        }
        else {
            next(new app_error_1.UnauthorizedError("Invalid or expired token"));
        }
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.middleware.js.map