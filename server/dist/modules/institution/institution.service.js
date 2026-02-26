"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.institutionService = exports.InstitutionService = void 0;
const database_config_1 = __importDefault(require("../../config/database.config"));
const app_error_1 = require("../../utils/app-error");
class InstitutionService {
    async create(input) {
        const existing = await database_config_1.default.institution.findUnique({
            where: { code: input.code },
        });
        if (existing) {
            throw new app_error_1.ConflictError("Institution code already exists");
        }
        return database_config_1.default.institution.create({
            data: { name: input.name, code: input.code },
        });
    }
    async getById(id) {
        const institution = await database_config_1.default.institution.findUnique({
            where: { id },
            include: {
                departments: { select: { id: true, name: true, code: true } },
                _count: { select: { members: true, exams: true } },
            },
        });
        if (!institution) {
            throw new app_error_1.NotFoundError("Institution not found");
        }
        return institution;
    }
    async getAll(pagination) {
        const [institutions, total] = await Promise.all([
            database_config_1.default.institution.findMany({
                skip: pagination.skip,
                take: pagination.limit,
                include: {
                    _count: { select: { members: true, departments: true, exams: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
            database_config_1.default.institution.count(),
        ]);
        return { institutions, total };
    }
    async update(id, data) {
        const institution = await database_config_1.default.institution.findUnique({ where: { id } });
        if (!institution)
            throw new app_error_1.NotFoundError("Institution not found");
        if (data.code) {
            const existing = await database_config_1.default.institution.findFirst({
                where: { code: data.code, NOT: { id } },
            });
            if (existing)
                throw new app_error_1.ConflictError("Institution code already exists");
        }
        return database_config_1.default.institution.update({ where: { id }, data });
    }
    async addMember(institutionId, input) {
        const institution = await database_config_1.default.institution.findUnique({
            where: { id: institutionId },
        });
        if (!institution)
            throw new app_error_1.NotFoundError("Institution not found");
        const user = await database_config_1.default.user.findUnique({ where: { id: input.userId } });
        if (!user)
            throw new app_error_1.NotFoundError("User not found");
        const existing = await database_config_1.default.institutionMember.findUnique({
            where: { userId_institutionId: { userId: input.userId, institutionId } },
        });
        if (existing) {
            throw new app_error_1.ConflictError("User is already a member of this institution");
        }
        if (input.departmentIds && input.departmentIds.length > 0) {
            const departments = await database_config_1.default.department.findMany({
                where: { id: { in: input.departmentIds }, institutionId },
            });
            if (departments.length !== input.departmentIds.length) {
                throw new app_error_1.BadRequestError("One or more department IDs are invalid for this institution");
            }
        }
        return database_config_1.default.institutionMember.create({
            data: {
                userId: input.userId,
                institutionId,
                role: input.role,
                departmentAccess: input.departmentIds
                    ? {
                        create: input.departmentIds.map((deptId) => ({
                            departmentId: deptId,
                        })),
                    }
                    : undefined,
            },
            include: {
                user: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                departmentAccess: {
                    include: { department: { select: { id: true, name: true } } },
                },
            },
        });
    }
    async removeMember(institutionId, userId) {
        const membership = await database_config_1.default.institutionMember.findUnique({
            where: { userId_institutionId: { userId, institutionId } },
        });
        if (!membership) {
            throw new app_error_1.NotFoundError("Membership not found");
        }
        await database_config_1.default.institutionMember.delete({
            where: { id: membership.id },
        });
    }
    async getMembers(institutionId, pagination) {
        const [members, total] = await Promise.all([
            database_config_1.default.institutionMember.findMany({
                where: { institutionId },
                skip: pagination.skip,
                take: pagination.limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            globalRole: true,
                        },
                    },
                    departmentAccess: {
                        include: { department: { select: { id: true, name: true } } },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
            database_config_1.default.institutionMember.count({ where: { institutionId } }),
        ]);
        return { members, total };
    }
    async updateMemberDepartments(institutionId, userId, departmentIds) {
        const membership = await database_config_1.default.institutionMember.findUnique({
            where: { userId_institutionId: { userId, institutionId } },
        });
        if (!membership)
            throw new app_error_1.NotFoundError("Membership not found");
        if (departmentIds.length > 0) {
            const departments = await database_config_1.default.department.findMany({
                where: { id: { in: departmentIds }, institutionId },
            });
            if (departments.length !== departmentIds.length) {
                throw new app_error_1.BadRequestError("One or more department IDs are invalid for this institution");
            }
        }
        await database_config_1.default.institutionMemberDepartment.deleteMany({
            where: { institutionMemberId: membership.id },
        });
        if (departmentIds.length > 0) {
            await database_config_1.default.institutionMemberDepartment.createMany({
                data: departmentIds.map((deptId) => ({
                    institutionMemberId: membership.id,
                    departmentId: deptId,
                })),
            });
        }
        return database_config_1.default.institutionMember.findUnique({
            where: { id: membership.id },
            include: {
                user: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                departmentAccess: {
                    include: { department: { select: { id: true, name: true } } },
                },
            },
        });
    }
}
exports.InstitutionService = InstitutionService;
exports.institutionService = new InstitutionService();
//# sourceMappingURL=institution.service.js.map