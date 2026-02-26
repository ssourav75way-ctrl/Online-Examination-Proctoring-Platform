import { FlagType, ReviewStatus } from "@prisma/client";
export interface UploadSnapshotRequestDTO {
    sessionId: string;
    imageUrl: string;
    faceDetected: boolean;
    multipleFaces: boolean;
    candidateAbsent: boolean;
}
export interface ReviewFlagRequestDTO {
    status: ReviewStatus;
    reviewNotes?: string;
}
export interface SnapshotResponseDTO {
    id: string;
    sessionId: string;
    imageUrl: string;
    capturedAt: Date;
    faceDetected: boolean;
    multipleFaces: boolean;
    candidateAbsent: boolean;
}
export interface FlagResponseDTO {
    id: string;
    sessionId: string;
    snapshotId: string | null;
    flagType: FlagType;
    description: string | null;
    severity: number;
    reviewStatus: ReviewStatus;
    reviewedAt: Date | null;
    reviewNotes: string | null;
    createdAt: Date;
    snapshot: {
        id: string;
        imageUrl: string;
        capturedAt: Date;
    } | null;
    reviewedBy: {
        id: string;
        firstName: string;
        lastName: string;
    } | null;
}
export interface PendingFlagDTO {
    id: string;
    flagType: FlagType;
    description: string | null;
    severity: number;
    reviewStatus: ReviewStatus;
    createdAt: Date;
    session: {
        enrollment: {
            candidate: {
                id: string;
                firstName: string;
                lastName: string;
            };
            exam: {
                id: string;
                title: string;
            };
        };
    };
    snapshot: {
        id: string;
        imageUrl: string;
        capturedAt: Date;
    } | null;
}
export interface PendingFlagListResponseDTO {
    flags: PendingFlagDTO[];
    total: number;
}
export interface SnapshotListResponseDTO {
    snapshots: SnapshotResponseDTO[];
    total: number;
}
export interface UploadSnapshotResponseDTO {
    snapshot: SnapshotResponseDTO;
    flags: FlagResponseDTO[];
}
//# sourceMappingURL=proctoring.dto.d.ts.map