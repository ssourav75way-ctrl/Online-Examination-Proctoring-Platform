import prisma from "../../config/database.config";
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "../../utils/app-error";
import { ExamStatus, AccommodationType } from "@prisma/client";
import { PaginationParams } from "../../utils/pagination.util";
import {
  doTimeRangesOverlap,
  calculateAdjustedDuration,
  hasCooldownPassed,
} from "../../utils/date.util";

interface CreateExamInput {
  institutionId: string;
  title: string;
  description?: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  durationMinutes: number;
  isAdaptive?: boolean;
  maxAttempts?: number;
  cooldownHours?: number;
  challengeWindowDays?: number;
  totalMarks: number;
  passingScore: number;
  questionSelections: {
    poolId: string;
    questionIds: string[];
    quota?: number;
  }[];
}

interface EnrollCandidateInput {
  candidateId: string;
  accommodationType?: AccommodationType;
}

export class ExamService {
  /**
   * Create exam and pin question versions at creation time.
   */
  async create(input: CreateExamInput, createdById: string) {
    const startTime = new Date(input.scheduledStartTime);
    const endTime = new Date(input.scheduledEndTime);

    if (startTime >= endTime) {
      throw new BadRequestError("Start time must be before end time");
    }

    // Validate all question pools and fetch current versions
    const examQuestions: {
      questionId: string;
      questionVersionId: string;
      poolId: string;
      poolQuota: number | null;
      orderIndex: number;
    }[] = [];

    let orderIdx = 0;

    const selections = input.questionSelections || [];

    for (const selection of selections) {
      const pool = await prisma.questionPool.findUnique({
        where: { id: selection.poolId },
      });
      if (!pool) throw new NotFoundError(`Pool ${selection.poolId} not found`);

      for (const questionId of selection.questionIds) {
        const question = await prisma.question.findUnique({
          where: { id: questionId },
          include: {
            versions: { orderBy: { versionNumber: "desc" }, take: 1 },
          },
        });

        if (!question)
          throw new NotFoundError(`Question ${questionId} not found`);
        if (!question.versions[0])
          throw new BadRequestError(`Question ${questionId} has no versions`);

        examQuestions.push({
          questionId,
          questionVersionId: question.versions[0].id, // Pin current version
          poolId: selection.poolId,
          poolQuota: selection.quota || null,
          orderIndex: orderIdx++,
        });
      }
    }

    const exam = await prisma.exam.create({
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
        status: ExamStatus.DRAFT,
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

  /**
   * Schedule exam — changes status to SCHEDULED.
   */
  async schedule(examId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundError("Exam not found");
    if (exam.status !== ExamStatus.DRAFT)
      throw new BadRequestError("Only draft exams can be scheduled");

    return prisma.exam.update({
      where: { id: examId },
      data: { status: ExamStatus.SCHEDULED },
    });
  }

  /**
   * Enroll a candidate with conflict detection and accommodation support.
   */
  async enrollCandidate(examId: string, input: EnrollCandidateInput) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundError("Exam not found");

    const candidate = await prisma.user.findUnique({
      where: { id: input.candidateId },
    });
    if (!candidate) throw new NotFoundError("Candidate not found");
    if (candidate.globalRole !== "CANDIDATE")
      throw new BadRequestError("User is not a candidate");

    // Check for overlapping exams across ALL institutions
    const existingEnrollments = await prisma.examEnrollment.findMany({
      where: {
        candidateId: input.candidateId,
        status: { in: ["ENROLLED", "IN_PROGRESS"] },
      },
      include: { exam: true },
    });

    for (const enrollment of existingEnrollments) {
      if (
        doTimeRangesOverlap(
          exam.scheduledStartTime,
          exam.scheduledEndTime,
          enrollment.exam.scheduledStartTime,
          enrollment.exam.scheduledEndTime,
        )
      ) {
        throw new ConflictError(
          `Candidate has a conflicting exam: "${enrollment.exam.title}" (${enrollment.exam.scheduledStartTime.toISOString()} - ${enrollment.exam.scheduledEndTime.toISOString()})`,
        );
      }
    }

    // Check attempt limits and cooldown
    const previousAttempts = await prisma.examEnrollment.findMany({
      where: { examId, candidateId: input.candidateId },
      orderBy: { enrolledAt: "desc" },
    });

    if (previousAttempts.length >= exam.maxAttempts) {
      throw new BadRequestError(
        `Maximum attempts (${exam.maxAttempts}) reached`,
      );
    }

    // Check cooldown period
    if (previousAttempts.length > 0 && exam.cooldownHours > 0) {
      const lastAttempt = previousAttempts[0];
      if (lastAttempt.status === "COMPLETED") {
        const lastSession = await prisma.examSession.findUnique({
          where: { enrollmentId: lastAttempt.id },
        });
        if (
          lastSession?.finishedAt &&
          !hasCooldownPassed(lastSession.finishedAt, exam.cooldownHours)
        ) {
          throw new BadRequestError(
            `Cooldown period not elapsed. Please wait ${exam.cooldownHours} hours between attempts.`,
          );
        }
      }
    }

    // Get accommodation if applicable
    let accommodationType = input.accommodationType || AccommodationType.NONE;
    if (accommodationType === AccommodationType.NONE) {
      const accommodation = await prisma.accommodation.findFirst({
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

    const adjustedDuration = calculateAdjustedDuration(
      exam.durationMinutes,
      accommodationType,
    );

    return prisma.examEnrollment.create({
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

  /**
   * Reschedule exam with auto-conflict detection and notification.
   */
  async reschedule(examId: string, newStartTime: string, newEndTime: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { enrollments: { include: { candidate: true } } },
    });

    if (!exam) throw new NotFoundError("Exam not found");
    if (
      exam.status === ExamStatus.IN_PROGRESS ||
      exam.status === ExamStatus.COMPLETED
    ) {
      throw new BadRequestError(
        "Cannot reschedule an in-progress or completed exam",
      );
    }

    const start = new Date(newStartTime);
    const end = new Date(newEndTime);

    // Check conflicts for all enrolled candidates with other institutions' exams
    const conflicts: {
      candidateId: string;
      candidateName: string;
      conflictingExamTitle: string;
      conflictingInstitution: string;
    }[] = [];

    for (const enrollment of exam.enrollments) {
      const otherEnrollments = await prisma.examEnrollment.findMany({
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
        if (
          doTimeRangesOverlap(
            start,
            end,
            otherEnrollment.exam.scheduledStartTime,
            otherEnrollment.exam.scheduledEndTime,
          )
        ) {
          conflicts.push({
            candidateId: enrollment.candidateId,
            candidateName: `${enrollment.candidate.firstName} ${enrollment.candidate.lastName}`,
            conflictingExamTitle: otherEnrollment.exam.title,
            conflictingInstitution: otherEnrollment.exam.institution.name,
          });
        }
      }
    }

    // Update exam schedule
    const updatedExam = await prisma.exam.update({
      where: { id: examId },
      data: { scheduledStartTime: start, scheduledEndTime: end },
    });

    // Create notifications for conflicts
    if (conflicts.length > 0) {
      const notifications = conflicts.map((conflict) => ({
        recipientId: conflict.candidateId,
        type: "EXAM_RESCHEDULE" as const,
        title: "Exam Schedule Conflict",
        message: `Exam "${exam.title}" has been rescheduled and now conflicts with "${conflict.conflictingExamTitle}" at ${conflict.conflictingInstitution}`,
        metadata: {
          ...JSON.parse(JSON.stringify(conflict)),
          examId,
          examTitle: exam.title,
        },
      }));

      await prisma.notification.createMany({ data: notifications });
    }

    return { exam: updatedExam, conflicts };
  }

  /**
   * Get questions for a retake with zero overlap from previous attempts.
   */
  async getRetakeQuestionSet(
    examId: string,
    candidateId: string,
  ): Promise<string[]> {
    // Find previous attempts and their questions
    const previousEnrollments = await prisma.examEnrollment.findMany({
      where: { examId, candidateId, status: "COMPLETED" },
      include: {
        session: {
          include: {
            answers: { select: { examQuestionId: true } },
          },
        },
      },
    });

    const previousQuestionIds = new Set<string>();
    for (const enrollment of previousEnrollments) {
      if (enrollment.session) {
        for (const answer of enrollment.session.answers) {
          // Get the actual questionId from the examQuestion
          const examQuestion = await prisma.examQuestion.findUnique({
            where: { id: answer.examQuestionId },
          });
          if (examQuestion) {
            previousQuestionIds.add(examQuestion.questionId);
          }
        }
      }
    }

    // Get all questions in the exam's pools that were NOT used before
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: true },
    });

    if (!exam) throw new NotFoundError("Exam not found");

    const poolIds = [...new Set(exam.questions.map((q) => q.poolId))];

    const availableQuestions = await prisma.question.findMany({
      where: {
        poolId: { in: poolIds },
        isActive: true,
        id: { notIn: [...previousQuestionIds] },
      },
      select: { id: true },
    });

    return availableQuestions.map((q) => q.id);
  }

  async getById(examId: string) {
    const exam = await prisma.exam.findUnique({
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

    if (!exam) throw new NotFoundError("Exam not found");
    return exam;
  }

  async getByInstitution(
    institutionId: string,
    pagination: PaginationParams,
    status?: ExamStatus,
  ) {
    const where: Record<string, unknown> = { institutionId };
    if (status) where.status = status;

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { enrollments: true, questions: true } },
        },
        orderBy: { scheduledStartTime: "desc" },
      }),
      prisma.exam.count({ where }),
    ]);

    return { exams, total };
  }

