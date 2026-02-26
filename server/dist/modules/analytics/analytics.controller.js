"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsController = exports.AnalyticsController = void 0;
const analytics_service_1 = require("./analytics.service");
const response_util_1 = require("../../utils/response.util");
class AnalyticsController {
    async getExamAnalytics(req, res, next) {
        try {
            const analytics = await analytics_service_1.analyticsService.getExamAnalytics(req.params.examId);
            (0, response_util_1.sendSuccess)(res, analytics, "Analytics retrieved");
        }
        catch (error) {
            next(error);
        }
    }
    async getQuestionDifficulty(req, res, next) {
        try {
            const index = await analytics_service_1.analyticsService.getQuestionDifficultyIndex(req.params.examQuestionId);
            (0, response_util_1.sendSuccess)(res, { difficultyIndex: index });
        }
        catch (error) {
            next(error);
        }
    }
    async getDistractorAnalysis(req, res, next) {
        try {
            const analysis = await analytics_service_1.analyticsService.getDistractorAnalysis(req.params.examQuestionId);
            (0, response_util_1.sendSuccess)(res, analysis);
        }
        catch (error) {
            next(error);
        }
    }
    async getIntegrityReport(req, res, next) {
        try {
            const report = await analytics_service_1.analyticsService.getIntegrityReport(req.params.examId);
            (0, response_util_1.sendSuccess)(res, report, "Integrity report generated");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AnalyticsController = AnalyticsController;
exports.analyticsController = new AnalyticsController();
//# sourceMappingURL=analytics.controller.js.map