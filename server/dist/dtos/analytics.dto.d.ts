export interface QuestionAnalyticsDTO {
    questionId: string;
    difficultyIndex: number;
    discriminationIndex: number;
    distractorAnalysis: DistractorInfoDTO[];
    flaggedForReview: boolean;
    flagReason: string | null;
}
export interface DistractorInfoDTO {
    optionId: string;
    optionText: string;
    selectionCount: number;
    selectionPercentage: number;
}
export interface CandidateIntegrityReportDTO {
    candidateId: string;
    candidateName: string;
    integrityScore: number;
    tabSwitchCount: number;
    flagCount: number;
    timingAnomalies: number;
    collusionScore: number | null;
}
//# sourceMappingURL=analytics.dto.d.ts.map