"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resultController = exports.ResultController = void 0;
const result_service_1 = require("./result.service");
const response_util_1 = require("../../utils/response.util");
const pagination_util_1 = require("../../utils/pagination.util");
class ResultController {
    async generateResults(req, res, next) {
        try {
            const results = await result_service_1.resultService.generateResults(req.params.examId);
            (0, response_util_1.sendSuccess)(res, results, `${results.length} results generated`);
        }
        catch (error) {
            next(error);
        }
    }
    async publishResults(req, res, next) {
        try {
            await result_service_1.resultService.publishResults(req.params.examId);
            (0, response_util_1.sendSuccess)(res, null, "Results published");
        }
        catch (error) {
            next(error);
        }
    }
    async getCandidateResult(req, res, next) {
        try {
            const result = await result_service_1.resultService.getCandidateResult(req.params.enrollmentId, req.user.userId);
            (0, response_util_1.sendSuccess)(res, result);
        }
        catch (error) {
            next(error);
        }
    }
    async getMyResults(req, res, next) {
        try {
            const results = await result_service_1.resultService.getMyResults(req.user.userId);
            (0, response_util_1.sendSuccess)(res, results, "Results history retrieved");
        }
        catch (error) {
            next(error);
        }
    }
    async getExamResults(req, res, next) {
        try {
            const pagination = (0, pagination_util_1.parsePagination)(req.query);
            const { results, total } = await result_service_1.resultService.getExamResults(req.params.examId, pagination);
            (0, response_util_1.sendSuccess)(res, results, "Results retrieved", 200, {
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
    async fileReEvaluation(req, res, next) {
        try {
            const request = await result_service_1.resultService.fileReEvaluation(req.params.resultId, req.body.candidateAnswerId, req.body.justification, req.user.userId);
            (0, response_util_1.sendCreated)(res, request, "Re-evaluation request filed");
        }
        catch (error) {
            next(error);
        }
    }
    async processReEvaluation(req, res, next) {
        try {
            const result = await result_service_1.resultService.processReEvaluation(req.params.requestId, req.user.userId, req.body.status, req.body.newScore, req.body.reviewNotes);
            (0, response_util_1.sendSuccess)(res, result, "Re-evaluation processed");
        }
        catch (error) {
            next(error);
        }
    }
    async getReEvaluationRequests(req, res, next) {
        try {
            const pagination = (0, pagination_util_1.parsePagination)(req.query);
            const { requests, total } = await result_service_1.resultService.getReEvaluationRequests(req.params.examId, pagination);
            (0, response_util_1.sendSuccess)(res, requests, "Requests retrieved", 200, {
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
}
exports.ResultController = ResultController;
exports.resultController = new ResultController();
//# sourceMappingURL=result.controller.js.map