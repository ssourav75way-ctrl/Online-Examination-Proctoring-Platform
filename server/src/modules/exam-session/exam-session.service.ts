import prisma from "../../config/database.config";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "../../utils/app-error";
import { ExamStatus, EnrollmentStatus } from "@prisma/client";
import { timerService } from "../../services/timer.service";
import { adaptiveEngineService } from "../../services/adaptive-engine.service";
import { proctoringConfig } from "../../config";
import { AdaptiveState, QuestionDeliveryItem } from "../../types/exam.types";
import { calculateRemainingSeconds } from "../../utils/date.util";

interface SubmitAnswerInput {
  examQuestionId: string;
  answerContent?: string;
  codeSubmission?: string;
}

export class ExamSessionService {
  async startSession(
    enrollmentId: string,
    ipAddress: string,
    userAgent: string,
  ) {
    const enrollment = await prisma.examEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { exam: true },
    });

    if (!enrollment) throw new NotFoundError("Enrollment not found");
    if (enrollment.status !== EnrollmentStatus.ENROLLED) {
      throw new BadRequestError("Exam already started or completed");
    }

    const now = new Date();
    if (
      enrollment.exam.status !== ExamStatus.SCHEDULED &&
      enrollment.exam.status !== ExamStatus.IN_PROGRESS
    ) {
      throw new BadRequestError("Exam is not available");
    }
    if (now < enrollment.exam.scheduledStartTime) {
      throw new BadRequestError("Exam has not started yet");
    }
    if (now > enrollment.exam.scheduledEndTime) {
      throw new BadRequestError("Exam window has ended");
    }
    const durationMinutes =
      enrollment.adjustedDurationMinutes || enrollment.exam.durationMinutes;
    const serverDeadline = timerService.calculateDeadline(now, durationMinutes);

    const session = await prisma.$transaction(async (tx) => {
      await tx.examEnrollment.update({
        where: { id: enrollmentId },
        data: { status: EnrollmentStatus.IN_PROGRESS },
      });
      if (enrollment.exam.status === ExamStatus.SCHEDULED) {
        await tx.exam.update({
          where: { id: enrollment.examId },
          data: { status: ExamStatus.IN_PROGRESS },
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
      ? await adaptiveEngineService.getNextQuestion(
          session.id,
          enrollment.examId,
          this.getInitialAdaptiveState(),
        )
      : await adaptiveEngineService.getNextQuestionSequential(
          session.id,
          enrollment.examId,
          0,
        );

    const timerState = timerService.getTimerState(serverDeadline, 0, null);

    return {
      session,
      timerState,
      currentQuestion: firstQuestion,
    };
  }

  async submitAnswer(sessionId: string, input: SubmitAnswerInput) {
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        enrollment: { include: { exam: true } },
      },
    });

    if (!session) throw new NotFoundError("Session not found");
    if (session.finishedAt) throw new BadRequestError("Exam already finished");
    if (session.isLocked)
      throw new BadRequestError("Exam is locked  awaiting proctor approval");

    const timerState = timerService.getTimerState(
      session.serverDeadline,
      session.totalPausedSeconds,
      session.pausedAt,
    );

    if (timerState.isExpired) {
      await this.finishSession(sessionId);
      throw new BadRequestError("Time has expired");
    }

    const existing = await prisma.candidateAnswer.findUnique({
      where: {
        sessionId_examQuestionId: {
          sessionId,
          examQuestionId: input.examQuestionId,
        },
      },
    });

    if (existing) {
      throw new BadRequestError("Question already answered");
    }

    const examQuestion = await prisma.examQuestion.findUnique({
      where: { id: input.examQuestionId },
      include: {
        question: true,
        questionVersion: true,
      },
    });

    if (!examQuestion) throw new NotFoundError("Exam question not found");

    const lastAnswer = await prisma.candidateAnswer.findFirst({
      where: { sessionId },
      orderBy: { answeredAt: "desc" },
    });
    const startRef = lastAnswer ? lastAnswer.answeredAt : session.startedAt;
    const timeTakenSeconds = Math.floor(
      (Date.now() - startRef.getTime()) / 1000,
    );

    const answer = await prisma.candidateAnswer.create({
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
    const newAccuracy =
      newQuestionsAnswered > 0 ? newCorrectAnswers / newQuestionsAnswered : 0;

    await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        currentQuestionIndex: session.currentQuestionIndex + 1,
        questionsAnswered: newQuestionsAnswered,
        runningAccuracy: newAccuracy,
      },
    });

    let nextQuestion: QuestionDeliveryItem | null = null;
    if (session.enrollment.exam.isAdaptive) {
      const adaptiveState: AdaptiveState = {
        currentDifficulty: examQuestion.questionVersion.difficulty,
        topicAccuracyMap: {},
        totalDifficulty: 0,
        questionsServed: newQuestionsAnswered,
        runningAccuracy: newAccuracy,
      };
      nextQuestion = await adaptiveEngineService.getNextQuestion(
        sessionId,
        session.enrollment.examId,
        adaptiveState,
      );
    } else {
      nextQuestion = await adaptiveEngineService.getNextQuestionSequential(
        sessionId,
        session.enrollment.examId,
        session.currentQuestionIndex + 1,
      );
    }

    return {
      answer,
      nextQuestion,
      timerState: timerService.getTimerState(
        session.serverDeadline,
        session.totalPausedSeconds,
        session.pausedAt,
      ),
      isLastQuestion: nextQuestion === null,
    };
  }

  async reconnect(sessionId: string) {
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        enrollment: { include: { exam: true } },
      },
    });

    if (!session) throw new NotFoundError("Session not found");
    if (session.finishedAt) throw new BadRequestError("Exam already finished");

    const timerState = timerService.getTimerState(
      session.serverDeadline,
      session.totalPausedSeconds,
      session.pausedAt,
    );

    if (timerState.isExpired) {
      await this.finishSession(sessionId);
      throw new BadRequestError("Time has expired");
    }

    let currentQuestion: QuestionDeliveryItem | null = null;
    if (session.enrollment.exam.isAdaptive) {
      const adaptiveState: AdaptiveState = {
        currentDifficulty: 5,
        topicAccuracyMap: {},
        totalDifficulty: 0,
        questionsServed: session.questionsAnswered,
        runningAccuracy: session.runningAccuracy,
      };
      currentQuestion = await adaptiveEngineService.getNextQuestion(
        sessionId,
        session.enrollment.examId,
        adaptiveState,
      );
    } else {
      currentQuestion = await adaptiveEngineService.getNextQuestionSequential(
        sessionId,
        session.enrollment.examId,
        session.currentQuestionIndex,
      );
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

  async reportViolation(
    sessionId: string,
    type: "TAB_SWITCH" | "FOCUS_LOSS" | "BROWSER_RESIZE",
    metadata?: Record<string, unknown>,
  ) {
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundError("Session not found");
    if (session.finishedAt) return;

    await prisma.violationLog.create({
      data: {
        sessionId,
        type,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });

    if (type === "TAB_SWITCH" || type === "FOCUS_LOSS") {
      const newTabSwitchCount = session.tabSwitchCount + 1;

      if (
        newTabSwitchCount >= proctoringConfig.maxTabSwitches &&
        !session.isLocked
      ) {
        await prisma.examSession.update({
          where: { id: sessionId },
          data: {
            tabSwitchCount: newTabSwitchCount,
            isLocked: true,
            lockedAt: new Date(),
            lockReason: `${newTabSwitchCount} tab switch/focus loss violations detected`,
          },
        });

        await prisma.proctorFlag.create({
          data: {
            sessionId,
            flagType: "TAB_SWITCH",
            description: `${newTabSwitchCount} tab switches detected  exam locked`,
            severity: 4,
          },
        });

        return { locked: true, tabSwitchCount: newTabSwitchCount };
      } else {
        await prisma.examSession.update({
          where: { id: sessionId },
          data: { tabSwitchCount: newTabSwitchCount },
        });

        return {
          locked: false,
          tabSwitchCount: newTabSwitchCount,
          remaining: proctoringConfig.maxTabSwitches - newTabSwitchCount,
        };
      }
    }

    return { locked: false };
  }

  async proctorUnlock(sessionId: string) {
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundError("Session not found");
    if (!session.isLocked) throw new BadRequestError("Session is not locked");

    const now = new Date();
    let additionalPausedSeconds = 0;

    
    if (session.lockedAt) {
      additionalPausedSeconds = timerService.calculateProctorAutoAdjustment(
        session.lockedAt,
        now,
        proctoringConfig.proctorResponseTimeoutMinutes,
      );
    }

    await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        isLocked: false,
        proctorUnlockedAt: now,
        lockReason: null,
        totalPausedSeconds:
          session.totalPausedSeconds + additionalPausedSeconds,
      },
    });

    return {
      unlocked: true,
      additionalTimePausedSeconds: additionalPausedSeconds,
      message:
        additionalPausedSeconds > 0
          ? `Timer adjusted: ${additionalPausedSeconds} seconds added back due to proctor response delay`
          : "Session unlocked",
    };
  }

  
  async extendTime(sessionId: string, additionalMinutes: number) {
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundError("Session not found");
    if (session.finishedAt)
      throw new BadRequestError("Session already finished");

    const newDeadline = new Date(session.serverDeadline);
    newDeadline.setMinutes(newDeadline.getMinutes() + additionalMinutes);

    await prisma.examSession.update({
      where: { id: sessionId },
      data: { serverDeadline: newDeadline },
    });

    return {
      newDeadline,
      remainingSeconds: calculateRemainingSeconds(
        newDeadline,
        session.totalPausedSeconds,
      ),
    };
  }

  
  async finishSession(sessionId: string) {
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: { enrollment: true },
    });

    if (!session) throw new NotFoundError("Session not found");
    if (session.finishedAt) return session;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.examSession.update({
        where: { id: sessionId },
        data: { finishedAt: new Date() },
      });

      await tx.examEnrollment.update({
        where: { id: session.enrollmentId },
        data: { status: EnrollmentStatus.COMPLETED },
      });

      return updated;
    });
  }

  async getSessionStatus(sessionId: string) {
    const session = await prisma.examSession.findUnique({
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

    if (!session) throw new NotFoundError("Session not found");

    const timerState = session.finishedAt
      ? {
          remainingSeconds: 0,
          isExpired: true,
          isPaused: false,
          serverDeadline: session.serverDeadline,
          totalPausedSeconds: session.totalPausedSeconds,
        }
      : timerService.getTimerState(
          session.serverDeadline,
          session.totalPausedSeconds,
          session.pausedAt,
        );

    return {
      session,
      timerState,
    };
  }

  async getQuestionByIndex(sessionId: string, index: number) {
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        enrollment: { include: { exam: true } },
      },
    });

    if (!session) throw new NotFoundError("Session not found");
    if (session.finishedAt) throw new BadRequestError("Exam already finished");
    if (session.enrollment.exam.isAdaptive) {
      throw new BadRequestError("Navigation not supported for adaptive exams");
    }

    const question = await adaptiveEngineService.getNextQuestionSequential(
      sessionId,
      session.enrollment.examId,
      index,
    );

    if (!question) throw new NotFoundError("Question at this index not found");

    
    const answer = await prisma.candidateAnswer.findUnique({
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

  async getSessionQuestionMarkers(sessionId: string) {
    const session = await prisma.examSession.findUnique({
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

    if (!session) throw new NotFoundError("Session not found");

    const answeredIds = new Set(session.answers.map((a) => a.examQuestionId));

    return session.enrollment.exam.questions.map((q) => ({
      id: q.id,
      index: q.orderIndex,
      isAnswered: answeredIds.has(q.id),
    }));
  }

  private getInitialAdaptiveState(): AdaptiveState {
    return {
      currentDifficulty: 5,
      topicAccuracyMap: {},
      totalDifficulty: 0,
      questionsServed: 0,
      runningAccuracy: 0,
    };
  }
}

export const examSessionService = new ExamSessionService();
