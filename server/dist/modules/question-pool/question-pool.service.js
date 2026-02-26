"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionPoolService = exports.QuestionPoolService = void 0;
const database_config_1 = __importDefault(require("../../config/database.config"));
const app_error_1 = require("../../utils/app-error");
class QuestionPoolService {
    async create(input, departmentIds) {
        if (!departmentIds.includes(input.departmentId)) {
            throw new app_error_1.ForbiddenError("You do not have access to this department");
        }
        return database_config_1.default.questionPool.create({
            data: {
                departmentId: input.departmentId,
                name: input.name,
                description: input.description,
                isShared: input.isShared || false,
            },
            include: {
                department: { select: { id: true, name: true, institutionId: true } },
                _count: { select: { questions: true } },
            },
        });
    }
    async getByDepartment(departmentId, pagination) {
        const [pools, total] = await Promise.all([
            database_config_1.default.questionPool.findMany({
                where: { departmentId },
                skip: pagination.skip,
                take: pagination.limit,
                include: {
                    department: { select: { id: true, name: true } },
                    _count: { select: { questions: true } },
                },
                orderBy: { name: "asc" },
            }),
            database_config_1.default.questionPool.count({ where: { departmentId } }),
        ]);
        return { pools, total };
    }
    async getAccessiblePools(institutionId, departmentIds, pagination) {
        const where = {
            department: { institutionId },
            OR: [{ departmentId: { in: departmentIds } }, { isShared: true }],
        };
        const [pools, total] = await Promise.all([
            database_config_1.default.questionPool.findMany({
                where,
                skip: pagination.skip,
                take: pagination.limit,
                include: {
                    department: { select: { id: true, name: true } },
                    _count: { select: { questions: true } },
                },
                orderBy: { name: "asc" },
            }),
            database_config_1.default.questionPool.count({ where }),
        ]);
        return { pools, total };
    }
    async getById(id) {
        const pool = await database_config_1.default.questionPool.findUnique({
            where: { id },
            include: {
                department: { select: { id: true, name: true, institutionId: true } },
                _count: { select: { questions: true } },
            },
        });
        if (!pool)
            throw new app_error_1.NotFoundError("Question pool not found");
        return pool;
    }
    async update(id, data) {
        const pool = await database_config_1.default.questionPool.findUnique({ where: { id } });
        if (!pool)
            throw new app_error_1.NotFoundError("Question pool not found");
        return database_config_1.default.questionPool.update({ where: { id }, data });
    }
    async delete(id) {
        const pool = await database_config_1.default.questionPool.findUnique({ where: { id } });
        if (!pool)
            throw new app_error_1.NotFoundError("Question pool not found");
        await database_config_1.default.questionPool.delete({ where: { id } });
    }
}
exports.QuestionPoolService = QuestionPoolService;
exports.questionPoolService = new QuestionPoolService();
//# sourceMappingURL=question-pool.service.js.map