  async getEnrollments(examId: string, pagination: PaginationParams) {
    const [enrollments, total] = await Promise.all([
      prisma.examEnrollment.findMany({
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
      prisma.examEnrollment.count({ where: { examId } }),
    ]);

    return { enrollments, total };
  }

  async cancelExam(examId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundError("Exam not found");
    if (exam.status === ExamStatus.COMPLETED)
      throw new BadRequestError("Cannot cancel a completed exam");

    return prisma.exam.update({
      where: { id: examId },
      data: { status: ExamStatus.CANCELLED },
    });
  }

  async update(examId: string, data: Partial<CreateExamInput>) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundError("Exam not found");

    if (
      exam.status === ExamStatus.IN_PROGRESS ||
      exam.status === ExamStatus.COMPLETED
    ) {
      throw new BadRequestError(
        "Cannot update an in-progress or completed exam",
      );
    }

    const updateData: Record<string, any> = {};
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.scheduledStartTime)
      updateData.scheduledStartTime = new Date(data.scheduledStartTime);
    if (data.scheduledEndTime)
      updateData.scheduledEndTime = new Date(data.scheduledEndTime);
    if (data.durationMinutes) updateData.durationMinutes = data.durationMinutes;
    if (data.isAdaptive !== undefined) updateData.isAdaptive = data.isAdaptive;
    if (data.maxAttempts) updateData.maxAttempts = data.maxAttempts;
    if (data.cooldownHours !== undefined)
      updateData.cooldownHours = data.cooldownHours;
    if (data.passingScore) updateData.passingScore = data.passingScore;
    if (data.totalMarks) updateData.totalMarks = data.totalMarks;

    return prisma.exam.update({
      where: { id: examId },
      data: updateData,
    });
  }

