"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionService = exports.QuestionService = void 0;
const database_config_1 = __importDefault(require("../../config/database.config"));
const app_error_1 = require("../../utils/app-error");
class QuestionService {
    async create(input, userId, departmentIds) {
        const pool = await database_config_1.default.questionPool.findUnique({
            where: { id: input.poolId },
            include: { department: true },
        });
        if (!pool)
            throw new app_error_1.NotFoundError("Question pool not found");
        if (!departmentIds.includes(pool.departmentId) && !pool.isShared) {
            throw new app_error_1.ForbiddenError("You do not have access to this question pool");
        }
        input.difficulty = Number(input.difficulty) || 1;
        input.marks = Number(input.marks) || 1;
        input.negativeMarks = Number(input.negativeMarks) || 0;
        this.validateQuestionInput(input);
        const result = await database_config_1.default.$transaction(async (tx) => {
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
            await tx.question.update({
                where: { id: question.id },
                data: { currentVersionId: version.id },
            });
            return { question, version };
        });
        return this.getById(result.question.id);
    }
    async update(questionId, input, userId) {
        const question = await database_config_1.default.question.findUnique({
            where: { id: questionId },
            include: {
                versions: { orderBy: { versionNumber: "desc" }, take: 1 },
            },
        });
        if (!question)
            throw new app_error_1.NotFoundError("Question not found");
        const latestVersion = question.versions[0];
        if (!latestVersion)
            throw new app_error_1.BadRequestError("Question has no versions");
        const newVersionNumber = latestVersion.versionNumber + 1;
        const newVersion = await database_config_1.default.$transaction(async (tx) => {
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
                    similarityThreshold: input.similarityThreshold ?? latestVersion.similarityThreshold,
                    codeTemplate: input.codeTemplate ?? latestVersion.codeTemplate,
                    codeLanguage: input.codeLanguage ?? latestVersion.codeLanguage,
                    createdById: userId,
                },
            });
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
            }
            else {
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
            await tx.question.update({
                where: { id: questionId },
                data: { currentVersionId: version.id },
            });
            return version;
        });
        return this.getById(questionId);
    }
    async rollbackVersion(questionId, versionId, userId) {
        const targetVersion = await database_config_1.default.questionVersion.findUnique({
            where: { id: versionId },
            include: { testCases: true },
        });
        if (!targetVersion)
            throw new app_error_1.NotFoundError("Target version not found");
        if (targetVersion.questionId !== questionId) {
            throw new app_error_1.BadRequestError("Version does not belong to this question");
        }
        const question = await database_config_1.default.question.findUnique({
            where: { id: questionId },
            include: {
                versions: { orderBy: { versionNumber: "desc" }, take: 1 },
            },
        });
        if (!question)
            throw new app_error_1.NotFoundError("Question not found");
        const newVersionNumber = question.versions[0].versionNumber + 1;
        await database_config_1.default.$transaction(async (tx) => {
            const version = await tx.questionVersion.create({
                data: {
                    questionId,
                    versionNumber: newVersionNumber,
                    content: targetVersion.content,
                    difficulty: targetVersion.difficulty,
                    marks: targetVersion.marks,
                    negativeMarks: targetVersion.negativeMarks,
                    options: targetVersion.options
                        ? JSON.parse(JSON.stringify(targetVersion.options))
                        : null,
                    correctAnswer: targetVersion.correctAnswer,
                    keywords: targetVersion.keywords
                        ? JSON.parse(JSON.stringify(targetVersion.keywords))
                        : null,
                    similarityThreshold: targetVersion.similarityThreshold,
                    codeTemplate: targetVersion.codeTemplate,
                    codeLanguage: targetVersion.codeLanguage,
                    createdById: userId,
                },
            });
            if (targetVersion.testCases.length > 0) {
                await tx.questionTestCase.createMany({
                    data: targetVersion.testCases.map((tc) => ({
                        questionVersionId: version.id,
                        input: tc.input,
                        expectedOutput: tc.expectedOutput,
                        isHidden: tc.isHidden,
                        timeoutMs: tc.timeoutMs,
                        orderIndex: tc.orderIndex,
                    })),
                });
            }
            await tx.question.update({
                where: { id: questionId },
                data: { currentVersionId: version.id },
            });
        });
        return this.getById(questionId);
    }
    async getById(id) {
        const question = await database_config_1.default.question.findUnique({
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
        if (!question)
            throw new app_error_1.NotFoundError("Question not found");
        return question;
    }
    async getByPool(poolId, pagination, filters) {
        const where = { poolId, isActive: true };
        if (filters?.topic)
            where.topic = { contains: filters.topic, mode: "insensitive" };
        if (filters?.type)
            where.type = filters.type;
        const [questions, total] = await Promise.all([
            database_config_1.default.question.findMany({
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
            database_config_1.default.question.count({ where }),
        ]);
        let filtered = questions;
        if (filters?.difficulty !== undefined) {
            filtered = questions.filter((q) => q.versions[0]?.difficulty === filters.difficulty);
        }
        return { questions: filtered, total };
    }
    async getVersionHistory(questionId) {
        const versions = await database_config_1.default.questionVersion.findMany({
            where: { questionId },
            orderBy: { versionNumber: "desc" },
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true } },
                testCases: { orderBy: { orderIndex: "asc" } },
            },
        });
        return versions;
    }
    async deactivate(questionId) {
        const question = await database_config_1.default.question.findUnique({
            where: { id: questionId },
        });
        if (!question)
            throw new app_error_1.NotFoundError("Question not found");
        return database_config_1.default.question.update({
            where: { id: questionId },
            data: { isActive: false },
        });
    }
    validateQuestionInput(input) {
        if (input.difficulty < 1 || input.difficulty > 10) {
            throw new app_error_1.BadRequestError("Difficulty must be between 1 and 10");
        }
        if (input.marks <= 0) {
            throw new app_error_1.BadRequestError("Marks must be greater than 0");
        }
        if ((input.type === "MCQ" || input.type === "MULTI_SELECT") &&
            (!input.options || input.options.length < 2)) {
            throw new app_error_1.BadRequestError("MCQ and multi-select questions must have at least 2 options");
        }
        if (input.type === "MCQ" && input.options) {
            const correctCount = input.options.filter((o) => o.isCorrect).length;
            if (correctCount !== 1)
                throw new app_error_1.BadRequestError("MCQ must have exactly 1 correct option");
        }
        if (input.type === "MULTI_SELECT" && input.options) {
            const correctCount = input.options.filter((o) => o.isCorrect).length;
            if (correctCount < 1)
                throw new app_error_1.BadRequestError("Multi-select must have at least 1 correct option");
        }
        if (input.type === "FILL_BLANK" && !input.correctAnswer) {
            throw new app_error_1.BadRequestError("Fill-in-blank questions must have a correct answer");
        }
    }
}
exports.QuestionService = QuestionService;
exports.questionService = new QuestionService();
//# sourceMappingURL=question.service.js.map