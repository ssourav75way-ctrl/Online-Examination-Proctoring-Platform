import { QuestionType } from "@prisma/client";
import { PaginationParams } from "../../utils/pagination.util";
import { CreateQuestionInput, UpdateQuestionInput } from "../../types/modules/question.types";
export declare class QuestionService {
    create(input: CreateQuestionInput, userId: string, departmentIds: string[]): Promise<{
        versions: ({
            testCases: {
                id: string;
                orderIndex: number;
                questionVersionId: string;
                input: string;
                expectedOutput: string;
                isHidden: boolean;
                timeoutMs: number;
            }[];
        } & {
            id: string;
            createdAt: Date;
            createdById: string;
            questionId: string;
            versionNumber: number;
            content: string;
            difficulty: number;
            marks: number;
            negativeMarks: number;
            options: import("@prisma/client/runtime/client").JsonValue | null;
            correctAnswer: string | null;
            keywords: import("@prisma/client/runtime/client").JsonValue | null;
            similarityThreshold: number | null;
            codeTemplate: string | null;
            codeLanguage: string | null;
            isLatest: boolean;
        })[];
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        pool: {
            department: {
                name: string;
                id: string;
                institutionId: string;
            };
        } & {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            departmentId: string;
            isShared: boolean;
        };
    } & {
        type: import(".prisma/client").$Enums.QuestionType;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        poolId: string;
        currentVersionId: string | null;
        topic: string;
    }>;
    update(questionId: string, input: UpdateQuestionInput, userId: string): Promise<{
        versions: ({
            testCases: {
                id: string;
                orderIndex: number;
                questionVersionId: string;
                input: string;
                expectedOutput: string;
                isHidden: boolean;
                timeoutMs: number;
            }[];
        } & {
            id: string;
            createdAt: Date;
            createdById: string;
            questionId: string;
            versionNumber: number;
            content: string;
            difficulty: number;
            marks: number;
            negativeMarks: number;
            options: import("@prisma/client/runtime/client").JsonValue | null;
            correctAnswer: string | null;
            keywords: import("@prisma/client/runtime/client").JsonValue | null;
            similarityThreshold: number | null;
            codeTemplate: string | null;
            codeLanguage: string | null;
            isLatest: boolean;
        })[];
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        pool: {
            department: {
                name: string;
                id: string;
                institutionId: string;
            };
        } & {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            departmentId: string;
            isShared: boolean;
        };
    } & {
        type: import(".prisma/client").$Enums.QuestionType;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        poolId: string;
        currentVersionId: string | null;
        topic: string;
    }>;
    rollbackVersion(questionId: string, versionId: string, userId: string): Promise<{
        versions: ({
            testCases: {
                id: string;
                orderIndex: number;
                questionVersionId: string;
                input: string;
                expectedOutput: string;
                isHidden: boolean;
                timeoutMs: number;
            }[];
        } & {
            id: string;
            createdAt: Date;
            createdById: string;
            questionId: string;
            versionNumber: number;
            content: string;
            difficulty: number;
            marks: number;
            negativeMarks: number;
            options: import("@prisma/client/runtime/client").JsonValue | null;
            correctAnswer: string | null;
            keywords: import("@prisma/client/runtime/client").JsonValue | null;
            similarityThreshold: number | null;
            codeTemplate: string | null;
            codeLanguage: string | null;
            isLatest: boolean;
        })[];
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        pool: {
            department: {
                name: string;
                id: string;
                institutionId: string;
            };
        } & {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            departmentId: string;
            isShared: boolean;
        };
    } & {
        type: import(".prisma/client").$Enums.QuestionType;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        poolId: string;
        currentVersionId: string | null;
        topic: string;
    }>;
    getById(id: string): Promise<{
        versions: ({
            testCases: {
                id: string;
                orderIndex: number;
                questionVersionId: string;
                input: string;
                expectedOutput: string;
                isHidden: boolean;
                timeoutMs: number;
            }[];
        } & {
            id: string;
            createdAt: Date;
            createdById: string;
            questionId: string;
            versionNumber: number;
            content: string;
            difficulty: number;
            marks: number;
            negativeMarks: number;
            options: import("@prisma/client/runtime/client").JsonValue | null;
            correctAnswer: string | null;
            keywords: import("@prisma/client/runtime/client").JsonValue | null;
            similarityThreshold: number | null;
            codeTemplate: string | null;
            codeLanguage: string | null;
            isLatest: boolean;
        })[];
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        pool: {
            department: {
                name: string;
                id: string;
                institutionId: string;
            };
        } & {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            departmentId: string;
            isShared: boolean;
        };
    } & {
        type: import(".prisma/client").$Enums.QuestionType;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        poolId: string;
        currentVersionId: string | null;
        topic: string;
    }>;
    getByPool(poolId: string, pagination: PaginationParams, filters?: {
        topic?: string;
        type?: QuestionType;
        difficulty?: number;
    }): Promise<{
        questions: ({
            versions: {
                id: string;
                createdAt: Date;
                versionNumber: number;
                content: string;
                difficulty: number;
                marks: number;
            }[];
            createdBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            type: import(".prisma/client").$Enums.QuestionType;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdById: string;
            poolId: string;
            currentVersionId: string | null;
            topic: string;
        })[];
        total: number;
    }>;
    getVersionHistory(questionId: string): Promise<({
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        testCases: {
            id: string;
            orderIndex: number;
            questionVersionId: string;
            input: string;
            expectedOutput: string;
            isHidden: boolean;
            timeoutMs: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        createdById: string;
        questionId: string;
        versionNumber: number;
        content: string;
        difficulty: number;
        marks: number;
        negativeMarks: number;
        options: import("@prisma/client/runtime/client").JsonValue | null;
        correctAnswer: string | null;
        keywords: import("@prisma/client/runtime/client").JsonValue | null;
        similarityThreshold: number | null;
        codeTemplate: string | null;
        codeLanguage: string | null;
        isLatest: boolean;
    })[]>;
    deactivate(questionId: string): Promise<{
        type: import(".prisma/client").$Enums.QuestionType;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        poolId: string;
        currentVersionId: string | null;
        topic: string;
    }>;
    private validateQuestionInput;
}
export declare const questionService: QuestionService;
//# sourceMappingURL=question.service.d.ts.map