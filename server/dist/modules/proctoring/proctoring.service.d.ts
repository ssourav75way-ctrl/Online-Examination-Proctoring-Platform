import { ReviewStatus } from "@prisma/client";
import { PaginationParams } from "../../utils/pagination.util";
import { UploadSnapshotInput } from "../../types/modules/proctoring.types";
export declare class ProctoringService {
    uploadSnapshot(input: UploadSnapshotInput): Promise<{
        snapshot: {
            id: string;
            sessionId: string;
            imageUrl: string;
            capturedAt: Date;
            faceDetected: boolean;
            multipleFaces: boolean;
            candidateAbsent: boolean;
        };
        flags: {
            id: string;
            createdAt: Date;
            sessionId: string;
            description: string | null;
            snapshotId: string | null;
            flagType: import(".prisma/client").$Enums.FlagType;
            severity: number;
            reviewedById: string | null;
            reviewStatus: import(".prisma/client").$Enums.ReviewStatus;
            reviewedAt: Date | null;
            reviewNotes: string | null;
        }[];
    }>;
    getPendingFlags(pagination: PaginationParams, institutionId?: string): Promise<{
        flags: ({
            session: {
                enrollment: {
                    exam: {
                        id: string;
                        title: string;
                    };
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
            };
            snapshot: {
                id: string;
                imageUrl: string;
                capturedAt: Date;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            sessionId: string;
            description: string | null;
            snapshotId: string | null;
            flagType: import(".prisma/client").$Enums.FlagType;
            severity: number;
            reviewedById: string | null;
            reviewStatus: import(".prisma/client").$Enums.ReviewStatus;
            reviewedAt: Date | null;
            reviewNotes: string | null;
        })[];
        total: number;
    }>;
    reviewFlag(flagId: string, reviewedById: string, status: ReviewStatus, reviewNotes?: string): Promise<{
        id: string;
        createdAt: Date;
        sessionId: string;
        description: string | null;
        snapshotId: string | null;
        flagType: import(".prisma/client").$Enums.FlagType;
        severity: number;
        reviewedById: string | null;
        reviewStatus: import(".prisma/client").$Enums.ReviewStatus;
        reviewedAt: Date | null;
        reviewNotes: string | null;
    }>;
    getSessionSnapshots(sessionId: string, pagination: PaginationParams): Promise<{
        snapshots: ({
            flags: {
                id: string;
                flagType: import(".prisma/client").$Enums.FlagType;
                reviewStatus: import(".prisma/client").$Enums.ReviewStatus;
            }[];
        } & {
            id: string;
            sessionId: string;
            imageUrl: string;
            capturedAt: Date;
            faceDetected: boolean;
            multipleFaces: boolean;
            candidateAbsent: boolean;
        })[];
        total: number;
    }>;
    getSessionFlags(sessionId: string): Promise<({
        reviewedBy: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        snapshot: {
            id: string;
            imageUrl: string;
            capturedAt: Date;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        sessionId: string;
        description: string | null;
        snapshotId: string | null;
        flagType: import(".prisma/client").$Enums.FlagType;
        severity: number;
        reviewedById: string | null;
        reviewStatus: import(".prisma/client").$Enums.ReviewStatus;
        reviewedAt: Date | null;
        reviewNotes: string | null;
    })[]>;
    getActiveSessions(institutionId: string): Promise<({
        _count: {
            flags: number;
        };
        enrollment: {
            exam: {
                id: string;
                title: string;
            };
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
        snapshots: {
            id: string;
            sessionId: string;
            imageUrl: string;
            capturedAt: Date;
            faceDetected: boolean;
            multipleFaces: boolean;
            candidateAbsent: boolean;
        }[];
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
    })[]>;
}
export declare const proctoringService: ProctoringService;
//# sourceMappingURL=proctoring.service.d.ts.map