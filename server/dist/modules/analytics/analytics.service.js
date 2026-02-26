"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = exports.AnalyticsService = void 0;
const database_config_1 = __importDefault(require("../../config/database.config"));
const app_error_1 = require("../../utils/app-error");
const integrity_service_1 = require("../../services/integrity.service");
class AnalyticsService {
    async getQuestionDifficultyIndex(examQuestionId) {
        const answers = await database_config_1.default.candidateAnswer.findMany({
            where: { examQuestionId },
            include: {
                examQuestion: {
                    include: { questionVersion: { select: { marks: true } } },
                },
            },
        });
        if (answers.length === 0)
            return 0;
        const correctCount = answers.filter((a) => a.finalScore !== null &&
            a.finalScore >= a.examQuestion.questionVersion.marks).length;
        return correctCount / answers.length;
    }
    async getDiscriminationIndex(examId, examQuestionId) {
        const results = await database_config_1.default.examResult.findMany({
            where: { enrollment: { examId } },
            orderBy: { totalScore: "desc" },
        });
        if (results.length < 4)
            return 0;
        const n27 = Math.max(1, Math.floor(results.length * 0.27));
        const topGroup = results.slice(0, n27).map((r) => r.enrollmentId);
        const bottomGroup = results.slice(-n27).map((r) => r.enrollmentId);
        const topAnswers = await database_config_1.default.candidateAnswer.findMany({
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
        const bottomAnswers = await database_config_1.default.candidateAnswer.findMany({
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
        const topCorrectRate = topAnswers.length > 0
            ? topAnswers.filter((a) => a.finalScore !== null &&
                a.finalScore >= a.examQuestion.questionVersion.marks).length / topAnswers.length
            : 0;
        const bottomCorrectRate = bottomAnswers.length > 0
            ? bottomAnswers.filter((a) => a.finalScore !== null &&
                a.finalScore >= a.examQuestion.questionVersion.marks).length / bottomAnswers.length
            : 0;
        return topCorrectRate - bottomCorrectRate;
    }
    async getDistractorAnalysis(examQuestionId) {
        const examQuestion = await database_config_1.default.examQuestion.findUnique({
            where: { id: examQuestionId },
            include: { questionVersion: true },
        });
        if (!examQuestion)
            throw new app_error_1.NotFoundError("Exam question not found");
        const options = examQuestion.questionVersion.options;
        if (!options)
            return [];
        const answers = await database_config_1.default.candidateAnswer.findMany({
            where: { examQuestionId },
        });
        const selectionCounts = new Map();
        for (const option of options) {
            selectionCounts.set(option.id, 0);
        }
        for (const answer of answers) {
            if (answer.answerContent) {
                try {
                    const selected = answer.answerContent.startsWith("[")
                        ? JSON.parse(answer.answerContent)
                        : [answer.answerContent];
                    for (const sel of selected) {
                        selectionCounts.set(sel, (selectionCounts.get(sel) || 0) + 1);
                    }
                }
                catch {
                    selectionCounts.set(answer.answerContent, (selectionCounts.get(answer.answerContent) || 0) + 1);
                }
            }
        }
        const totalAnswers = answers.length || 1;
        return options.map((option) => ({
            optionId: option.id,
            optionText: option.text,
            selectionCount: selectionCounts.get(option.id) || 0,
            selectionPercentage: ((selectionCounts.get(option.id) || 0) / totalAnswers) * 100,
        }));
    }
    async getExamAnalytics(examId) {
        const examQuestions = await database_config_1.default.examQuestion.findMany({
            where: { examId },
            include: {
                question: { select: { id: true, topic: true, type: true } },
                questionVersion: { select: { difficulty: true, options: true } },
            },
        });
        const analytics = [];
        for (const eq of examQuestions) {
            const difficultyIndex = await this.getQuestionDifficultyIndex(eq.id);
            const discriminationIndex = await this.getDiscriminationIndex(examId, eq.id);
            const distractorAnalysis = eq.question.type === "MCQ" || eq.question.type === "MULTI_SELECT"
                ? await this.getDistractorAnalysis(eq.id)
                : [];
            let flagged = false;
            let flagReason = null;
            if (difficultyIndex < 0.2) {
                flagged = true;
                flagReason = "Too difficult (< 20% correct)";
            }
            else if (difficultyIndex > 0.8) {
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
    async getIntegrityReport(examId) {
        return integrity_service_1.integrityService.generateExamIntegrityReport(examId);
    }
}
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();
//# sourceMappingURL=analytics.service.js.map