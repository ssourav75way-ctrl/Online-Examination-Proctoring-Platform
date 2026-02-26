import { QuestionType } from "@prisma/client";
import { GradingResult, McqOption, KeywordConfig } from "../../types";
export declare class GradingService {
    autoGradeSession(sessionId: string): Promise<{
        answerId: string;
        score: number;
        maxScore: number;
    }[]>;
    gradeAnswer(type: QuestionType, answerContent: string | null, codeSubmission: string | null, options: McqOption[] | null, correctAnswer: string | null, keywords: KeywordConfig[] | null, similarityThreshold: number | null, marks: number, codeLanguage: string | null, testCases: {
        id: string;
        input: string;
        expectedOutput: string;
        isHidden: boolean;
        timeoutMs: number;
    }[]): Promise<GradingResult>;
    private gradeMcq;
    private gradeMultiSelect;
    private gradeFillBlank;
    private gradeShortAnswer;
    private gradeCode;
    overrideScore(answerId: string, manualScore: number, gradedById: string): Promise<{
        id: string;
        sessionId: string;
        examQuestionId: string;
        answerContent: string | null;
        codeSubmission: string | null;
        answeredAt: Date;
        timeTakenSeconds: number;
        autoScore: number | null;
        manualScore: number | null;
        finalScore: number | null;
        isGraded: boolean;
        gradedById: string | null;
    }>;
}
export declare const gradingService: GradingService;
//# sourceMappingURL=grading.service.d.ts.map