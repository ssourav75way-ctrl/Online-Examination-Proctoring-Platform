import { AccommodationType } from "@prisma/client";
export interface CreateExamInput {
    institutionId: string;
    title: string;
    description?: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
    durationMinutes: number;
    isAdaptive?: boolean;
    maxAttempts?: number;
    cooldownHours?: number;
    challengeWindowDays?: number;
    totalMarks: number;
    passingScore: number;
    questionSelections: {
        poolId: string;
        questionIds: string[];
        quota?: number;
    }[];
}
export interface EnrollCandidateInput {
    candidateId: string;
    accommodationType?: AccommodationType;
}
//# sourceMappingURL=exam.types.d.ts.map