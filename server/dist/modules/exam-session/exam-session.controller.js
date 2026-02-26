"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.examSessionController = exports.ExamSessionController = void 0;
const exam_session_service_1 = require("./exam-session.service");
const response_util_1 = require("../../utils/response.util");
class ExamSessionController {
    async start(req, res, next) {
        try {
            const result = await exam_session_service_1.examSessionService.startSession(req.params.enrollmentId, req.ip || "unknown", req.headers["user-agent"] || "unknown");
            (0, response_util_1.sendCreated)(res, result, "Exam session started");
        }
        catch (error) {
            next(error);
        }
    }
    async submitAnswer(req, res, next) {
        try {
            const result = await exam_session_service_1.examSessionService.submitAnswer(req.params.sessionId, req.body);
            (0, response_util_1.sendSuccess)(res, result, "Answer submitted");
        }
        catch (error) {
            next(error);
        }
    }
    async reconnect(req, res, next) {
        try {
            const result = await exam_session_service_1.examSessionService.reconnect(req.params.sessionId);
            (0, response_util_1.sendSuccess)(res, result, "Reconnected successfully");
        }
        catch (error) {
            next(error);
        }
    }
    async reportViolation(req, res, next) {
        try {
            const result = await exam_session_service_1.examSessionService.reportViolation(req.params.sessionId, req.body.type, req.body.metadata);
            (0, response_util_1.sendSuccess)(res, result);
        }
        catch (error) {
            next(error);
        }
    }
    async proctorUnlock(req, res, next) {
        try {
            const result = await exam_session_service_1.examSessionService.proctorUnlock(req.params.sessionId);
            (0, response_util_1.sendSuccess)(res, result);
        }
        catch (error) {
            next(error);
        }
    }
    async extendTime(req, res, next) {
        try {
            const result = await exam_session_service_1.examSessionService.extendTime(req.params.sessionId, req.body.additionalMinutes);
            (0, response_util_1.sendSuccess)(res, result, "Time extended");
        }
        catch (error) {
            next(error);
        }
    }
    async finish(req, res, next) {
        try {
            const session = await exam_session_service_1.examSessionService.finishSession(req.params.sessionId);
            (0, response_util_1.sendSuccess)(res, session, "Exam finished");
        }
        catch (error) {
            next(error);
        }
    }
    async getQuestion(req, res, next) {
        try {
            const result = await exam_session_service_1.examSessionService.getQuestionByIndex(req.params.sessionId, parseInt(req.params.index));
            (0, response_util_1.sendSuccess)(res, result);
        }
        catch (error) {
            next(error);
        }
    }
    async getMarkers(req, res, next) {
        try {
            const result = await exam_session_service_1.examSessionService.getSessionQuestionMarkers(req.params.sessionId);
            (0, response_util_1.sendSuccess)(res, result);
        }
        catch (error) {
            next(error);
        }
    }
    async getStatus(req, res, next) {
        try {
            const result = await exam_session_service_1.examSessionService.getSessionStatus(req.params.sessionId);
            (0, response_util_1.sendSuccess)(res, result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ExamSessionController = ExamSessionController;
exports.examSessionController = new ExamSessionController();
//# sourceMappingURL=exam-session.controller.js.map