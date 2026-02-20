import prisma from "../../config/database.config";
import { NotFoundError, BadRequestError } from "../../utils/app-error";
import { ResultStatus, ReEvalStatus } from "@prisma/client";
import { isWithinChallengeWindow } from "../../utils/date.util";
import { PaginationParams } from "../../utils/pagination.util";

export class ResultService {
  /**
   * Generate results for all completed enrollments in an exam.
   * Results stay in PENDING_REVIEW until examiner publishes.
   */
  async generateResults(examId: string) {
    const enrollments = await prisma.examEnrollment.findMany({
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
      if (!enrollment.session) continue;

      // Check if result already exists
      const existing = await prisma.examResult.findUnique({
        where: { enrollmentId: enrollment.id },
      });
      if (existing) continue;

      const totalScore = enrollment.session.answers.reduce(
        (sum, a) => sum + (a.finalScore || 0),
        0,
      );

      const exam = await prisma.exam.findUnique({ where: { id: examId } });
      if (!exam) continue;

      const percentage =
        exam.totalMarks > 0 ? (totalScore / exam.totalMarks) * 100 : 0;
      const passed = totalScore >= exam.passingScore;

      // Calculate integrity metrics
      const proctorFlagCount = enrollment.session.flags.length;
      const proctorFlagSeveritySum = enrollment.session.flags.reduce(
        (s, f) => s + f.severity,
        0,
      );
      const timingAnomalyCount = enrollment.session.violations.filter(
        (v) => v.type === "TAB_SWITCH",
      ).length;

      // Basic integrity score (0-100, higher = more trustworthy)
      const baseIntegrity = 100;
      const flagPenalty = proctorFlagSeveritySum * 5;
      const violationPenalty = timingAnomalyCount * 10;
      const integrityScore = Math.max(
        0,
        baseIntegrity - flagPenalty - violationPenalty,
      );

      const result = await prisma.examResult.create({
        data: {
          enrollmentId: enrollment.id,
          totalScore,
          maxScore: exam.totalMarks,
          percentage: Math.round(percentage * 100) / 100,
          passed,
          integrityScore,
          timingAnomalyCount,
          status: ResultStatus.PENDING_REVIEW,
        },
      });

      results.push(result);
    }

    return results;
  }

  /**
   * Publish results — candidates can see scores but NOT correct answers.
   */
  async publishResults(examId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundError("Exam not found");

    await prisma.$transaction(async (tx) => {
      await tx.examResult.updateMany({
        where: {
          enrollment: { examId },
          status: ResultStatus.PENDING_REVIEW,
        },
        data: {
          status: ResultStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      });

      await tx.exam.update({
        where: { id: examId },
        data: { resultStatus: ResultStatus.PUBLISHED },
      });

      // Notify all candidates
      const enrollments = await tx.examEnrollment.findMany({
        where: { examId },
        select: { candidateId: true },
      });

      await tx.notification.createMany({
        data: enrollments.map((e) => ({
          recipientId: e.candidateId,
          type: "RESULT_PUBLISHED" as const,
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

  /**
   * Get result for a candidate — shows score but NOT correct answers.
   */
  async getCandidateResult(enrollmentId: string, candidateId: string) {
    const result = await prisma.examResult.findUnique({
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
          },
        },
      },
    });

    if (!result) throw new NotFoundError("Result not found");
    if (result.enrollment.candidate.id !== candidateId) {
      throw new NotFoundError("Result not found");
    }
    if (result.status !== ResultStatus.PUBLISHED) {
      throw new BadRequestError("Results not yet published");
    }

    // Check if challenge window is open
    const canChallenge = result.publishedAt
      ? isWithinChallengeWindow(
          result.publishedAt,
          result.enrollment.exam.challengeWindowDays,
        )
      : false;

    return {
      ...result,
      canChallenge,
      // Do NOT include correct answers — by design
    };
  }

  /**
   * Get all published results for a candidate.
   */
  async getMyResults(candidateId: string) {
    const results = await prisma.examResult.findMany({
      where: {
        enrollment: { candidateId },
        status: ResultStatus.PUBLISHED,
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

  /**
   * File a re-evaluation request for a specific question.
   */
  async fileReEvaluation(
    resultId: string,
    candidateAnswerId: string,
    justification: string,
    candidateId: string,
  ) {
    const result = await prisma.examResult.findUnique({
      where: { id: resultId },
      include: {
        enrollment: {
          include: { exam: { select: { challengeWindowDays: true } } },
        },
      },
    });

    if (!result) throw new NotFoundError("Result not found");
    if (result.status !== ResultStatus.PUBLISHED) {
      throw new BadRequestError("Results not yet published");
    }

    if (
      !result.publishedAt ||
      !isWithinChallengeWindow(
        result.publishedAt,
        result.enrollment.exam.challengeWindowDays,
      )
    ) {
      throw new BadRequestError("Challenge window has expired");
    }

    const answer = await prisma.candidateAnswer.findUnique({
      where: { id: candidateAnswerId },
    });
    if (!answer) throw new NotFoundError("Answer not found");

    return prisma.reEvaluationRequest.create({
      data: {
        resultId,
        candidateAnswerId,
        justification,
        previousScore: answer.finalScore,
      },
    });
  }

  /**
   * Process a re-evaluation request.
   */
  async processReEvaluation(
    requestId: string,
    reviewedById: string,
    status: ReEvalStatus,
    newScore?: number,
    reviewNotes?: string,
  ) {
    const request = await prisma.reEvaluationRequest.findUnique({
      where: { id: requestId },
      include: { candidateAnswer: true, result: true },
    });

    if (!request) throw new NotFoundError("Re-evaluation request not found");

    const updateData: Record<string, unknown> = {
      status,
      reviewedById,
      reviewNotes,
      reviewedAt: new Date(),
    };

    if (status === ReEvalStatus.APPROVED && newScore !== undefined) {
      updateData.newScore = newScore;

      // Update the answer's score
      await prisma.candidateAnswer.update({
        where: { id: request.candidateAnswerId },
        data: { manualScore: newScore, finalScore: newScore },
      });

      // Recalculate result total
      const allAnswers = await prisma.candidateAnswer.findMany({
        where: { sessionId: request.candidateAnswer.sessionId },
      });

      const newTotalScore = allAnswers.reduce(
        (sum, a) => sum + (a.finalScore || 0),
        0,
      );

      await prisma.examResult.update({
        where: { id: request.resultId },
        data: {
          totalScore: newTotalScore,
          percentage:
            request.result.maxScore > 0
              ? (newTotalScore / request.result.maxScore) * 100
              : 0,
        },
      });
    }

    // Notify candidate
    const enrollment = await prisma.examEnrollment.findFirst({
      where: { id: request.result.enrollmentId },
    });

    if (enrollment) {
      await prisma.notification.create({
        data: {
          recipientId: enrollment.candidateId,
          type: "RE_EVALUATION_UPDATE",
          title: "Re-evaluation Result",
          message: `Your re-evaluation request has been ${status.toLowerCase()}.`,
        },
      });
    }

    return prisma.reEvaluationRequest.update({
      where: { id: requestId },
      data: updateData,
    });
  }

  /**
   * Get all results for an exam.
   */
  async getExamResults(examId: string, pagination: PaginationParams) {
    const [results, total] = await Promise.all([
      prisma.examResult.findMany({
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
      prisma.examResult.count({ where: { enrollment: { examId } } }),
    ]);

    return { results, total };
  }

  /**
   * Get re-evaluation requests for an exam.
   */
  async getReEvaluationRequests(examId: string, pagination: PaginationParams) {
    const [requests, total] = await Promise.all([
      prisma.reEvaluationRequest.findMany({
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
      prisma.reEvaluationRequest.count({
        where: { result: { enrollment: { examId } } },
      }),
    ]);

    return { requests, total };
  }
}

export const resultService = new ResultService();
