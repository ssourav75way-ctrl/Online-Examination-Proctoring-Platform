"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const exam_session_controller_1 = require("./exam-session.controller");
const middlewares_1 = require("../../middlewares");
const router = (0, express_1.Router)();
router.post("/start/:enrollmentId", middlewares_1.authenticate, (req, res, next) => exam_session_controller_1.examSessionController.start(req, res, next));
router.post("/:sessionId/submit", middlewares_1.authenticate, (req, res, next) => exam_session_controller_1.examSessionController.submitAnswer(req, res, next));
router.get("/:sessionId/reconnect", middlewares_1.authenticate, (req, res, next) => exam_session_controller_1.examSessionController.reconnect(req, res, next));
router.post("/:sessionId/violation", middlewares_1.authenticate, (req, res, next) => exam_session_controller_1.examSessionController.reportViolation(req, res, next));
router.post("/:sessionId/finish", middlewares_1.authenticate, (req, res, next) => exam_session_controller_1.examSessionController.finish(req, res, next));
router.get("/:sessionId/status", middlewares_1.authenticate, (req, res, next) => exam_session_controller_1.examSessionController.getStatus(req, res, next));
router.get("/:sessionId/questions/:index", middlewares_1.authenticate, (req, res, next) => exam_session_controller_1.examSessionController.getQuestion(req, res, next));
router.get("/:sessionId/markers", middlewares_1.authenticate, (req, res, next) => exam_session_controller_1.examSessionController.getMarkers(req, res, next));
router.patch("/:sessionId/unlock", middlewares_1.authenticate, (req, res, next) => exam_session_controller_1.examSessionController.proctorUnlock(req, res, next));
router.patch("/:sessionId/extend-time", middlewares_1.authenticate, (req, res, next) => exam_session_controller_1.examSessionController.extendTime(req, res, next));
exports.default = router;
//# sourceMappingURL=exam-session.routes.js.map