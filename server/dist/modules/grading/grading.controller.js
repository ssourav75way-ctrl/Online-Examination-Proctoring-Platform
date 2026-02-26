"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gradingController = exports.GradingController = void 0;
const grading_service_1 = require("./grading.service");
const response_util_1 = require("../../utils/response.util");
class GradingController {
    async autoGradeSession(req, res, next) {
        try {
            const results = await grading_service_1.gradingService.autoGradeSession(req.params.sessionId);
            (0, response_util_1.sendSuccess)(res, results, "Session auto-graded");
        }
        catch (error) {
            next(error);
        }
    }
    async overrideScore(req, res, next) {
        try {
            const answer = await grading_service_1.gradingService.overrideScore(req.params.answerId, req.body.score, req.user.userId);
            (0, response_util_1.sendSuccess)(res, answer, "Score overridden");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.GradingController = GradingController;
exports.gradingController = new GradingController();
//# sourceMappingURL=grading.controller.js.map