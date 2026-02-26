import { QuestionType } from "@prisma/client";
export interface CreateQuestionRequestDTO {
    poolId: string;
    type: QuestionType;
    topic: string;
    content: string;
    difficulty: number;
    marks: number;
    negativeMarks?: number;
    options?: {
        id: string;
        text: string;
        isCorrect: boolean;
    }[];
    correctAnswer?: string;
    keywords?: {
        keyword: string;
        weight: number;
    }[];
    similarityThreshold?: number;
    codeTemplate?: string;
    codeLanguage?: string;
    testCases?: TestCaseDTO[];
}
export interface UpdateQuestionRequestDTO {
    content?: string;
    difficulty?: number;
    marks?: number;
    negativeMarks?: number;
    options?: {
        id: string;
        text: string;
        isCorrect: boolean;
    }[];
    correctAnswer?: string;
    keywords?: {
        keyword: string;
        weight: number;
    }[];
    similarityThreshold?: number;
    codeTemplate?: string;
    codeLanguage?: string;
    testCases?: TestCaseDTO[];
}
export interface TestCaseDTO {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    timeoutMs?: number;
}
export interface QuestionListItemDTO {
    id: string;
    type: QuestionType;
    topic: string;
    isActive: boolean;
    createdAt: Date;
    currentVersion: QuestionVersionSummaryDTO | null;
    _count: {
        versions: number;
    };
}
export interface QuestionDetailDTO {
    id: string;
    type: QuestionType;
    topic: string;
    isActive: boolean;
    createdAt: Date;
    pool: {
        id: string;
        name: string;
        departmentId: string;
    };
    createdBy: {
        id: string;
        firstName: string;
        lastName: string;
    };
    versions: QuestionVersionSummaryDTO[];
}
export interface QuestionVersionSummaryDTO {
    id: string;
    versionNumber: number;
    content: string;
    difficulty: number;
    marks: number;
    negativeMarks: number;
    createdAt: Date;
}
export interface QuestionListResponseDTO {
    questions: QuestionListItemDTO[];
    total: number;
}
//# sourceMappingURL=question.dto.d.ts.map