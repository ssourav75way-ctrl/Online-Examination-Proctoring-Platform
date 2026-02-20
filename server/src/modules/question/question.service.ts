import prisma from "../../config/database.config";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../../utils/app-error";
import { QuestionType } from "@prisma/client";
import { PaginationParams } from "../../utils/pagination.util";
import { McqOption, KeywordConfig } from "../../types/exam.types";

interface CreateQuestionInput {
  poolId: string;
  type: QuestionType;
  topic: string;
  content: string;
  difficulty: number;
  marks: number;
  negativeMarks?: number;
  options?: McqOption[];
  correctAnswer?: string;
  keywords?: KeywordConfig[];
  similarityThreshold?: number;
  codeTemplate?: string;
  codeLanguage?: string;
  testCases?: {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    timeoutMs?: number;
  }[];
}

interface UpdateQuestionInput {
  content?: string;
  difficulty?: number;
  marks?: number;
  negativeMarks?: number;
  options?: McqOption[];
  correctAnswer?: string;
  keywords?: KeywordConfig[];
  similarityThreshold?: number;
  codeTemplate?: string;
  codeLanguage?: string;
  testCases?: {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    timeoutMs?: number;
  }[];
}

export class QuestionService {
  /**
   * Create a question with its first version.
   * Examiner can only create questions in pools they have access to.
   */
  async create(
    input: CreateQuestionInput,
    userId: string,
    departmentIds: string[],
  ) {
    // Verify pool exists and user has access
    const pool = await prisma.questionPool.findUnique({
      where: { id: input.poolId },
      include: { department: true },
    });

    if (!pool) throw new NotFoundError("Question pool not found");

    // Check department access (examiners can only tag questions to pools they have access to)
    if (!departmentIds.includes(pool.departmentId) && !pool.isShared) {
      throw new ForbiddenError("You do not have access to this question pool");
    }

    this.validateQuestionInput(input);

    // Create question and version 1 in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: {
          poolId: input.poolId,
          type: input.type,
          topic: input.topic,
          createdById: userId,
        },
      });

      const version = await tx.questionVersion.create({
        data: {
          questionId: question.id,
          versionNumber: 1,
          content: input.content,
          difficulty: input.difficulty,
          marks: input.marks,
          negativeMarks: input.negativeMarks || 0,
          options: input.options
            ? JSON.parse(JSON.stringify(input.options))
            : null,
          correctAnswer: input.correctAnswer,
          keywords: input.keywords
            ? JSON.parse(JSON.stringify(input.keywords))
            : null,
          similarityThreshold: input.similarityThreshold,
          codeTemplate: input.codeTemplate,
          codeLanguage: input.codeLanguage,
          createdById: userId,
        },
      });

      // Create test cases if provided
      if (input.testCases && input.testCases.length > 0) {
        await tx.questionTestCase.createMany({
          data: input.testCases.map((tc, idx) => ({
            questionVersionId: version.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden,
            timeoutMs: tc.timeoutMs || 5000,
            orderIndex: idx,
          })),
        });
      }

      // Update question with current version reference
      await tx.question.update({
        where: { id: question.id },
        data: { currentVersionId: version.id },
      });

      return { question, version };
    });

    return this.getById(result.question.id);
  }

  /**
   * Edit a question — creates a NEW version. Previous versions are preserved.
   * If exam is in progress or scheduled, it stays pinned to the version at scheduling time.
   */
  async update(questionId: string, input: UpdateQuestionInput, userId: string) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
      },
    });

    if (!question) throw new NotFoundError("Question not found");

    const latestVersion = question.versions[0];
    if (!latestVersion) throw new BadRequestError("Question has no versions");

    const newVersionNumber = latestVersion.versionNumber + 1;

    // Create new version (old versions are preserved, pinned exams unaffected)
    const newVersion = await prisma.$transaction(async (tx) => {
      const version = await tx.questionVersion.create({
        data: {
          questionId,
          versionNumber: newVersionNumber,
          content: input.content ?? latestVersion.content,
          difficulty: input.difficulty ?? latestVersion.difficulty,
          marks: input.marks ?? latestVersion.marks,
          negativeMarks: input.negativeMarks ?? latestVersion.negativeMarks,
          options: input.options
            ? JSON.parse(JSON.stringify(input.options))
            : latestVersion.options,
          correctAnswer: input.correctAnswer ?? latestVersion.correctAnswer,
          keywords: input.keywords
            ? JSON.parse(JSON.stringify(input.keywords))
            : latestVersion.keywords,
          similarityThreshold:
            input.similarityThreshold ?? latestVersion.similarityThreshold,
          codeTemplate: input.codeTemplate ?? latestVersion.codeTemplate,
          codeLanguage: input.codeLanguage ?? latestVersion.codeLanguage,
          createdById: userId,
        },
      });

      // Create test cases for new version
      if (input.testCases) {
        await tx.questionTestCase.createMany({
          data: input.testCases.map((tc, idx) => ({
            questionVersionId: version.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden,
            timeoutMs: tc.timeoutMs || 5000,
            orderIndex: idx,
          })),
        });
      } else {
        // Copy test cases from previous version
        const prevTestCases = await tx.questionTestCase.findMany({
          where: { questionVersionId: latestVersion.id },
          orderBy: { orderIndex: "asc" },
        });

        if (prevTestCases.length > 0) {
          await tx.questionTestCase.createMany({
            data: prevTestCases.map((tc) => ({
              questionVersionId: version.id,
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              isHidden: tc.isHidden,
              timeoutMs: tc.timeoutMs,
              orderIndex: tc.orderIndex,
            })),
          });
        }
      }

      // Update current version pointer
      await tx.question.update({
        where: { id: questionId },
        data: { currentVersionId: version.id },
      });

      return version;
    });

    return this.getById(questionId);
  }

  async getById(id: string) {
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        pool: {
          include: {
            department: {
              select: { id: true, name: true, institutionId: true },
            },
          },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        versions: {
          orderBy: { versionNumber: "desc" },
          include: {
            testCases: { orderBy: { orderIndex: "asc" } },
          },
        },
      },
    });

    if (!question) throw new NotFoundError("Question not found");
    return question;
  }

  async getByPool(
    poolId: string,
    pagination: PaginationParams,
    filters?: {
      topic?: string;
      type?: QuestionType;
      difficulty?: number;
    },
  ) {
    const where: Record<string, unknown> = { poolId, isActive: true };
    if (filters?.topic)
      where.topic = { contains: filters.topic, mode: "insensitive" };
    if (filters?.type) where.type = filters.type;

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        include: {
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
            select: {
              id: true,
              versionNumber: true,
              content: true,
              difficulty: true,
              marks: true,
              createdAt: true,
            },
          },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.question.count({ where }),
    ]);

    // Filter by difficulty on the latest version if needed
    let filtered = questions;
    if (filters?.difficulty !== undefined) {
      filtered = questions.filter(
        (q) => q.versions[0]?.difficulty === filters.difficulty,
      );
    }

    return { questions: filtered, total };
  }

  async getVersionHistory(questionId: string) {
    const versions = await prisma.questionVersion.findMany({
      where: { questionId },
      orderBy: { versionNumber: "desc" },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        testCases: { orderBy: { orderIndex: "asc" } },
      },
    });

    return versions;
  }

  async deactivate(questionId: string) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question) throw new NotFoundError("Question not found");
    return prisma.question.update({
      where: { id: questionId },
      data: { isActive: false },
    });
  }

  private validateQuestionInput(input: CreateQuestionInput): void {
    if (input.difficulty < 1 || input.difficulty > 10) {
      throw new BadRequestError("Difficulty must be between 1 and 10");
    }

    if (input.marks <= 0) {
      throw new BadRequestError("Marks must be greater than 0");
    }

    if (
      (input.type === "MCQ" || input.type === "MULTI_SELECT") &&
      (!input.options || input.options.length < 2)
    ) {
      throw new BadRequestError(
        "MCQ and multi-select questions must have at least 2 options",
      );
    }

    if (input.type === "MCQ" && input.options) {
      const correctCount = input.options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1)
        throw new BadRequestError("MCQ must have exactly 1 correct option");
    }

    if (input.type === "MULTI_SELECT" && input.options) {
      const correctCount = input.options.filter((o) => o.isCorrect).length;
      if (correctCount < 1)
        throw new BadRequestError(
          "Multi-select must have at least 1 correct option",
        );
    }

    if (input.type === "FILL_BLANK" && !input.correctAnswer) {
      throw new BadRequestError(
        "Fill-in-blank questions must have a correct answer",
      );
    }

    if (
      input.type === "CODE" &&
      (!input.testCases || input.testCases.length === 0)
    ) {
      throw new BadRequestError(
        "Code questions must have at least 1 test case",
      );
    }

    if (
      input.type === "SHORT_ANSWER" &&
      (!input.keywords || input.keywords.length === 0)
    ) {
      throw new BadRequestError("Short answer questions must have keywords");
    }
  }
}

export const questionService = new QuestionService();
