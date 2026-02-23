import prisma from "../../config/database.config";
import { NotFoundError } from "../../utils/app-error";
import { integrityService } from "../../services/integrity.service";
import {
  QuestionAnalytics,
  DistractorInfo,
  CandidateIntegrityReport,
} from "../../types/grading.types";

export class AnalyticsService {
  async getQuestionDifficultyIndex(examQuestionId: string): Promise<number> {
    const answers = await prisma.candidateAnswer.findMany({
      where: { examQuestionId },
      include: {
        examQuestion: {
          include: { questionVersion: { select: { marks: true } } },
        },
      },
    });

    if (answers.length === 0) return 0;

    const correctCount = answers.filter(
      (a) =>
        a.finalScore !== null &&
        a.finalScore >= a.examQuestion.questionVersion.marks,
    ).length;

    return correctCount / answers.length;
  }

  async getDiscriminationIndex(
    examId: string,
    examQuestionId: string,
  ): Promise<number> {
    const results = await prisma.examResult.findMany({
      where: { enrollment: { examId } },
      orderBy: { totalScore: "desc" },
    });

    if (results.length < 4) return 0;

    const n27 = Math.max(1, Math.floor(results.length * 0.27));
    const topGroup = results.slice(0, n27).map((r) => r.enrollmentId);
    const bottomGroup = results.slice(-n27).map((r) => r.enrollmentId);

    const topAnswers = await prisma.candidateAnswer.findMany({
      where: {
        examQuestionId,
        session: { enrollmentId: { in: topGroup } },
      },
      include: {
        examQuestion: {
          include: { questionVersion: { select: { marks: true } } },
        },
      },
    });

    const bottomAnswers = await prisma.candidateAnswer.findMany({
      where: {
        examQuestionId,
        session: { enrollmentId: { in: bottomGroup } },
      },
      include: {
        examQuestion: {
          include: { questionVersion: { select: { marks: true } } },
        },
      },
    });

    const topCorrectRate =
      topAnswers.length > 0
        ? topAnswers.filter(
            (a) =>
              a.finalScore !== null &&
              a.finalScore >= a.examQuestion.questionVersion.marks,
          ).length / topAnswers.length
        : 0;

    const bottomCorrectRate =
      bottomAnswers.length > 0
        ? bottomAnswers.filter(
            (a) =>
              a.finalScore !== null &&
              a.finalScore >= a.examQuestion.questionVersion.marks,
          ).length / bottomAnswers.length
        : 0;

    return topCorrectRate - bottomCorrectRate;
  }

  async getDistractorAnalysis(
    examQuestionId: string,
  ): Promise<DistractorInfo[]> {
    const examQuestion = await prisma.examQuestion.findUnique({
      where: { id: examQuestionId },
      include: { questionVersion: true },
    });

    if (!examQuestion) throw new NotFoundError("Exam question not found");

    const options = examQuestion.questionVersion.options as
      | { id: string; text: string; isCorrect: boolean }[]
      | null;
    if (!options) return [];

    const answers = await prisma.candidateAnswer.findMany({
      where: { examQuestionId },
    });

    const selectionCounts = new Map<string, number>();
    for (const option of options) {
      selectionCounts.set(option.id, 0);
    }

    for (const answer of answers) {
      if (answer.answerContent) {
        try {
          const selected = answer.answerContent.startsWith("[")
            ? (JSON.parse(answer.answerContent) as string[])
            : [answer.answerContent];

          for (const sel of selected) {
            selectionCounts.set(sel, (selectionCounts.get(sel) || 0) + 1);
          }
        } catch {
          selectionCounts.set(
            answer.answerContent,
            (selectionCounts.get(answer.answerContent) || 0) + 1,
          );
        }
      }
    }

    const totalAnswers = answers.length || 1;

    return options.map((option) => ({
      optionId: option.id,
      optionText: option.text,
      selectionCount: selectionCounts.get(option.id) || 0,
      selectionPercentage:
        ((selectionCounts.get(option.id) || 0) / totalAnswers) * 100,
    }));
  }

  async getExamAnalytics(examId: string): Promise<QuestionAnalytics[]> {
    const examQuestions = await prisma.examQuestion.findMany({
      where: { examId },
      include: {
        question: { select: { id: true, topic: true, type: true } },
        questionVersion: { select: { difficulty: true, options: true } },
      },
    });

    const analytics: QuestionAnalytics[] = [];

    for (const eq of examQuestions) {
      const difficultyIndex = await this.getQuestionDifficultyIndex(eq.id);
      const discriminationIndex = await this.getDiscriminationIndex(
        examId,
        eq.id,
      );
      const distractorAnalysis =
        eq.question.type === "MCQ" || eq.question.type === "MULTI_SELECT"
          ? await this.getDistractorAnalysis(eq.id)
          : [];

      let flagged = false;
      let flagReason: string | null = null;

      if (difficultyIndex < 0.2) {
        flagged = true;
        flagReason = "Too difficult (< 20% correct)";
      } else if (difficultyIndex > 0.8) {
        flagged = true;
        flagReason = "Too easy (> 80% correct)";
      }

      if (discriminationIndex < 0.2) {
        flagged = true;
        flagReason =
          (flagReason ? flagReason + "; " : "") + "Poor discrimination (< 0.2)";
      }

      analytics.push({
        questionId: eq.question.id,
        difficultyIndex: Math.round(difficultyIndex * 1000) / 1000,
        discriminationIndex: Math.round(discriminationIndex * 1000) / 1000,
        distractorAnalysis,
        flaggedForReview: flagged,
        flagReason,
      });
    }

    return analytics;
  }

  async getIntegrityReport(
    examId: string,
  ): Promise<CandidateIntegrityReport[]> {
    return integrityService.generateExamIntegrityReport(examId);
  }
}

export const analyticsService = new AnalyticsService();
