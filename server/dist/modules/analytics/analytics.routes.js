"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("./analytics.controller");
const middlewares_1 = require("../../middlewares");
const router = (0, express_1.Router)();
router.get("/exams/:examId", middlewares_1.authenticate, (req, res, next) => analytics_controller_1.analyticsController.getExamAnalytics(req, res, next));
router.get("/exams/:examId/integrity", middlewares_1.authenticate, (req, res, next) => analytics_controller_1.analyticsController.getIntegrityReport(req, res, next));
router.get("/questions/:examQuestionId/difficulty", middlewares_1.authenticate, (req, res, next) => analytics_controller_1.analyticsController.getQuestionDifficulty(req, res, next));
router.get("/questions/:examQuestionId/distractors", middlewares_1.authenticate, (req, res, next) => analytics_controller_1.analyticsController.getDistractorAnalysis(req, res, next));
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map