  async getMyEnrollment(examId: string, candidateId: string) {
    const enrollment = await prisma.examEnrollment.findFirst({
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

  async addQuestionsToExam(examId: string, questionIds: string[]) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: true },
    });
    if (!exam) throw new NotFoundError("Exam not found");
    if (
      exam.status !== ExamStatus.DRAFT &&
      exam.status !== ExamStatus.SCHEDULED
    ) {
      throw new BadRequestError(
        "Can only add questions to DRAFT or SCHEDULED exams",
      );
    }

    // Get existing max orderIndex
    const maxOrder = exam.questions.reduce(
      (max, q) => Math.max(max, q.orderIndex),
      -1,
    );

    const newExamQuestions: {
      examId: string;
      questionId: string;
      questionVersionId: string;
      poolId: string;
      orderIndex: number;
    }[] = [];

    for (let i = 0; i < questionIds.length; i++) {
      const question = await prisma.question.findUnique({
        where: { id: questionIds[i] },
        include: {
          versions: { orderBy: { versionNumber: "desc" }, take: 1 },
        },
      });
      if (!question)
        throw new NotFoundError(`Question ${questionIds[i]} not found`);
      if (!question.versions[0])
        throw new BadRequestError(`Question ${questionIds[i]} has no versions`);

      // Skip duplicates
      const alreadyAdded = exam.questions.some(
        (eq) => eq.questionId === questionIds[i],
      );
      if (alreadyAdded) continue;

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

    await prisma.examQuestion.createMany({ data: newExamQuestions });

    return { added: newExamQuestions.length };
  }

  async getExamQuestions(examId: string) {
    return prisma.examQuestion.findMany({
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

  async removeQuestionFromExam(examId: string, examQuestionId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundError("Exam not found");
    if (
      exam.status !== ExamStatus.DRAFT &&
      exam.status !== ExamStatus.SCHEDULED
    ) {
      throw new BadRequestError(
        "Can only remove questions from DRAFT or SCHEDULED exams",
      );
    }
    return prisma.examQuestion.delete({ where: { id: examQuestionId } });
  }
}

export const examService = new ExamService();
