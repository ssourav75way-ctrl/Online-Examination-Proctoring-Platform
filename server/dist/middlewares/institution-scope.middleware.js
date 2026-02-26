"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.institutionScope = void 0;
const app_error_1 = require("../utils/app-error");
const database_config_1 = __importDefault(require("../config/database.config"));
const institutionScope = async (req, _res, next) => {
    try {
        if (!req.user) {
            throw new app_error_1.UnauthorizedError("Authentication required");
        }
        const institutionId = req.params.institutionId ||
            req.params.id ||
            req.body.institutionId;
        if (!institutionId) {
            throw new app_error_1.ForbiddenError("Institution context required");
        }
        if (req.user.globalRole === "SUPER_ADMIN") {
            const allDepts = await database_config_1.default.department.findMany({
                where: { institutionId },
                select: { id: true },
            });
            const scopedUser = {
                ...req.user,
                institutionId,
                institutionRole: "ADMIN",
                departmentIds: allDepts.map((d) => d.id),
            };
            req.scopedUser = scopedUser;
            next();
            return;
        }
        const membership = await database_config_1.default.institutionMember.findUnique({
            where: {
                userId_institutionId: {
                    userId: req.user.userId,
                    institutionId,
                },
            },
            include: {
                departmentAccess: {
                    select: { departmentId: true },
                },
            },
        });
        if (!membership) {
            throw new app_error_1.ForbiddenError("You are not a member of this institution");
        }
        let departmentIds = [];
        const normalizedRole = String(membership.role).toUpperCase();
        if (normalizedRole === "ADMIN" || normalizedRole === "EXAMINER") {
            if (normalizedRole === "ADMIN" ||
                membership.departmentAccess.length === 0) {
                const allDepts = await database_config_1.default.department.findMany({
                    where: { institutionId },
                    select: { id: true },
                });
                departmentIds = allDepts.map((d) => d.id);
            }
            else {
                departmentIds = membership.departmentAccess.map((da) => da.departmentId);
            }
        }
        else {
            departmentIds = membership.departmentAccess.map((da) => da.departmentId);
        }
        const scopedUser = {
            ...req.user,
            institutionId,
            institutionRole: membership.role,
            departmentIds,
        };
        req.scopedUser = scopedUser;
        next();
    }
    catch (error) {
        console.error("[InstitutionScope] Error:", error);
        next(error);
    }
};
exports.institutionScope = institutionScope;
//# sourceMappingURL=institution-scope.middleware.js.map