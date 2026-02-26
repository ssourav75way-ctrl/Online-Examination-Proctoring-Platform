import { ReEvalStatus } from "@prisma/client";
import { PaginationParams } from "../../utils/pagination.util";
export declare class ResultService {
    generateResults(examId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ResultStatus;
        enrollmentId: string;
        totalScore: number;
        maxScore: number;
        percentage: number;
        passed: boolean;
        integrityScore: number | null;
        timingAnomalyCount: number;
        collusionScore: number | null;
        publishedAt: Date | null;
    }[]>;
    publishResults(examId: string): Promise<void>;
    getCandidateResult(enrollmentId: string, candidateId: string): Promise<{
        canChallenge: boolean;
        answers: {
            examQuestion: {
                questionVersion: {
                    type: import(".prisma/client").$Enums.QuestionType;
                    topic: string;
                    options: string | number | boolean | import("@prisma/client/runtime/client").JsonObject | {
                        id: string;
                        text: string;
                    }[] | null;
                    id: string;
                    content: string;
                    marks: number;
                };
                question: {
                    type: import(".prisma/client").$Enums.QuestionType;
                    topic: string;
                };
                id: string;
                examId: string;
                questionId: string;
                poolId: string;
                orderIndex: number;
                questionVersionId: string;
            };
            reEvalRequests: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.ReEvalStatus;
                reviewedById: string | null;
                reviewNotes: string | null;
                resultId: string;
                candidateAnswerId: string;
                justification: string;
                previousScore: number | null;
                newScore: number | null;
            }[];
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
        }[];
        enrollment: {
            exam: {
                id: string;
                title: string;
                challengeWindowDays: number;
                totalMarks: number;
                passingScore: number;
            };
            candidate: {
                id: string;
            };
            session: ({
                answers: ({
                    examQuestion: {
                        questionVersion: {
                            id: string;
                            content: string;
                            marks: number;
                            options: import("@prisma/client/runtime/client").JsonValue;
                        };
                        question: {
                            type: import(".prisma/client").$Enums.QuestionType;
                            topic: string;
                        };
                    } & {
                        id: string;
                        examId: string;
                        questionId: string;
                        poolId: string;
                        orderIndex: number;
                        questionVersionId: string;
                    };
                    reEvalRequests: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        status: import(".prisma/client").$Enums.ReEvalStatus;
                        reviewedById: string | null;
                        reviewNotes: string | null;
                        resultId: string;
                        candidateAnswerId: string;
                        justification: string;
                        previousScore: number | null;
                        newScore: number | null;
                    }[];
                } & {
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
                })[];
            } & {
                id: string;
                enrollmentId: string;
                startedAt: Date;
                serverDeadline: Date;
                pausedAt: Date | null;
                totalPausedSeconds: number;
                currentQuestionIndex: number;
                runningAccuracy: number;
                questionsAnswered: number;
                correctAnswers: number;
                tabSwitchCount: number;
                isLocked: boolean;
                lockedAt: Date | null;
                lockReason: string | null;
                proctorUnlockedAt: Date | null;
                finishedAt: Date | null;
                ipAddress: string | null;
                userAgent: string | null;
                autoPauseAdjustmentMs: number | null;
                autoPauseTriggered: boolean;
            }) | null;
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
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ResultStatus;
        enrollmentId: string;
        totalScore: number;
        maxScore: number;
        percentage: number;
        passed: boolean;
        integrityScore: number | null;
        timingAnomalyCount: number;
        collusionScore: number | null;
        publishedAt: Date | null;
    }>;
    getMyResults(candidateId: string): Promise<({
        enrollment: {
            exam: {
                id: string;
                title: string;
                totalMarks: number;
                passingScore: number;
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
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ResultStatus;
        enrollmentId: string;
        totalScore: number;
        maxScore: number;
        percentage: number;
        passed: boolean;
        integrityScore: number | null;
        timingAnomalyCount: number;
        collusionScore: number | null;
        publishedAt: Date | null;
    })[]>;
    fileReEvaluation(resultId: string, candidateAnswerId: string, justification: string, candidateId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ReEvalStatus;
        reviewedById: string | null;
        reviewNotes: string | null;
        resultId: string;
        candidateAnswerId: string;
        justification: string;
        previousScore: number | null;
        newScore: number | null;
    }>;
    processReEvaluation(requestId: string, reviewedById: string, status: ReEvalStatus, newScore?: number, reviewNotes?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ReEvalStatus;
        reviewedById: string | null;
        reviewNotes: string | null;
        resultId: string;
        candidateAnswerId: string;
        justification: string;
        previousScore: number | null;
        newScore: number | null;
    }>;
    getExamResults(examId: string, pagination: PaginationParams): Promise<{
        results: ({
            enrollment: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.ResultStatus;
            enrollmentId: string;
            totalScore: number;
            maxScore: number;
            percentage: number;
            passed: boolean;
            integrityScore: number | null;
            timingAnomalyCount: number;
            collusionScore: number | null;
            publishedAt: Date | null;
        })[];
        total: number;
    }>;
    getReEvaluationRequests(examId: string, pagination: PaginationParams): Promise<{
        requests: ({
            result: {
                enrollment: {
                    candidate: {
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
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.ResultStatus;
                enrollmentId: string;
                totalScore: number;
                maxScore: number;
                percentage: number;
                passed: boolean;
                integrityScore: number | null;
                timingAnomalyCount: number;
                collusionScore: number | null;
                publishedAt: Date | null;
            };
            reviewedBy: {
                id: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.ReEvalStatus;
            reviewedById: string | null;
            reviewNotes: string | null;
            resultId: string;
            candidateAnswerId: string;
            justification: string;
            previousScore: number | null;
            newScore: number | null;
        })[];
        total: number;
    }>;
}
export declare const resultService: ResultService;
//# sourceMappingURL=result.service.d.ts.map