"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resultService = exports.ResultService = void 0;
const database_config_1 = __importDefault(require("../../config/database.config"));
const app_error_1 = require("../../utils/app-error");
const client_1 = require("@prisma/client");
const date_util_1 = require("../../utils/date.util");
const grading_service_1 = require("../grading/grading.service");
class ResultService {
    async generateResults(examId) {
        const enrollments = await database_config_1.default.examEnrollment.findMany({
            where: { examId, status: "COMPLETED" },
            include: {
                session: {
                    include: {
                        answers: { select: { finalScore: true } },
                        flags: { select: { severity: true } },
                        violations: true,
                    },
                },
            },
        });
        const results = [];
        for (const enrollment of enrollments) {
            if (!enrollment.session)
                continue;
            await grading_service_1.gradingService.autoGradeSession(enrollment.session.id);
            const freshSession = await database_config_1.default.examSession.findUnique({
                where: { id: enrollment.session.id },
                include: { answers: { select: { finalScore: true } } },
            });
            if (!freshSession)
                continue;
            const existing = await database_config_1.default.examResult.findUnique({
                where: { enrollmentId: enrollment.id },
            });
            if (existing)
                continue;
            const totalScore = freshSession.answers.reduce((sum, a) => sum + (a.finalScore || 0), 0);
            const exam = await database_config_1.default.exam.findUnique({ where: { id: examId } });
            if (!exam)
                continue;
            const percentage = exam.totalMarks > 0 ? (totalScore / exam.totalMarks) * 100 : 0;
            const passed = totalScore >= exam.passingScore;
            const proctorFlagCount = enrollment.session.flags.length;
            const proctorFlagSeveritySum = enrollment.session.flags.reduce((s, f) => s + f.severity, 0);
            const timingAnomalyCount = enrollment.session.violations.filter((v) => v.type === "TAB_SWITCH").length;
            const baseIntegrity = 100;
            const flagPenalty = proctorFlagSeveritySum * 5;
            const violationPenalty = timingAnomalyCount * 10;
            const integrityScore = Math.max(0, baseIntegrity - flagPenalty - violationPenalty);
            const result = await database_config_1.default.examResult.create({
                data: {
                    enrollmentId: enrollment.id,
                    totalScore,
                    maxScore: exam.totalMarks,
                    percentage: Math.round(percentage * 100) / 100,
                    passed,
                    integrityScore,
                    timingAnomalyCount,
                    status: client_1.ResultStatus.PENDING_REVIEW,
                },
            });
            results.push(result);
        }
        return results;
    }
    async publishResults(examId) {
        const exam = await database_config_1.default.exam.findUnique({ where: { id: examId } });
        if (!exam)
            throw new app_error_1.NotFoundError("Exam not found");
        await database_config_1.default.$transaction(async (tx) => {
            await tx.examResult.updateMany({
                where: {
                    enrollment: { examId },
                    status: client_1.ResultStatus.PENDING_REVIEW,
                },
                data: {
                    status: client_1.ResultStatus.PUBLISHED,
                    publishedAt: new Date(),
                },
            });
            await tx.exam.update({
                where: { id: examId },
                data: { resultStatus: client_1.ResultStatus.PUBLISHED },
            });
            const enrollments = await tx.examEnrollment.findMany({
                where: { examId },
                select: { candidateId: true },
            });
            await tx.notification.createMany({
                data: enrollments.map((e) => ({
                    recipientId: e.candidateId,
                    type: "RESULT_PUBLISHED",
                    title: "Exam Results Published",
                    message: `Results for "${exam.title}" are now available.`,
                    metadata: {
                        examId,
                        examTitle: exam.title,
                    },
                })),
            });
        });
    }
    async getCandidateResult(enrollmentId, candidateId) {
        const result = await database_config_1.default.examResult.findUnique({
            where: { enrollmentId },
            include: {
                enrollment: {
                    include: {
                        exam: {
                            select: {
                                id: true,
                                title: true,
                                totalMarks: true,
                                passingScore: true,
                                challengeWindowDays: true,
                            },
                        },
                        candidate: { select: { id: true } },
                        session: {
                            include: {
                                answers: {
                                    include: {
                                        reEvalRequests: true,
                                        examQuestion: {
                                            include: {
                                                question: {
                                                    select: {
                                                        type: true,
                                                        topic: true,
                                                    },
                                                },
                                                questionVersion: {
                                                    select: {
                                                        id: true,
                                                        content: true,
                                                        options: true,
                                                        marks: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!result)
            throw new app_error_1.NotFoundError("Result not found");
        if (result.enrollment.candidate.id !== candidateId) {
            throw new app_error_1.NotFoundError("Result not found");
        }
        if (result.status !== client_1.ResultStatus.PUBLISHED) {
            throw new app_error_1.BadRequestError("Results not yet published");
        }
        const canChallenge = result.publishedAt
            ? (0, date_util_1.isWithinChallengeWindow)(result.publishedAt, result.enrollment.exam.challengeWindowDays)
            : false;
        const answers = result.enrollment.session?.answers.map((answer) => {
            const qv = answer.examQuestion.questionVersion;
            const q = answer.examQuestion.question;
            const options = Array.isArray(qv.options)
                ? qv.options.map((opt) => ({
                    id: opt.id,
                    text: opt.text,
                }))
                : qv.options;
            return {
                ...answer,
                examQuestion: {
                    ...answer.examQuestion,
                    questionVersion: {
                        ...qv,
                        type: q.type,
                        topic: q.topic,
                        options,
                    },
                },
            };
        }) || [];
        return {
            ...result,
            canChallenge,
            answers,
        };
    }
    async getMyResults(candidateId) {
        const results = await database_config_1.default.examResult.findMany({
            where: {
                enrollment: { candidateId },
                status: client_1.ResultStatus.PUBLISHED,
            },
            include: {
                enrollment: {
                    include: {
                        exam: {
                            select: {
                                id: true,
                                title: true,
                                totalMarks: true,
                                passingScore: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return results;
    }
    async fileReEvaluation(resultId, candidateAnswerId, justification, candidateId) {
        const result = await database_config_1.default.examResult.findUnique({
            where: { id: resultId },
            include: {
                enrollment: {
                    include: { exam: { select: { challengeWindowDays: true } } },
                },
            },
        });
        if (!result)
            throw new app_error_1.NotFoundError("Result not found");
        if (result.status !== client_1.ResultStatus.PUBLISHED) {
            throw new app_error_1.BadRequestError("Results not yet published");
        }
        if (!result.publishedAt ||
            !(0, date_util_1.isWithinChallengeWindow)(result.publishedAt, result.enrollment.exam.challengeWindowDays)) {
            throw new app_error_1.BadRequestError("Challenge window has expired");
        }
        const answer = await database_config_1.default.candidateAnswer.findUnique({
            where: { id: candidateAnswerId },
        });
        if (!answer)
            throw new app_error_1.NotFoundError("Answer not found");
        return database_config_1.default.reEvaluationRequest.create({
            data: {
                resultId,
                candidateAnswerId,
                justification,
                previousScore: answer.finalScore,
            },
        });
    }
    async processReEvaluation(requestId, reviewedById, status, newScore, reviewNotes) {
        const request = await database_config_1.default.reEvaluationRequest.findUnique({
            where: { id: requestId },
            include: { candidateAnswer: true, result: true },
        });
        if (!request)
            throw new app_error_1.NotFoundError("Re-evaluation request not found");
        const updateData = {
            status,
            reviewedById,
            reviewNotes,
            reviewedAt: new Date(),
        };
        if (status === client_1.ReEvalStatus.APPROVED && newScore !== undefined) {
            updateData.newScore = newScore;
            await database_config_1.default.candidateAnswer.update({
                where: { id: request.candidateAnswerId },
                data: { manualScore: newScore, finalScore: newScore },
            });
            const allAnswers = await database_config_1.default.candidateAnswer.findMany({
                where: { sessionId: request.candidateAnswer.sessionId },
            });
            const newTotalScore = allAnswers.reduce((sum, a) => sum + (a.finalScore || 0), 0);
            await database_config_1.default.examResult.update({
                where: { id: request.resultId },
                data: {
                    totalScore: newTotalScore,
                    percentage: request.result.maxScore > 0
                        ? (newTotalScore / request.result.maxScore) * 100
                        : 0,
                },
            });
        }
        const enrollment = await database_config_1.default.examEnrollment.findFirst({
            where: { id: request.result.enrollmentId },
        });
        if (enrollment) {
            await database_config_1.default.notification.create({
                data: {
                    recipientId: enrollment.candidateId,
                    type: "RE_EVALUATION_UPDATE",
                    title: "Re-evaluation Result",
                    message: `Your re-evaluation request has been ${status.toLowerCase()}.`,
                },
            });
        }
        return database_config_1.default.reEvaluationRequest.update({
            where: { id: requestId },
            data: updateData,
        });
    }
    async getExamResults(examId, pagination) {
        const [results, total] = await Promise.all([
            database_config_1.default.examResult.findMany({
                where: { enrollment: { examId } },
                skip: pagination.skip,
                take: pagination.limit,
                include: {
                    enrollment: {
                        include: {
                            candidate: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { totalScore: "desc" },
            }),
            database_config_1.default.examResult.count({ where: { enrollment: { examId } } }),
        ]);
        return { results, total };
    }
    async getReEvaluationRequests(examId, pagination) {
        const [requests, total] = await Promise.all([
            database_config_1.default.reEvaluationRequest.findMany({
                where: { result: { enrollment: { examId } } },
                skip: pagination.skip,
                take: pagination.limit,
                include: {
                    result: {
                        include: {
                            enrollment: {
                                include: {
                                    candidate: {
                                        select: { id: true, firstName: true, lastName: true },
                                    },
                                },
                            },
                        },
                    },
                    reviewedBy: { select: { id: true, firstName: true, lastName: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
            database_config_1.default.reEvaluationRequest.count({
                where: { result: { enrollment: { examId } } },
            }),
        ]);
        return { requests, total };
    }
}
exports.ResultService = ResultService;
exports.resultService = new ResultService();
//# sourceMappingURL=result.service.js.map