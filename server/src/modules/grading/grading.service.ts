import prisma from "../../config/database.config";
import { NotFoundError, BadRequestError } from "../../utils/app-error";
import { QuestionType } from "@prisma/client";
import { similarityService } from "../../services/similarity.service";
import { codeExecutorService } from "../../services/code-executor.service";
import { GradingResult, McqOption, KeywordConfig } from "../../types";

export class GradingService {
  
  async autoGradeSession(sessionId: string) {
    const answers = await prisma.candidateAnswer.findMany({
      where: { sessionId, isGraded: false },
      include: {
        examQuestion: {
          include: {
            questionVersion: {
              include: { testCases: { orderBy: { orderIndex: "asc" } } },
            },
            question: true,
          },
        },
      },
    });

    const results: { answerId: string; score: number; maxScore: number }[] = [];

    for (const answer of answers) {
      const version = answer.examQuestion.questionVersion;
      const type = answer.examQuestion.question.type;

      const gradingResult = await this.gradeAnswer(
        type,
        answer.answerContent,
        answer.codeSubmission,
        version.options as McqOption[] | null,
        version.correctAnswer,
        version.keywords as KeywordConfig[] | null,
        version.similarityThreshold,
        version.marks,
        version.codeLanguage,
        version.testCases.map((tc) => ({
          id: tc.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden,
          timeoutMs: tc.timeoutMs,
        })),
      );

      await prisma.candidateAnswer.update({
        where: { id: answer.id },
        data: {
          autoScore: gradingResult.score,
          finalScore: gradingResult.score,
          isGraded: true,
        },
      });

      results.push({
        answerId: answer.id,
        score: gradingResult.score,
        maxScore: gradingResult.maxScore,
      });
    }

    return results;
  }

  
  async gradeAnswer(
    type: QuestionType,
    answerContent: string | null,
    codeSubmission: string | null,
    options: McqOption[] | null,
    correctAnswer: string | null,
    keywords: KeywordConfig[] | null,
    similarityThreshold: number | null,
    marks: number,
    codeLanguage: string | null,
    testCases: {
      id: string;
      input: string;
      expectedOutput: string;
      isHidden: boolean;
      timeoutMs: number;
    }[],
  ): Promise<GradingResult> {
    switch (type) {
      case QuestionType.MCQ:
        return this.gradeMcq(answerContent, options, marks);
      case QuestionType.MULTI_SELECT:
        return this.gradeMultiSelect(answerContent, options, marks);
      case QuestionType.FILL_BLANK:
        return this.gradeFillBlank(answerContent, correctAnswer, marks);
      case QuestionType.SHORT_ANSWER:
        return this.gradeShortAnswer(
          answerContent,
          keywords,
          similarityThreshold || 0.7,
          marks,
        );
      case QuestionType.CODE:
        return this.gradeCode(
          codeSubmission,
          codeLanguage || "javascript",
          testCases,
          marks,
        );
      default:
        return {
          score: 0,
          maxScore: marks,
          isPartialCredit: false,
          details: "Unknown question type",
        };
    }
  }

  
  private gradeMcq(
    answerContent: string | null,
    options: McqOption[] | null,
    marks: number,
  ): GradingResult {
    if (!answerContent || !options) {
      return {
        score: 0,
        maxScore: marks,
        isPartialCredit: false,
        details: "No answer provided",
      };
    }

    const correctOption = options.find((o) => o.isCorrect);
    const isCorrect = correctOption?.id === answerContent;

    return {
      score: isCorrect ? marks : 0,
      maxScore: marks,
      isPartialCredit: false,
      details: isCorrect ? "Correct" : "Incorrect",
    };
  }

  
  private gradeMultiSelect(
    answerContent: string | null,
    options: McqOption[] | null,
    marks: number,
  ): GradingResult {
    if (!answerContent || !options) {
      return {
        score: 0,
        maxScore: marks,
        isPartialCredit: false,
        details: "No answer provided",
      };
    }

    let selectedIds: string[];
    try {
      selectedIds = JSON.parse(answerContent) as string[];
    } catch {
      return {
        score: 0,
        maxScore: marks,
        isPartialCredit: false,
        details: "Invalid answer format",
      };
    }

    const correctOptionIds = new Set(
      options.filter((o) => o.isCorrect).map((o) => o.id),
    );
    const totalCorrect = correctOptionIds.size;

    if (totalCorrect === 0) {
      return {
        score: 0,
        maxScore: marks,
        isPartialCredit: false,
        details: "No correct options defined",
      };
    }

    let correctSelected = 0;
    let wrongSelected = 0;

    for (const selectedId of selectedIds) {
      if (correctOptionIds.has(selectedId)) {
        correctSelected++;
      } else {
        wrongSelected++;
      }
    }

    
    const rawScore = Math.max(
      0,
      (correctSelected - wrongSelected) / totalCorrect,
    );
    const score = rawScore * marks;

    return {
      score: Math.round(score * 100) / 100,
      maxScore: marks,
      isPartialCredit: score > 0 && score < marks,
      details: `${correctSelected}/${totalCorrect} correct, ${wrongSelected} wrong selections`,
    };
  }

  
  private gradeFillBlank(
    answerContent: string | null,
    correctAnswer: string | null,
    marks: number,
  ): GradingResult {
    if (!answerContent || !correctAnswer) {
      return {
        score: 0,
        maxScore: marks,
        isPartialCredit: false,
        details: "No answer provided",
      };
    }

    const isCorrect =
      answerContent.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

    return {
      score: isCorrect ? marks : 0,
      maxScore: marks,
      isPartialCredit: false,
      details: isCorrect ? "Correct" : "Incorrect",
    };
  }

  
  private gradeShortAnswer(
    answerContent: string | null,
    keywords: KeywordConfig[] | null,
    threshold: number,
    marks: number,
  ): GradingResult {
    if (!answerContent || !keywords || keywords.length === 0) {
      return {
        score: 0,
        maxScore: marks,
        isPartialCredit: false,
        details: "No answer or keywords",
      };
    }

    const result = similarityService.scoreShortAnswer(
      answerContent,
      keywords.map((k) => ({ keyword: k.keyword, weight: k.weight })),
      threshold,
    );

    const score = result.score * marks;

    return {
      score: Math.round(score * 100) / 100,
      maxScore: marks,
      isPartialCredit: score > 0 && score < marks,
      details: `Matched keywords: ${result.matchedKeywords.join(", ")}. Unmatched: ${result.unmatchedKeywords.join(", ")}`,
    };
  }

  
  private async gradeCode(
    codeSubmission: string | null,
    language: string,
    testCases: {
      id: string;
      input: string;
      expectedOutput: string;
      isHidden: boolean;
      timeoutMs: number;
    }[],
    marks: number,
  ): Promise<GradingResult> {
    if (!codeSubmission || testCases.length === 0) {
      return {
        score: 0,
        maxScore: marks,
        isPartialCredit: false,
        details: "No code submitted or no test cases",
      };
    }

    const executionResult = await codeExecutorService.execute(
      codeSubmission,
      language,
      testCases,
    );

    if (executionResult.compilationError) {
      return {
        score: 0,
        maxScore: marks,
        isPartialCredit: false,
        details: `Compilation error: ${executionResult.compilationError}`,
      };
    }

    const score =
      (executionResult.totalPassed / executionResult.totalTests) * marks;

    return {
      score: Math.round(score * 100) / 100,
      maxScore: marks,
      isPartialCredit: score > 0 && score < marks,
      details: `${executionResult.totalPassed}/${executionResult.totalTests} test cases passed`,
    };
  }

  
  async overrideScore(
    answerId: string,
    manualScore: number,
    gradedById: string,
  ) {
    const answer = await prisma.candidateAnswer.findUnique({
      where: { id: answerId },
      include: { examQuestion: { include: { questionVersion: true } } },
    });

    if (!answer) throw new NotFoundError("Answer not found");

    if (
      manualScore < 0 ||
      manualScore > answer.examQuestion.questionVersion.marks
    ) {
      throw new BadRequestError(
        `Score must be between 0 and ${answer.examQuestion.questionVersion.marks}`,
      );
    }

    return prisma.candidateAnswer.update({
      where: { id: answerId },
      data: {
        manualScore,
        finalScore: manualScore,
        isGraded: true,
        gradedById,
      },
    });
  }
}

export const gradingService = new GradingService();
