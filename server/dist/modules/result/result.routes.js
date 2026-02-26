"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const result_controller_1 = require("./result.controller");
const middlewares_1 = require("../../middlewares");
const router = (0, express_1.Router)();
router.post("/exams/:examId/generate", middlewares_1.authenticate, (req, res, next) => result_controller_1.resultController.generateResults(req, res, next));
router.patch("/exams/:examId/publish", middlewares_1.authenticate, (req, res, next) => result_controller_1.resultController.publishResults(req, res, next));
router.get("/exams/:examId", middlewares_1.authenticate, (req, res, next) => result_controller_1.resultController.getExamResults(req, res, next));
router.get("/exams/:examId/re-evaluations", middlewares_1.authenticate, (req, res, next) => result_controller_1.resultController.getReEvaluationRequests(req, res, next));
router.patch("/re-evaluations/:requestId", middlewares_1.authenticate, (req, res, next) => result_controller_1.resultController.processReEvaluation(req, res, next));
router.get("/my-results", middlewares_1.authenticate, (req, res, next) => result_controller_1.resultController.getMyResults(req, res, next));
router.get("/enrollments/:enrollmentId", middlewares_1.authenticate, (req, res, next) => result_controller_1.resultController.getCandidateResult(req, res, next));
router.post("/:resultId/re-evaluate", middlewares_1.authenticate, (req, res, next) => result_controller_1.resultController.fileReEvaluation(req, res, next));
exports.default = router;
//# sourceMappingURL=result.routes.js.map