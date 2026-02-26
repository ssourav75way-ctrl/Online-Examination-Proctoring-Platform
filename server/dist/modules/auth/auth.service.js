"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const database_config_1 = __importDefault(require("../../config/database.config"));
const password_util_1 = require("../../utils/password.util");
const token_util_1 = require("../../utils/token.util");
const app_error_1 = require("../../utils/app-error");
const client_1 = require("@prisma/client");
class AuthService {
    async register(input) {
        const existing = await database_config_1.default.user.findUnique({
            where: { email: input.email },
        });
        if (existing) {
            throw new app_error_1.ConflictError("Email already registered");
        }
        if (input.password.length < 8) {
            throw new app_error_1.BadRequestError("Password must be at least 8 characters");
        }
        const passwordHash = await (0, password_util_1.hashPassword)(input.password);
        const user = await database_config_1.default.user.create({
            data: {
                email: input.email,
                passwordHash,
                firstName: input.firstName,
                lastName: input.lastName,
                globalRole: input.globalRole || client_1.GlobalRole.CANDIDATE,
            },
        });
        const payload = {
            userId: user.id,
            email: user.email,
            globalRole: user.globalRole,
        };
        const tokens = (0, token_util_1.generateTokenPair)(payload);
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                globalRole: user.globalRole,
                institutionMembers: [],
            },
            tokens,
        };
    }
    async login(input) {
        const user = await database_config_1.default.user.findUnique({
            where: { email: input.email },
        });
        if (!user) {
            throw new app_error_1.UnauthorizedError("Invalid credentials");
        }
        if (!user.isActive) {
            throw new app_error_1.UnauthorizedError("Account is deactivated");
        }
        const isValid = await (0, password_util_1.comparePassword)(input.password, user.passwordHash);
        if (!isValid) {
            throw new app_error_1.UnauthorizedError("Invalid credentials");
        }
        const payload = {
            userId: user.id,
            email: user.email,
            globalRole: user.globalRole,
        };
        const tokens = (0, token_util_1.generateTokenPair)(payload);
        const fullUser = await database_config_1.default.user.findUnique({
            where: { id: user.id },
            include: {
                institutionMembers: {
                    include: {
                        institution: { select: { id: true, name: true, code: true } },
                        departmentAccess: {
                            include: { department: { select: { id: true, name: true } } },
                        },
                    },
                },
            },
        });
        return {
            user: {
                id: fullUser.id,
                email: fullUser.email,
                firstName: fullUser.firstName,
                lastName: fullUser.lastName,
                globalRole: fullUser.globalRole,
                institutionMembers: fullUser.institutionMembers,
            },
            tokens,
        };
    }
    async refreshToken(refreshTokenStr) {
        try {
            const payload = (0, token_util_1.verifyRefreshToken)(refreshTokenStr);
            const user = await database_config_1.default.user.findUnique({
                where: { id: payload.userId },
            });
            if (!user || !user.isActive) {
                throw new app_error_1.UnauthorizedError("User not found or inactive");
            }
            const jwtPayload = {
                userId: user.id,
                email: user.email,
                globalRole: user.globalRole,
            };
            return (0, token_util_1.generateTokenPair)(jwtPayload);
        }
        catch {
            throw new app_error_1.UnauthorizedError("Invalid refresh token");
        }
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map