"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionPoolController = exports.QuestionPoolController = void 0;
const question_pool_service_1 = require("./question-pool.service");
const response_util_1 = require("../../utils/response.util");
const pagination_util_1 = require("../../utils/pagination.util");
class QuestionPoolController {
    async create(req, res, next) {
        try {
            const departmentIds = req.scopedUser?.departmentIds || [];
            const pool = await question_pool_service_1.questionPoolService.create(req.body, departmentIds);
            (0, response_util_1.sendCreated)(res, pool);
        }
        catch (error) {
            next(error);
        }
    }
    async getByDepartment(req, res, next) {
        try {
            const pagination = (0, pagination_util_1.parsePagination)(req.query);
            const { pools, total } = await question_pool_service_1.questionPoolService.getByDepartment(req.params.departmentId, pagination);
            (0, response_util_1.sendSuccess)(res, pools, "Pools retrieved", 200, {
                page: pagination.page,
                limit: pagination.limit,
                total,
                totalPages: (0, pagination_util_1.calculateTotalPages)(total, pagination.limit),
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAccessiblePools(req, res, next) {
        try {
            const pagination = (0, pagination_util_1.parsePagination)(req.query);
            const institutionId = req.scopedUser.institutionId;
            const departmentIds = req.scopedUser.departmentIds;
            const { pools, total } = await question_pool_service_1.questionPoolService.getAccessiblePools(institutionId, departmentIds, pagination);
            (0, response_util_1.sendSuccess)(res, pools, "Accessible pools retrieved", 200, {
                page: pagination.page,
                limit: pagination.limit,
                total,
                totalPages: (0, pagination_util_1.calculateTotalPages)(total, pagination.limit),
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const pool = await question_pool_service_1.questionPoolService.getById(req.params.id);
            (0, response_util_1.sendSuccess)(res, pool);
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const pool = await question_pool_service_1.questionPoolService.update(req.params.id, req.body);
            (0, response_util_1.sendSuccess)(res, pool, "Pool updated");
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            await question_pool_service_1.questionPoolService.delete(req.params.id);
            (0, response_util_1.sendNoContent)(res);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.QuestionPoolController = QuestionPoolController;
exports.questionPoolController = new QuestionPoolController();
//# sourceMappingURL=question-pool.controller.js.map