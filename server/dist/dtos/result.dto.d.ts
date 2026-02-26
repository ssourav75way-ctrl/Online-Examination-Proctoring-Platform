import { ResultStatus, ReEvalStatus } from "@prisma/client";
export interface FileReEvaluationRequestDTO {
    resultId: string;
    candidateAnswerId: string;
    justification: string;
}
export interface ProcessReEvaluationRequestDTO {
    status: ReEvalStatus;
    newScore?: number;
    reviewNotes?: string;
}
export interface ExamResultDTO {
    id: string;
    enrollmentId: string;
    totalScore: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    integrityScore: number | null;
    timingAnomalyCount: number;
    collusionScore: number | null;
    status: ResultStatus;
    publishedAt: Date | null;
    createdAt: Date;
}
export interface CandidateResultDTO extends ExamResultDTO {
    enrollment: {
        exam: {
            id: string;
            title: string;
            totalMarks: number;
        };
        candidate: {
            id: string;
            firstName: string;
            lastName: string;
        };
    };
    answers: CandidateAnswerSummaryDTO[];
}
export interface CandidateAnswerSummaryDTO {
    id: string;
    examQuestionId: string;
    answerContent: string | null;
    finalScore: number | null;
    timeTakenSeconds: number;
    question: {
        topic: string;
        type: string;
    };
    questionVersion: {
        content: string;
        marks: number;
    };
}
export interface ExamResultListResponseDTO {
    results: ExamResultDTO[];
    total: number;
}
export interface ReEvaluationRequestDTO {
    id: string;
    resultId: string;
    candidateAnswerId: string;
    justification: string;
    status: ReEvalStatus;
    previousScore: number | null;
    newScore: number | null;
    reviewNotes: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface ReEvaluationListResponseDTO {
    requests: ReEvaluationRequestDTO[];
    total: number;
}
//# sourceMappingURL=result.dto.d.ts.map