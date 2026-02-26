import { CandidateIntegrityReport, IntegrityScoreFactors } from "../types/grading.types";
export declare class IntegrityService {
    calculateIntegrityScore(factors: IntegrityScoreFactors): number;
    detectTimingAnomalies(sessionId: string): Promise<number>;
    generateExamIntegrityReport(examId: string): Promise<CandidateIntegrityReport[]>;
    private detectCollusion;
}
export declare const integrityService: IntegrityService;
//# sourceMappingURL=integrity.service.d.ts.map