"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gradingService = exports.GradingService = void 0;
const database_config_1 = __importDefault(require("../../config/database.config"));
const app_error_1 = require("../../utils/app-error");
const client_1 = require("@prisma/client");
const similarity_service_1 = require("../../services/similarity.service");
const code_executor_service_1 = require("../../services/code-executor.service");
class GradingService {
    async autoGradeSession(sessionId) {
        const answers = await database_config_1.default.candidateAnswer.findMany({
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
        const results = [];
        for (const answer of answers) {
            const version = answer.examQuestion.questionVersion;
            const type = answer.examQuestion.question.type;
            const gradingResult = await this.gradeAnswer(type, answer.answerContent, answer.codeSubmission, version.options, version.correctAnswer, version.keywords, version.similarityThreshold, version.marks, version.codeLanguage, version.testCases.map((tc) => ({
                id: tc.id,
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                isHidden: tc.isHidden,
                timeoutMs: tc.timeoutMs,
            })));
            await database_config_1.default.candidateAnswer.update({
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
    async gradeAnswer(type, answerContent, codeSubmission, options, correctAnswer, keywords, similarityThreshold, marks, codeLanguage, testCases) {
        switch (type) {
            case client_1.QuestionType.MCQ:
                return this.gradeMcq(answerContent, options, marks);
            case client_1.QuestionType.MULTI_SELECT:
                return this.gradeMultiSelect(answerContent, options, marks);
            case client_1.QuestionType.FILL_BLANK:
                return this.gradeFillBlank(answerContent, correctAnswer, marks);
            case client_1.QuestionType.SHORT_ANSWER:
                return this.gradeShortAnswer(answerContent, keywords, similarityThreshold || 0.7, marks);
            case client_1.QuestionType.CODE:
                return this.gradeCode(codeSubmission, codeLanguage || "javascript", testCases, marks);
            default:
                return {
                    score: 0,
                    maxScore: marks,
                    isPartialCredit: false,
                    details: "Unknown question type",
                };
        }
    }
    gradeMcq(answerContent, options, marks) {
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
    gradeMultiSelect(answerContent, options, marks) {
        if (!answerContent || !options) {
            return {
                score: 0,
                maxScore: marks,
                isPartialCredit: false,
                details: "No answer provided",
            };
        }
        let selectedIds;
        try {
            selectedIds = JSON.parse(answerContent);
        }
        catch {
            return {
                score: 0,
                maxScore: marks,
                isPartialCredit: false,
                details: "Invalid answer format",
            };
        }
        const correctOptionIds = new Set(options.filter((o) => o.isCorrect).map((o) => o.id));
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
            }
            else {
                wrongSelected++;
            }
        }
        const rawScore = Math.max(0, (correctSelected - wrongSelected) / totalCorrect);
        const score = rawScore * marks;
        return {
            score: Math.round(score * 100) / 100,
            maxScore: marks,
            isPartialCredit: score > 0 && score < marks,
            details: `${correctSelected}/${totalCorrect} correct, ${wrongSelected} wrong selections`,
        };
    }
    gradeFillBlank(answerContent, correctAnswer, marks) {
        if (!answerContent || !correctAnswer) {
            return {
                score: 0,
                maxScore: marks,
                isPartialCredit: false,
                details: "No answer provided",
            };
        }
        const isCorrect = answerContent.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
        return {
            score: isCorrect ? marks : 0,
            maxScore: marks,
            isPartialCredit: false,
            details: isCorrect ? "Correct" : "Incorrect",
        };
    }
    gradeShortAnswer(answerContent, keywords, threshold, marks) {
        if (!answerContent || !keywords || keywords.length === 0) {
            return {
                score: 0,
                maxScore: marks,
                isPartialCredit: false,
                details: "No answer or keywords",
            };
        }
        const result = similarity_service_1.similarityService.scoreShortAnswer(answerContent, keywords.map((k) => ({ keyword: k.keyword, weight: k.weight })), threshold);
        const score = result.score * marks;
        return {
            score: Math.round(score * 100) / 100,
            maxScore: marks,
            isPartialCredit: score > 0 && score < marks,
            details: `Matched keywords: ${result.matchedKeywords.join(", ")}. Unmatched: ${result.unmatchedKeywords.join(", ")}`,
        };
    }
    async gradeCode(codeSubmission, language, testCases, marks) {
        if (!codeSubmission || testCases.length === 0) {
            return {
                score: 0,
                maxScore: marks,
                isPartialCredit: false,
                details: "No code submitted or no test cases",
            };
        }
        const executionResult = await code_executor_service_1.codeExecutorService.execute(codeSubmission, language, testCases);
        if (executionResult.compilationError) {
            return {
                score: 0,
                maxScore: marks,
                isPartialCredit: false,
                details: `Compilation error: ${executionResult.compilationError}`,
            };
        }
        const score = (executionResult.totalPassed / executionResult.totalTests) * marks;
        return {
            score: Math.round(score * 100) / 100,
            maxScore: marks,
            isPartialCredit: score > 0 && score < marks,
            details: `${executionResult.totalPassed}/${executionResult.totalTests} test cases passed`,
        };
    }
    async overrideScore(answerId, manualScore, gradedById) {
        const answer = await database_config_1.default.candidateAnswer.findUnique({
            where: { id: answerId },
            include: { examQuestion: { include: { questionVersion: true } } },
        });
        if (!answer)
            throw new app_error_1.NotFoundError("Answer not found");
        if (manualScore < 0 ||
            manualScore > answer.examQuestion.questionVersion.marks) {
            throw new app_error_1.BadRequestError(`Score must be between 0 and ${answer.examQuestion.questionVersion.marks}`);
        }
        return database_config_1.default.candidateAnswer.update({
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
exports.GradingService = GradingService;
exports.gradingService = new GradingService();
//# sourceMappingURL=grading.service.js.map