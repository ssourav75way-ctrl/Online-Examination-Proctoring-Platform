"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const database_config_1 = __importDefault(require("../../config/database.config"));
const app_error_1 = require("../../utils/app-error");
class UserService {
    async getById(userId) {
        const user = await database_config_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                globalRole: true,
                isActive: true,
                highContrastMode: true,
                screenReaderEnabled: true,
                createdAt: true,
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
        if (!user) {
            throw new app_error_1.NotFoundError("User not found");
        }
        return user;
    }
    async getAll(pagination, role) {
        const where = role ? { globalRole: role } : {};
        const [users, total] = await Promise.all([
            database_config_1.default.user.findMany({
                where,
                skip: pagination.skip,
                take: pagination.limit,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    globalRole: true,
                    isActive: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            database_config_1.default.user.count({ where }),
        ]);
        return { users, total };
    }
    async findByEmail(email) {
        const user = await database_config_1.default.user.findFirst({
            where: {
                email: { equals: email, mode: "insensitive" },
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                globalRole: true,
            },
        });
        return user;
    }
    async update(userId, input) {
        const user = await database_config_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new app_error_1.NotFoundError("User not found");
        }
        return database_config_1.default.user.update({
            where: { id: userId },
            data: input,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                globalRole: true,
                highContrastMode: true,
                screenReaderEnabled: true,
            },
        });
    }
    async deactivate(userId) {
        const user = await database_config_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new app_error_1.NotFoundError("User not found");
        }
        if (!user.isActive) {
            throw new app_error_1.BadRequestError("User is already deactivated");
        }
        return database_config_1.default.user.update({
            where: { id: userId },
            data: { isActive: false },
        });
    }
    async activate(userId) {
        const user = await database_config_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new app_error_1.NotFoundError("User not found");
        }
        return database_config_1.default.user.update({
            where: { id: userId },
            data: { isActive: true },
        });
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
//# sourceMappingURL=user.service.js.map