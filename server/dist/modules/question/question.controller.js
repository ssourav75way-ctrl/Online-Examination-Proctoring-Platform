"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionController = exports.QuestionController = void 0;
const question_service_1 = require("./question.service");
const response_util_1 = require("../../utils/response.util");
const pagination_util_1 = require("../../utils/pagination.util");
class QuestionController {
    async create(req, res, next) {
        try {
            const departmentIds = req.scopedUser?.departmentIds || [];
            const question = await question_service_1.questionService.create(req.body, req.user.userId, departmentIds);
            (0, response_util_1.sendCreated)(res, question);
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const question = await question_service_1.questionService.update(req.params.id, req.body, req.user.userId);
            (0, response_util_1.sendSuccess)(res, question, "Question updated (new version created)");
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const question = await question_service_1.questionService.getById(req.params.id);
            (0, response_util_1.sendSuccess)(res, question);
        }
        catch (error) {
            next(error);
        }
    }
    async getByPool(req, res, next) {
        try {
            const pagination = (0, pagination_util_1.parsePagination)(req.query);
            const filters = {
                topic: req.query.topic,
                type: req.query.type,
                difficulty: req.query.difficulty
                    ? parseInt(req.query.difficulty, 10)
                    : undefined,
            };
            const { questions, total } = await question_service_1.questionService.getByPool(req.params.poolId, pagination, filters);
            (0, response_util_1.sendSuccess)(res, questions, "Questions retrieved", 200, {
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
    async getVersionHistory(req, res, next) {
        try {
            const versions = await question_service_1.questionService.getVersionHistory(req.params.id);
            (0, response_util_1.sendSuccess)(res, versions);
        }
        catch (error) {
            next(error);
        }
    }
    async deactivate(req, res, next) {
        try {
            await question_service_1.questionService.deactivate(req.params.id);
            (0, response_util_1.sendSuccess)(res, null, "Question deactivated");
        }
        catch (error) {
            next(error);
        }
    }
    async rollback(req, res, next) {
        try {
            const question = await question_service_1.questionService.rollbackVersion(req.params.id, req.params.versionId, req.user.userId);
            (0, response_util_1.sendSuccess)(res, question, "Question rolled back successfully");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.QuestionController = QuestionController;
exports.questionController = new QuestionController();
//# sourceMappingURL=question.controller.js.map