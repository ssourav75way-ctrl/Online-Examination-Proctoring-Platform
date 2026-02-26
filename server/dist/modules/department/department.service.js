"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentService = exports.DepartmentService = void 0;
const database_config_1 = __importDefault(require("../../config/database.config"));
const app_error_1 = require("../../utils/app-error");
class DepartmentService {
    async create(institutionId, input) {
        const institution = await database_config_1.default.institution.findUnique({
            where: { id: institutionId },
        });
        if (!institution)
            throw new app_error_1.NotFoundError("Institution not found");
        const existing = await database_config_1.default.department.findUnique({
            where: { institutionId_code: { institutionId, code: input.code } },
        });
        if (existing)
            throw new app_error_1.ConflictError("Department code already exists in this institution");
        return database_config_1.default.department.create({
            data: { ...input, institutionId },
            include: { questionPools: { select: { id: true, name: true } } },
        });
    }
    async getByInstitution(institutionId, departmentIds) {
        const where = {
            institutionId,
        };
        if (departmentIds) {
            where.id = { in: departmentIds };
        }
        return database_config_1.default.department.findMany({
            where,
            include: {
                questionPools: { select: { id: true, name: true, isShared: true } },
                _count: { select: { questionPools: true } },
            },
            orderBy: { name: "asc" },
        });
    }
    async getById(id) {
        const dept = await database_config_1.default.department.findUnique({
            where: { id },
            include: {
                institution: { select: { id: true, name: true } },
                questionPools: true,
            },
        });
        if (!dept)
            throw new app_error_1.NotFoundError("Department not found");
        return dept;
    }
    async update(id, input) {
        const dept = await database_config_1.default.department.findUnique({ where: { id } });
        if (!dept)
            throw new app_error_1.NotFoundError("Department not found");
        if (input.code) {
            const existing = await database_config_1.default.department.findFirst({
                where: {
                    institutionId: dept.institutionId,
                    code: input.code,
                    NOT: { id },
                },
            });
            if (existing)
                throw new app_error_1.ConflictError("Department code already exists");
        }
        return database_config_1.default.department.update({ where: { id }, data: input });
    }
    async delete(id) {
        const dept = await database_config_1.default.department.findUnique({ where: { id } });
        if (!dept)
            throw new app_error_1.NotFoundError("Department not found");
        await database_config_1.default.department.delete({ where: { id } });
    }
}
exports.DepartmentService = DepartmentService;
exports.departmentService = new DepartmentService();
//# sourceMappingURL=department.service.js.map