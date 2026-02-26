import { QuestionAnalytics, DistractorInfo, CandidateIntegrityReport } from "../../types/grading.types";
export declare class AnalyticsService {
    getQuestionDifficultyIndex(examQuestionId: string): Promise<number>;
    getDiscriminationIndex(examId: string, examQuestionId: string): Promise<number>;
    getDistractorAnalysis(examQuestionId: string): Promise<DistractorInfo[]>;
    getExamAnalytics(examId: string): Promise<QuestionAnalytics[]>;
    getIntegrityReport(examId: string): Promise<CandidateIntegrityReport[]>;
}
export declare const analyticsService: AnalyticsService;
//# sourceMappingURL=analytics.service.d.ts.map