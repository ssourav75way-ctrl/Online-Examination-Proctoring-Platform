import { ExamStatus } from "@prisma/client";
import { PaginationParams } from "../../utils/pagination.util";
import { CreateExamInput, EnrollCandidateInput } from "../../types/modules/exam.types";
export declare class ExamService {
    create(input: CreateExamInput, createdById: string): Promise<{
        institution: {
            name: string;
            id: string;
        };
        questions: ({
            questionVersion: {
                id: string;
                versionNumber: number;
                content: string;
                difficulty: number;
            };
            question: {
                type: import(".prisma/client").$Enums.QuestionType;
                id: string;
                topic: string;
            };
        } & {
            id: string;
            examId: string;
            questionId: string;
            poolId: string;
            orderIndex: number;
            questionVersionId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ExamStatus;
        institutionId: string;
        title: string;
        description: string | null;
        scheduledStartTime: Date;
        scheduledEndTime: Date;
        durationMinutes: number;
        isAdaptive: boolean;
        maxAttempts: number;
        cooldownHours: number;
        challengeWindowDays: number;
        resultStatus: import(".prisma/client").$Enums.ResultStatus;
        totalMarks: number;
        passingScore: number;
        createdById: string;
    }>;
    schedule(examId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ExamStatus;
        institutionId: string;
        title: string;
        description: string | null;
        scheduledStartTime: Date;
        scheduledEndTime: Date;
        durationMinutes: number;
        isAdaptive: boolean;
        maxAttempts: number;
        cooldownHours: number;
        challengeWindowDays: number;
        resultStatus: import(".prisma/client").$Enums.ResultStatus;
        totalMarks: number;
        passingScore: number;
        createdById: string;
    }>;
    enrollCandidate(examId: string, input: EnrollCandidateInput): Promise<{
        exam: {
            id: string;
            title: string;
            scheduledStartTime: Date;
        };
        candidate: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        accommodationId: string | null;
        candidateId: string;
        examId: string;
        attemptNumber: number;
        status: import(".prisma/client").$Enums.EnrollmentStatus;
        accommodationType: import(".prisma/client").$Enums.AccommodationType;
        adjustedDurationMinutes: number | null;
        enrolledAt: Date;
        effectiveEndTime: Date | null;
        effectiveStartTime: Date | null;
    }>;
    reschedule(examId: string, newStartTime: string, newEndTime: string): Promise<{
        exam: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.ExamStatus;
            institutionId: string;
            title: string;
            description: string | null;
            scheduledStartTime: Date;
            scheduledEndTime: Date;
            durationMinutes: number;
            isAdaptive: boolean;
            maxAttempts: number;
            cooldownHours: number;
            challengeWindowDays: number;
            resultStatus: import(".prisma/client").$Enums.ResultStatus;
            totalMarks: number;
            passingScore: number;
            createdById: string;
        };
        conflicts: {
            candidateId: string;
            candidateName: string;
            conflictingExamTitle: string;
            conflictingInstitution: string;
        }[];
    }>;
    getRetakeQuestionSet(examId: string, candidateId: string): Promise<string[]>;
    getById(examId: string): Promise<{
        institution: {
            name: string;
            id: string;
        };
        _count: {
            enrollments: number;
        };
        questions: ({
            questionVersion: {
                id: string;
                versionNumber: number;
                difficulty: number;
                marks: number;
            };
            question: {
                type: import(".prisma/client").$Enums.QuestionType;
                id: string;
                topic: string;
            };
        } & {
            id: string;
            examId: string;
            questionId: string;
            poolId: string;
            orderIndex: number;
            questionVersionId: string;
        })[];
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ExamStatus;
        institutionId: string;
        title: string;
        description: string | null;
        scheduledStartTime: Date;
        scheduledEndTime: Date;
        durationMinutes: number;
        isAdaptive: boolean;
        maxAttempts: number;
        cooldownHours: number;
        challengeWindowDays: number;
        resultStatus: import(".prisma/client").$Enums.ResultStatus;
        totalMarks: number;
        passingScore: number;
        createdById: string;
    }>;
    getByInstitution(institutionId: string, pagination: PaginationParams, status?: ExamStatus): Promise<{
        exams: ({
            _count: {
                questions: number;
                enrollments: number;
            };
            createdBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.ExamStatus;
            institutionId: string;
            title: string;
            description: string | null;
            scheduledStartTime: Date;
            scheduledEndTime: Date;
            durationMinutes: number;
            isAdaptive: boolean;
            maxAttempts: number;
            cooldownHours: number;
            challengeWindowDays: number;
            resultStatus: import(".prisma/client").$Enums.ResultStatus;
            totalMarks: number;
            passingScore: number;
            createdById: string;
        })[];
        total: number;
    }>;
    getEnrollments(examId: string, pagination: PaginationParams): Promise<{
        enrollments: ({
            result: {
                id: string;
                status: import(".prisma/client").$Enums.ResultStatus;
                totalScore: number;
                percentage: number;
                passed: boolean;
            } | null;
            candidate: {
                email: string;
                id: string;
                firstName: string;
                lastName: string;
            };
            session: {
                id: string;
                startedAt: Date;
                isLocked: boolean;
                finishedAt: Date | null;
            } | null;
        } & {
            id: string;
            accommodationId: string | null;
            candidateId: string;
            examId: string;
            attemptNumber: number;
            status: import(".prisma/client").$Enums.EnrollmentStatus;
            accommodationType: import(".prisma/client").$Enums.AccommodationType;
            adjustedDurationMinutes: number | null;
            enrolledAt: Date;
            effectiveEndTime: Date | null;
            effectiveStartTime: Date | null;
        })[];
        total: number;
    }>;
    cancelExam(examId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ExamStatus;
        institutionId: string;
        title: string;
        description: string | null;
        scheduledStartTime: Date;
        scheduledEndTime: Date;
        durationMinutes: number;
        isAdaptive: boolean;
        maxAttempts: number;
        cooldownHours: number;
        challengeWindowDays: number;
        resultStatus: import(".prisma/client").$Enums.ResultStatus;
        totalMarks: number;
        passingScore: number;
        createdById: string;
    }>;
    update(examId: string, data: Partial<CreateExamInput>): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ExamStatus;
        institutionId: string;
        title: string;
        description: string | null;
        scheduledStartTime: Date;
        scheduledEndTime: Date;
        durationMinutes: number;
        isAdaptive: boolean;
        maxAttempts: number;
        cooldownHours: number;
        challengeWindowDays: number;
        resultStatus: import(".prisma/client").$Enums.ResultStatus;
        totalMarks: number;
        passingScore: number;
        createdById: string;
    }>;
    getMyEnrollment(examId: string, candidateId: string): Promise<({
        exam: {
            id: string;
            status: import(".prisma/client").$Enums.ExamStatus;
            title: string;
            scheduledStartTime: Date;
            scheduledEndTime: Date;
            durationMinutes: number;
        };
        session: {
            id: string;
            startedAt: Date;
            isLocked: boolean;
            finishedAt: Date | null;
        } | null;
    } & {
        id: string;
        accommodationId: string | null;
        candidateId: string;
        examId: string;
        attemptNumber: number;
        status: import(".prisma/client").$Enums.EnrollmentStatus;
        accommodationType: import(".prisma/client").$Enums.AccommodationType;
        adjustedDurationMinutes: number | null;
        enrolledAt: Date;
        effectiveEndTime: Date | null;
        effectiveStartTime: Date | null;
    }) | null>;
    addQuestionsToExam(examId: string, questionIds: string[]): Promise<{
        added: number;
    }>;
    getExamQuestions(examId: string): Promise<({
        questionVersion: {
            id: string;
            versionNumber: number;
            content: string;
            difficulty: number;
            marks: number;
        };
        question: {
            type: import(".prisma/client").$Enums.QuestionType;
            id: string;
            topic: string;
        };
    } & {
        id: string;
        examId: string;
        questionId: string;
        poolId: string;
        orderIndex: number;
        questionVersionId: string;
    })[]>;
    removeQuestionFromExam(examId: string, examQuestionId: string): Promise<{
        id: string;
        examId: string;
        questionId: string;
        poolId: string;
        orderIndex: number;
        questionVersionId: string;
    }>;
}
export declare const examService: ExamService;
//# sourceMappingURL=exam.service.d.ts.map