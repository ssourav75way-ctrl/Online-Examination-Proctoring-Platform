"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.examController = exports.ExamController = void 0;
const exam_service_1 = require("./exam.service");
const response_util_1 = require("../../utils/response.util");
const pagination_util_1 = require("../../utils/pagination.util");
class ExamController {
    async create(req, res, next) {
        try {
            const exam = await exam_service_1.examService.create({
                ...req.body,
                institutionId: req.params.institutionId,
            }, req.user.userId);
            (0, response_util_1.sendCreated)(res, exam);
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const exam = await exam_service_1.examService.getById(req.params.id);
            (0, response_util_1.sendSuccess)(res, exam);
        }
        catch (error) {
            next(error);
        }
    }
    async getByInstitution(req, res, next) {
        try {
            const pagination = (0, pagination_util_1.parsePagination)(req.query);
            const status = req.query.status;
            const { exams, total } = await exam_service_1.examService.getByInstitution(req.params.institutionId, pagination, status);
            (0, response_util_1.sendSuccess)(res, exams, "Exams retrieved", 200, {
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
    async schedule(req, res, next) {
        try {
            const exam = await exam_service_1.examService.schedule(req.params.id);
            (0, response_util_1.sendSuccess)(res, exam, "Exam scheduled");
        }
        catch (error) {
            next(error);
        }
    }
    async enrollCandidate(req, res, next) {
        try {
            const enrollment = await exam_service_1.examService.enrollCandidate(req.params.id, req.body);
            (0, response_util_1.sendCreated)(res, enrollment, "Candidate enrolled");
        }
        catch (error) {
            next(error);
        }
    }
    async reschedule(req, res, next) {
        try {
            const result = await exam_service_1.examService.reschedule(req.params.id, req.body.scheduledStartTime, req.body.scheduledEndTime);
            (0, response_util_1.sendSuccess)(res, result, result.conflicts.length > 0
                ? `Rescheduled with ${result.conflicts.length} conflict(s) detected`
                : "Rescheduled successfully");
        }
        catch (error) {
            next(error);
        }
    }
    async getEnrollments(req, res, next) {
        try {
            const pagination = (0, pagination_util_1.parsePagination)(req.query);
            const { enrollments, total } = await exam_service_1.examService.getEnrollments(req.params.id, pagination);
            (0, response_util_1.sendSuccess)(res, enrollments, "Enrollments retrieved", 200, {
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
    async cancel(req, res, next) {
        try {
            const exam = await exam_service_1.examService.cancelExam(req.params.id);
            (0, response_util_1.sendSuccess)(res, exam, "Exam cancelled");
        }
        catch (error) {
            next(error);
        }
    }
    async getRetakeQuestions(req, res, next) {
        try {
            const questionIds = await exam_service_1.examService.getRetakeQuestionSet(req.params.id, req.params.candidateId);
            (0, response_util_1.sendSuccess)(res, {
                availableQuestionIds: questionIds,
                count: questionIds.length,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const exam = await exam_service_1.examService.update(req.params.id, req.body);
            (0, response_util_1.sendSuccess)(res, exam, "Exam updated");
        }
        catch (error) {
            next(error);
        }
    }
    async getMyEnrollment(req, res, next) {
        try {
            const enrollment = await exam_service_1.examService.getMyEnrollment(req.params.id, req.user.userId);
            (0, response_util_1.sendSuccess)(res, enrollment);
        }
        catch (error) {
            next(error);
        }
    }
    async addQuestions(req, res, next) {
        try {
            const result = await exam_service_1.examService.addQuestionsToExam(req.params.id, req.body.questionIds);
            (0, response_util_1.sendSuccess)(res, result, `${result.added} question(s) added to exam`);
        }
        catch (error) {
            next(error);
        }
    }
    async getExamQuestions(req, res, next) {
        try {
            const questions = await exam_service_1.examService.getExamQuestions(req.params.id);
            (0, response_util_1.sendSuccess)(res, questions);
        }
        catch (error) {
            next(error);
        }
    }
    async removeQuestion(req, res, next) {
        try {
            await exam_service_1.examService.removeQuestionFromExam(req.params.id, req.params.examQuestionId);
            (0, response_util_1.sendSuccess)(res, null, "Question removed from exam");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ExamController = ExamController;
exports.examController = new ExamController();
//# sourceMappingURL=exam.controller.js.map