"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.examSessionService = exports.ExamSessionService = void 0;
const database_config_1 = __importDefault(require("../../config/database.config"));
const app_error_1 = require("../../utils/app-error");
const client_1 = require("@prisma/client");
const timer_service_1 = require("../../services/timer.service");
const adaptive_engine_service_1 = require("../../services/adaptive-engine.service");
const config_1 = require("../../config");
const date_util_1 = require("../../utils/date.util");
class ExamSessionService {
    async startSession(enrollmentId, ipAddress, userAgent) {
        const enrollment = await database_config_1.default.examEnrollment.findUnique({
            where: { id: enrollmentId },
            include: { exam: true },
        });
        if (!enrollment)
            throw new app_error_1.NotFoundError("Enrollment not found");
        if (enrollment.status !== client_1.EnrollmentStatus.ENROLLED) {
            throw new app_error_1.BadRequestError("Exam already started or completed");
        }
        const now = new Date();
        if (enrollment.exam.status !== client_1.ExamStatus.SCHEDULED &&
            enrollment.exam.status !== client_1.ExamStatus.IN_PROGRESS) {
            throw new app_error_1.BadRequestError("Exam is not available");
        }
        if (now < enrollment.exam.scheduledStartTime) {
            throw new app_error_1.BadRequestError("Exam has not started yet");
        }
        if (now > enrollment.exam.scheduledEndTime) {
            throw new app_error_1.BadRequestError("Exam window has ended");
        }
        const durationMinutes = enrollment.adjustedDurationMinutes || enrollment.exam.durationMinutes;
        const serverDeadline = timer_service_1.timerService.calculateDeadline(now, durationMinutes);
        const session = await database_config_1.default.$transaction(async (tx) => {
            await tx.examEnrollment.update({
                where: { id: enrollmentId },
                data: { status: client_1.EnrollmentStatus.IN_PROGRESS },
            });
            if (enrollment.exam.status === client_1.ExamStatus.SCHEDULED) {
                await tx.exam.update({
                    where: { id: enrollment.examId },
                    data: { status: client_1.ExamStatus.IN_PROGRESS },
                });
            }
            return tx.examSession.create({
                data: {
                    enrollmentId,
                    serverDeadline,
                    ipAddress,
                    userAgent,
                },
            });
        });
        const firstQuestion = enrollment.exam.isAdaptive
            ? await adaptive_engine_service_1.adaptiveEngineService.getNextQuestion(session.id, enrollment.examId, this.getInitialAdaptiveState())
            : await adaptive_engine_service_1.adaptiveEngineService.getNextQuestionSequential(session.id, enrollment.examId, 0);
        const timerState = timer_service_1.timerService.getTimerState(serverDeadline, 0, null);
        return {
            session,
            timerState,
            currentQuestion: firstQuestion,
        };
    }
    async submitAnswer(sessionId, input) {
        const session = await database_config_1.default.examSession.findUnique({
            where: { id: sessionId },
            include: {
                enrollment: { include: { exam: true } },
            },
        });
        if (!session)
            throw new app_error_1.NotFoundError("Session not found");
        if (session.finishedAt)
            throw new app_error_1.BadRequestError("Exam already finished");
        if (session.isLocked)
            throw new app_error_1.BadRequestError("Exam is locked  awaiting proctor approval");
        const timerState = timer_service_1.timerService.getTimerState(session.serverDeadline, session.totalPausedSeconds, session.pausedAt);
        if (timerState.isExpired) {
            await this.finishSession(sessionId);
            throw new app_error_1.BadRequestError("Time has expired");
        }
        const existing = await database_config_1.default.candidateAnswer.findUnique({
            where: {
                sessionId_examQuestionId: {
                    sessionId,
                    examQuestionId: input.examQuestionId,
                },
            },
        });
        if (existing) {
            throw new app_error_1.BadRequestError("Question already answered");
        }
        const examQuestion = await database_config_1.default.examQuestion.findUnique({
            where: { id: input.examQuestionId },
            include: {
                question: true,
                questionVersion: true,
            },
        });
        if (!examQuestion)
            throw new app_error_1.NotFoundError("Exam question not found");
        const lastAnswer = await database_config_1.default.candidateAnswer.findFirst({
            where: { sessionId },
            orderBy: { answeredAt: "desc" },
        });
        const startRef = lastAnswer ? lastAnswer.answeredAt : session.startedAt;
        const timeTakenSeconds = Math.floor((Date.now() - startRef.getTime()) / 1000);
        const answer = await database_config_1.default.candidateAnswer.create({
            data: {
                sessionId,
                examQuestionId: input.examQuestionId,
                answerContent: input.answerContent,
                codeSubmission: input.codeSubmission,
                timeTakenSeconds,
            },
        });
        const newQuestionsAnswered = session.questionsAnswered + 1;
        const newCorrectAnswers = session.correctAnswers;
        const newAccuracy = newQuestionsAnswered > 0 ? newCorrectAnswers / newQuestionsAnswered : 0;
        await database_config_1.default.examSession.update({
            where: { id: sessionId },
            data: {
                currentQuestionIndex: session.currentQuestionIndex + 1,
                questionsAnswered: newQuestionsAnswered,
                runningAccuracy: newAccuracy,
            },
        });
        let nextQuestion = null;
        if (session.enrollment.exam.isAdaptive) {
            const adaptiveState = {
                currentDifficulty: examQuestion.questionVersion.difficulty,
                topicAccuracyMap: {},
                totalDifficulty: 0,
                questionsServed: newQuestionsAnswered,
                runningAccuracy: newAccuracy,
            };
            nextQuestion = await adaptive_engine_service_1.adaptiveEngineService.getNextQuestion(sessionId, session.enrollment.examId, adaptiveState);
        }
        else {
            nextQuestion = await adaptive_engine_service_1.adaptiveEngineService.getNextQuestionSequential(sessionId, session.enrollment.examId, session.currentQuestionIndex + 1);
        }
        return {
            answer,
            nextQuestion,
            timerState: timer_service_1.timerService.getTimerState(session.serverDeadline, session.totalPausedSeconds, session.pausedAt),
            isLastQuestion: nextQuestion === null,
        };
    }
    async reconnect(sessionId) {
        const session = await database_config_1.default.examSession.findUnique({
            where: { id: sessionId },
            include: {
                enrollment: { include: { exam: true } },
            },
        });
        if (!session)
            throw new app_error_1.NotFoundError("Session not found");
        if (session.finishedAt)
            throw new app_error_1.BadRequestError("Exam already finished");
        const timerState = timer_service_1.timerService.getTimerState(session.serverDeadline, session.totalPausedSeconds, session.pausedAt);
        if (timerState.isExpired) {
            await this.finishSession(sessionId);
            throw new app_error_1.BadRequestError("Time has expired");
        }
        let currentQuestion = null;
        if (session.enrollment.exam.isAdaptive) {
            const adaptiveState = {
                currentDifficulty: 5,
                topicAccuracyMap: {},
                totalDifficulty: 0,
                questionsServed: session.questionsAnswered,
                runningAccuracy: session.runningAccuracy,
            };
            currentQuestion = await adaptive_engine_service_1.adaptiveEngineService.getNextQuestion(sessionId, session.enrollment.examId, adaptiveState);
        }
        else {
            currentQuestion = await adaptive_engine_service_1.adaptiveEngineService.getNextQuestionSequential(sessionId, session.enrollment.examId, session.currentQuestionIndex);
        }
        return {
            session: {
                id: session.id,
                isLocked: session.isLocked,
                lockReason: session.lockReason,
            },
            timerState,
            currentQuestion,
            questionsAnswered: session.questionsAnswered,
        };
    }
    async reportViolation(sessionId, type, metadata) {
        const session = await database_config_1.default.examSession.findUnique({
            where: { id: sessionId },
        });
        if (!session)
            throw new app_error_1.NotFoundError("Session not found");
        if (session.finishedAt)
            return;
        await database_config_1.default.violationLog.create({
            data: {
                sessionId,
                type,
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
            },
        });
        if (type === "TAB_SWITCH" || type === "FOCUS_LOSS") {
            const newTabSwitchCount = session.tabSwitchCount + 1;
            if (newTabSwitchCount >= config_1.proctoringConfig.maxTabSwitches &&
                !session.isLocked) {
                await database_config_1.default.examSession.update({
                    where: { id: sessionId },
                    data: {
                        tabSwitchCount: newTabSwitchCount,
                        isLocked: true,
                        lockedAt: new Date(),
                        lockReason: `${newTabSwitchCount} tab switch/focus loss violations detected`,
                    },
                });
                await database_config_1.default.proctorFlag.create({
                    data: {
                        sessionId,
                        flagType: "TAB_SWITCH",
                        description: `${newTabSwitchCount} tab switches detected  exam locked`,
                        severity: 4,
                    },
                });
                return { locked: true, tabSwitchCount: newTabSwitchCount };
            }
            else {
                await database_config_1.default.examSession.update({
                    where: { id: sessionId },
                    data: { tabSwitchCount: newTabSwitchCount },
                });
                return {
                    locked: false,
                    tabSwitchCount: newTabSwitchCount,
                    remaining: config_1.proctoringConfig.maxTabSwitches - newTabSwitchCount,
                };
            }
        }
        return { locked: false };
    }
    async proctorUnlock(sessionId) {
        const session = await database_config_1.default.examSession.findUnique({
            where: { id: sessionId },
        });
        if (!session)
            throw new app_error_1.NotFoundError("Session not found");
        if (!session.isLocked)
            throw new app_error_1.BadRequestError("Session is not locked");
        const now = new Date();
        let additionalPausedSeconds = 0;
        if (session.lockedAt) {
            additionalPausedSeconds = timer_service_1.timerService.calculateProctorAutoAdjustment(session.lockedAt, now, config_1.proctoringConfig.proctorResponseTimeoutMinutes);
        }
        await database_config_1.default.examSession.update({
            where: { id: sessionId },
            data: {
                isLocked: false,
                proctorUnlockedAt: now,
                lockReason: null,
                totalPausedSeconds: session.totalPausedSeconds + additionalPausedSeconds,
            },
        });
        return {
            unlocked: true,
            additionalTimePausedSeconds: additionalPausedSeconds,
            message: additionalPausedSeconds > 0
                ? `Timer adjusted: ${additionalPausedSeconds} seconds added back due to proctor response delay`
                : "Session unlocked",
        };
    }
    async extendTime(sessionId, additionalMinutes) {
        const session = await database_config_1.default.examSession.findUnique({
            where: { id: sessionId },
        });
        if (!session)
            throw new app_error_1.NotFoundError("Session not found");
        if (session.finishedAt)
            throw new app_error_1.BadRequestError("Session already finished");
        const newDeadline = new Date(session.serverDeadline);
        newDeadline.setMinutes(newDeadline.getMinutes() + additionalMinutes);
        await database_config_1.default.examSession.update({
            where: { id: sessionId },
            data: { serverDeadline: newDeadline },
        });
        return {
            newDeadline,
            remainingSeconds: (0, date_util_1.calculateRemainingSeconds)(newDeadline, session.totalPausedSeconds),
        };
    }
    async finishSession(sessionId) {
        const session = await database_config_1.default.examSession.findUnique({
            where: { id: sessionId },
            include: { enrollment: true },
        });
        if (!session)
            throw new app_error_1.NotFoundError("Session not found");
        if (session.finishedAt)
            return session;
        return database_config_1.default.$transaction(async (tx) => {
            const updated = await tx.examSession.update({
                where: { id: sessionId },
                data: { finishedAt: new Date() },
            });
            await tx.examEnrollment.update({
                where: { id: session.enrollmentId },
                data: { status: client_1.EnrollmentStatus.COMPLETED },
            });
            return updated;
        });
    }
    async getSessionStatus(sessionId) {
        const session = await database_config_1.default.examSession.findUnique({
            where: { id: sessionId },
            include: {
                enrollment: {
                    include: {
                        exam: {
                            select: { title: true, totalMarks: true, isAdaptive: true },
                        },
                        candidate: {
                            select: { id: true, firstName: true, lastName: true },
                        },
                    },
                },
                _count: { select: { answers: true, violations: true, flags: true } },
            },
        });
        if (!session)
            throw new app_error_1.NotFoundError("Session not found");
        const timerState = session.finishedAt
            ? {
                remainingSeconds: 0,
                isExpired: true,
                isPaused: false,
                serverDeadline: session.serverDeadline,
                totalPausedSeconds: session.totalPausedSeconds,
            }
            : timer_service_1.timerService.getTimerState(session.serverDeadline, session.totalPausedSeconds, session.pausedAt);
        return {
            session,
            timerState,
        };
    }
    async getQuestionByIndex(sessionId, index) {
        const session = await database_config_1.default.examSession.findUnique({
            where: { id: sessionId },
            include: {
                enrollment: { include: { exam: true } },
            },
        });
        if (!session)
            throw new app_error_1.NotFoundError("Session not found");
        if (session.finishedAt)
            throw new app_error_1.BadRequestError("Exam already finished");
        if (session.enrollment.exam.isAdaptive) {
            throw new app_error_1.BadRequestError("Navigation not supported for adaptive exams");
        }
        const question = await adaptive_engine_service_1.adaptiveEngineService.getNextQuestionSequential(sessionId, session.enrollment.examId, index);
        if (!question)
            throw new app_error_1.NotFoundError("Question at this index not found");
        const answer = await database_config_1.default.candidateAnswer.findUnique({
            where: {
                sessionId_examQuestionId: {
                    sessionId,
                    examQuestionId: question.examQuestionId,
                },
            },
        });
        return {
            question,
            answer: answer
                ? {
                    answerContent: answer.answerContent,
                    codeSubmission: answer.codeSubmission,
                }
                : null,
        };
    }
    async getSessionQuestionMarkers(sessionId) {
        const session = await database_config_1.default.examSession.findUnique({
            where: { id: sessionId },
            include: {
                enrollment: {
                    include: {
                        exam: {
                            include: {
                                questions: {
                                    orderBy: { orderIndex: "asc" },
                                    select: { id: true, orderIndex: true },
                                },
                            },
                        },
                    },
                },
                answers: {
                    select: { examQuestionId: true },
                },
            },
        });
        if (!session)
            throw new app_error_1.NotFoundError("Session not found");
        const answeredIds = new Set(session.answers.map((a) => a.examQuestionId));
        return session.enrollment.exam.questions.map((q) => ({
            id: q.id,
            index: q.orderIndex,
            isAnswered: answeredIds.has(q.id),
        }));
    }
    getInitialAdaptiveState() {
        return {
            currentDifficulty: 5,
            topicAccuracyMap: {},
            totalDifficulty: 0,
            questionsServed: 0,
            runningAccuracy: 0,
        };
    }
}
exports.ExamSessionService = ExamSessionService;
exports.examSessionService = new ExamSessionService();
//# sourceMappingURL=exam-session.service.js.map