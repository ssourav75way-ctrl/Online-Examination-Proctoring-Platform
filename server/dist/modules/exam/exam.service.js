"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.examService = exports.ExamService = void 0;
const database_config_1 = __importDefault(require("../../config/database.config"));
const app_error_1 = require("../../utils/app-error");
const client_1 = require("@prisma/client");
const date_util_1 = require("../../utils/date.util");
class ExamService {
    async create(input, createdById) {
        const startTime = new Date(input.scheduledStartTime);
        const endTime = new Date(input.scheduledEndTime);
        if (startTime >= endTime) {
            throw new app_error_1.BadRequestError("Start time must be before end time");
        }
        const examQuestions = [];
        let orderIdx = 0;
        const selections = input.questionSelections || [];
        for (const selection of selections) {
            const pool = await database_config_1.default.questionPool.findUnique({
                where: { id: selection.poolId },
            });
            if (!pool)
                throw new app_error_1.NotFoundError(`Pool ${selection.poolId} not found`);
            for (const questionId of selection.questionIds) {
                const question = await database_config_1.default.question.findUnique({
                    where: { id: questionId },
                    include: {
                        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
                    },
                });
                if (!question)
                    throw new app_error_1.NotFoundError(`Question ${questionId} not found`);
                if (!question.versions[0])
                    throw new app_error_1.BadRequestError(`Question ${questionId} has no versions`);
                examQuestions.push({
                    questionId,
                    questionVersionId: question.versions[0].id,
                    poolId: selection.poolId,
                    poolQuota: selection.quota || null,
                    orderIndex: orderIdx++,
                });
            }
        }
        const exam = await database_config_1.default.exam.create({
            data: {
                institutionId: input.institutionId,
                title: input.title,
                description: input.description,
                scheduledStartTime: startTime,
                scheduledEndTime: endTime,
                durationMinutes: input.durationMinutes,
                isAdaptive: input.isAdaptive || false,
                maxAttempts: input.maxAttempts || 1,
                cooldownHours: input.cooldownHours || 0,
                challengeWindowDays: input.challengeWindowDays || 7,
                totalMarks: input.totalMarks,
                passingScore: input.passingScore,
                createdById,
                status: client_1.ExamStatus.DRAFT,
                questions: {
                    create: examQuestions,
                },
            },
            include: {
                questions: {
                    include: {
                        question: { select: { id: true, topic: true, type: true } },
                        questionVersion: {
                            select: {
                                id: true,
                                versionNumber: true,
                                content: true,
                                difficulty: true,
                            },
                        },
                    },
                },
                institution: { select: { id: true, name: true } },
            },
        });
        return exam;
    }
    async schedule(examId) {
        const exam = await database_config_1.default.exam.findUnique({ where: { id: examId } });
        if (!exam)
            throw new app_error_1.NotFoundError("Exam not found");
        if (exam.status !== client_1.ExamStatus.DRAFT)
            throw new app_error_1.BadRequestError("Only draft exams can be scheduled");
        return database_config_1.default.exam.update({
            where: { id: examId },
            data: { status: client_1.ExamStatus.SCHEDULED },
        });
    }
    async enrollCandidate(examId, input) {
        const exam = await database_config_1.default.exam.findUnique({ where: { id: examId } });
        if (!exam)
            throw new app_error_1.NotFoundError("Exam not found");
        const candidate = await database_config_1.default.user.findUnique({
            where: { id: input.candidateId },
        });
        if (!candidate)
            throw new app_error_1.NotFoundError("Candidate not found");
        if (candidate.globalRole !== "CANDIDATE")
            throw new app_error_1.BadRequestError("User is not a candidate");
        const existingEnrollments = await database_config_1.default.examEnrollment.findMany({
            where: {
                candidateId: input.candidateId,
                status: { in: ["ENROLLED", "IN_PROGRESS"] },
            },
            include: { exam: true },
        });
        for (const enrollment of existingEnrollments) {
            if ((0, date_util_1.doTimeRangesOverlap)(exam.scheduledStartTime, exam.scheduledEndTime, enrollment.exam.scheduledStartTime, enrollment.exam.scheduledEndTime)) {
                throw new app_error_1.ConflictError(`Candidate has a conflicting exam: "${enrollment.exam.title}" (${enrollment.exam.scheduledStartTime.toISOString()} - ${enrollment.exam.scheduledEndTime.toISOString()})`);
            }
        }
        const previousAttempts = await database_config_1.default.examEnrollment.findMany({
            where: { examId, candidateId: input.candidateId },
            orderBy: { enrolledAt: "desc" },
        });
        if (previousAttempts.length >= exam.maxAttempts) {
            throw new app_error_1.BadRequestError(`Maximum attempts (${exam.maxAttempts}) reached`);
        }
        if (previousAttempts.length > 0 && exam.cooldownHours > 0) {
            const lastAttempt = previousAttempts[0];
            if (lastAttempt.status === "COMPLETED") {
                const lastSession = await database_config_1.default.examSession.findUnique({
                    where: { enrollmentId: lastAttempt.id },
                });
                if (lastSession?.finishedAt &&
                    !(0, date_util_1.hasCooldownPassed)(lastSession.finishedAt, exam.cooldownHours)) {
                    throw new app_error_1.BadRequestError(`Cooldown period not elapsed. Please wait ${exam.cooldownHours} hours between attempts.`);
                }
            }
        }
        let accommodationType = input.accommodationType || client_1.AccommodationType.NONE;
        if (accommodationType === client_1.AccommodationType.NONE) {
            const accommodation = await database_config_1.default.accommodation.findFirst({
                where: {
                    candidateId: input.candidateId,
                    isActive: true,
                    validFrom: { lte: new Date() },
                    OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
                },
            });
            if (accommodation) {
                accommodationType = accommodation.type;
            }
        }
        const adjustedDuration = (0, date_util_1.calculateAdjustedDuration)(exam.durationMinutes, accommodationType);
        return database_config_1.default.examEnrollment.create({
            data: {
                examId,
                candidateId: input.candidateId,
                attemptNumber: previousAttempts.length + 1,
                accommodationType,
                adjustedDurationMinutes: adjustedDuration,
            },
            include: {
                exam: { select: { id: true, title: true, scheduledStartTime: true } },
                candidate: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
    }
    async reschedule(examId, newStartTime, newEndTime) {
        const exam = await database_config_1.default.exam.findUnique({
            where: { id: examId },
            include: {
                enrollments: { include: { candidate: true } },
                institution: { select: { name: true } },
            },
        });
        if (!exam)
            throw new app_error_1.NotFoundError("Exam not found");
        if (exam.status === client_1.ExamStatus.IN_PROGRESS ||
            exam.status === client_1.ExamStatus.COMPLETED) {
            throw new app_error_1.BadRequestError("Cannot reschedule an in-progress or completed exam");
        }
        const start = new Date(newStartTime);
        const end = new Date(newEndTime);
        const conflicts = [];
        for (const enrollment of exam.enrollments) {
            const otherEnrollments = await database_config_1.default.examEnrollment.findMany({
                where: {
                    candidateId: enrollment.candidateId,
                    NOT: { examId },
                    status: { in: ["ENROLLED", "IN_PROGRESS"] },
                },
                include: {
                    exam: { include: { institution: { select: { name: true } } } },
                },
            });
            for (const otherEnrollment of otherEnrollments) {
                if ((0, date_util_1.doTimeRangesOverlap)(start, end, otherEnrollment.exam.scheduledStartTime, otherEnrollment.exam.scheduledEndTime)) {
                    conflicts.push({
                        candidateId: enrollment.candidateId,
                        candidateName: `${enrollment.candidate.firstName} ${enrollment.candidate.lastName}`,
                        conflictingExamTitle: otherEnrollment.exam.title,
                        conflictingInstitution: otherEnrollment.exam.institution.name,
                    });
                }
            }
        }
        const updatedExam = await database_config_1.default.exam.update({
            where: { id: examId },
            data: { scheduledStartTime: start, scheduledEndTime: end },
        });
        if (conflicts.length > 0) {
            const candidateNotifications = conflicts.map((conflict) => ({
                recipientId: conflict.candidateId,
                type: client_1.NotificationType.EXAM_RESCHEDULE,
                title: "Exam Schedule Conflict",
                message: `Your exam "${exam.title}" now conflicts with "${conflict.conflictingExamTitle}" at ${conflict.conflictingInstitution}.`,
                metadata: { examId, examTitle: exam.title },
            }));
            const currentInstAdmins = await database_config_1.default.institutionMember.findMany({
                where: { institutionId: exam.institutionId, role: "ADMIN" },
                select: { userId: true },
            });
            const conflictingInstNames = [
                ...new Set(conflicts.map((c) => c.conflictingInstitution)),
            ];
            const conflictingInsts = await database_config_1.default.institution.findMany({
                where: { name: { in: conflictingInstNames } },
                include: {
                    members: { where: { role: "ADMIN" }, select: { userId: true } },
                },
            });
            const adminNotifications = [];
            currentInstAdmins.forEach((admin) => {
                adminNotifications.push({
                    recipientId: admin.userId,
                    type: client_1.NotificationType.EXAM_CONFLICT,
                    title: "Schedule Conflict Detected",
                    message: `Rescheduling "${exam.title}" caused conflicts for ${conflicts.length} candidates with other institutions.`,
                    metadata: {
                        examId,
                        conflictsCount: conflicts.length,
                    },
                });
            });
            conflictingInsts.forEach((inst) => {
                const impactedCandidates = conflicts.filter((c) => c.conflictingInstitution === inst.name);
                inst.members.forEach((member) => {
                    adminNotifications.push({
                        recipientId: member.userId,
                        type: client_1.NotificationType.EXAM_CONFLICT,
                        title: "Remote Exam Conflict",
                        message: `External institution "${exam.institution.name}" rescheduled an exam that now conflicts with your students' schedule.`,
                        metadata: {
                            impactedCandidates: impactedCandidates.map((c) => c.candidateName),
                        },
                    });
                });
            });
            await database_config_1.default.notification.createMany({
                data: [...candidateNotifications, ...adminNotifications],
            });
        }
        return { exam: updatedExam, conflicts };
    }
    async getRetakeQuestionSet(examId, candidateId) {
        const previousSessions = await database_config_1.default.examSession.findMany({
            where: { enrollment: { examId, candidateId } },
            include: {
                answers: { select: { examQuestion: { select: { questionId: true } } } },
            },
        });
        const forbiddenQuestionIds = new Set();
        previousSessions.forEach((session) => {
            session.answers.forEach((ans) => {
                if (ans.examQuestion?.questionId) {
                    forbiddenQuestionIds.add(ans.examQuestion.questionId);
                }
            });
        });
        const activeEnrollment = await database_config_1.default.examEnrollment.findFirst({
            where: {
                examId,
                candidateId,
                status: { in: ["ENROLLED", "IN_PROGRESS"] },
            },
            include: {
                attemptQuestions: {
                    include: { examQuestion: { select: { questionId: true } } },
                },
            },
        });
        if (activeEnrollment) {
            activeEnrollment.attemptQuestions.forEach((aq) => {
                forbiddenQuestionIds.add(aq.examQuestion.questionId);
            });
        }
        const exam = await database_config_1.default.exam.findUnique({
            where: { id: examId },
            include: { questions: { select: { poolId: true } } },
        });
        if (!exam)
            throw new app_error_1.NotFoundError("Exam not found");
        const poolIds = [...new Set(exam.questions.map((q) => q.poolId))];
        const availableQuestions = await database_config_1.default.question.findMany({
            where: {
                poolId: { in: poolIds },
                isActive: true,
                id: { notIn: Array.from(forbiddenQuestionIds) },
            },
            select: { id: true },
        });
        return availableQuestions.map((q) => q.id);
    }
    async getById(examId) {
        const exam = await database_config_1.default.exam.findUnique({
            where: { id: examId },
            include: {
                institution: { select: { id: true, name: true } },
                createdBy: { select: { id: true, firstName: true, lastName: true } },
                questions: {
                    include: {
                        question: { select: { id: true, topic: true, type: true } },
                        questionVersion: {
                            select: {
                                id: true,
                                versionNumber: true,
                                difficulty: true,
                                marks: true,
                            },
                        },
                    },
                    orderBy: { orderIndex: "asc" },
                },
                _count: { select: { enrollments: true } },
            },
        });
        if (!exam)
            throw new app_error_1.NotFoundError("Exam not found");
        return exam;
    }
    async getByInstitution(institutionId, pagination, status) {
        const where = { institutionId };
        if (status)
            where.status = status;
        const [exams, total] = await Promise.all([
            database_config_1.default.exam.findMany({
                where,
                skip: pagination.skip,
                take: pagination.limit,
                include: {
                    createdBy: { select: { id: true, firstName: true, lastName: true } },
                    _count: { select: { enrollments: true, questions: true } },
                },
                orderBy: { scheduledStartTime: "desc" },
            }),
            database_config_1.default.exam.count({ where }),
        ]);
        return { exams, total };
    }
    async getEnrollments(examId, pagination) {
        const [enrollments, total] = await Promise.all([
            database_config_1.default.examEnrollment.findMany({
                where: { examId },
                skip: pagination.skip,
                take: pagination.limit,
                include: {
                    candidate: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                    session: {
                        select: {
                            id: true,
                            startedAt: true,
                            finishedAt: true,
                            isLocked: true,
                        },
                    },
                    result: {
                        select: {
                            id: true,
                            totalScore: true,
                            percentage: true,
                            passed: true,
                            status: true,
                        },
                    },
                },
                orderBy: { enrolledAt: "desc" },
            }),
            database_config_1.default.examEnrollment.count({ where: { examId } }),
        ]);
        return { enrollments, total };
    }
    async cancelExam(examId) {
        const exam = await database_config_1.default.exam.findUnique({ where: { id: examId } });
        if (!exam)
            throw new app_error_1.NotFoundError("Exam not found");
        if (exam.status === client_1.ExamStatus.COMPLETED)
            throw new app_error_1.BadRequestError("Cannot cancel a completed exam");
        return database_config_1.default.exam.update({
            where: { id: examId },
            data: { status: client_1.ExamStatus.CANCELLED },
        });
    }
    async update(examId, data) {
        const exam = await database_config_1.default.exam.findUnique({ where: { id: examId } });
        if (!exam)
            throw new app_error_1.NotFoundError("Exam not found");
        if (exam.status === client_1.ExamStatus.IN_PROGRESS ||
            exam.status === client_1.ExamStatus.COMPLETED) {
            throw new app_error_1.BadRequestError("Cannot update an in-progress or completed exam");
        }
        const updateData = {};
        if (data.title)
            updateData.title = data.title;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.scheduledStartTime)
            updateData.scheduledStartTime = new Date(data.scheduledStartTime);
        if (data.scheduledEndTime)
            updateData.scheduledEndTime = new Date(data.scheduledEndTime);
        if (data.durationMinutes)
            updateData.durationMinutes = data.durationMinutes;
        if (data.isAdaptive !== undefined)
            updateData.isAdaptive = data.isAdaptive;
        if (data.maxAttempts)
            updateData.maxAttempts = data.maxAttempts;
        if (data.cooldownHours !== undefined)
            updateData.cooldownHours = data.cooldownHours;
        if (data.passingScore)
            updateData.passingScore = data.passingScore;
        if (data.totalMarks)
            updateData.totalMarks = data.totalMarks;
        return database_config_1.default.exam.update({
            where: { id: examId },
            data: updateData,
        });
    }
    async getMyEnrollment(examId, candidateId) {
        const enrollment = await database_config_1.default.examEnrollment.findFirst({
            where: { examId, candidateId },
            orderBy: { attemptNumber: "desc" },
            include: {
                exam: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        durationMinutes: true,
                        scheduledStartTime: true,
                        scheduledEndTime: true,
                    },
                },
                session: {
                    select: {
                        id: true,
                        startedAt: true,
                        finishedAt: true,
                        isLocked: true,
                    },
                },
            },
        });
        return enrollment;
    }
    async addQuestionsToExam(examId, questionIds) {
        const exam = await database_config_1.default.exam.findUnique({
            where: { id: examId },
            include: { questions: true },
        });
        if (!exam)
            throw new app_error_1.NotFoundError("Exam not found");
        if (exam.status !== client_1.ExamStatus.DRAFT &&
            exam.status !== client_1.ExamStatus.SCHEDULED) {
            throw new app_error_1.BadRequestError("Can only add questions to DRAFT or SCHEDULED exams");
        }
        const maxOrder = exam.questions.reduce((max, q) => Math.max(max, q.orderIndex), -1);
        const newExamQuestions = [];
        for (let i = 0; i < questionIds.length; i++) {
            const question = await database_config_1.default.question.findUnique({
                where: { id: questionIds[i] },
                include: {
                    versions: { orderBy: { versionNumber: "desc" }, take: 1 },
                },
            });
            if (!question)
                throw new app_error_1.NotFoundError(`Question ${questionIds[i]} not found`);
            if (!question.versions[0])
                throw new app_error_1.BadRequestError(`Question ${questionIds[i]} has no versions`);
            const alreadyAdded = exam.questions.some((eq) => eq.questionId === questionIds[i]);
            if (alreadyAdded)
                continue;
            newExamQuestions.push({
                examId,
                questionId: questionIds[i],
                questionVersionId: question.versions[0].id,
                poolId: question.poolId,
                orderIndex: maxOrder + 1 + i,
            });
        }
        if (newExamQuestions.length === 0) {
            return { added: 0 };
        }
        await database_config_1.default.examQuestion.createMany({ data: newExamQuestions });
        return { added: newExamQuestions.length };
    }
    async getExamQuestions(examId) {
        return database_config_1.default.examQuestion.findMany({
            where: { examId },
            orderBy: { orderIndex: "asc" },
            include: {
                question: { select: { id: true, topic: true, type: true } },
                questionVersion: {
                    select: {
                        id: true,
                        content: true,
                        difficulty: true,
                        marks: true,
                        versionNumber: true,
                    },
                },
            },
        });
    }
    async removeQuestionFromExam(examId, examQuestionId) {
        const exam = await database_config_1.default.exam.findUnique({ where: { id: examId } });
        if (!exam)
            throw new app_error_1.NotFoundError("Exam not found");
        if (exam.status !== client_1.ExamStatus.DRAFT &&
            exam.status !== client_1.ExamStatus.SCHEDULED) {
            throw new app_error_1.BadRequestError("Can only remove questions from DRAFT or SCHEDULED exams");
        }
        return database_config_1.default.examQuestion.delete({ where: { id: examQuestionId } });
    }
}
exports.ExamService = ExamService;
exports.examService = new ExamService();
//# sourceMappingURL=exam.service.js.map