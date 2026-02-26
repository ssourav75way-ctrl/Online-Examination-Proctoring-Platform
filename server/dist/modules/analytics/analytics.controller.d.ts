import { Request, Response, NextFunction } from "express";
export declare class AnalyticsController {
    getExamAnalytics(req: Request, res: Response, next: NextFunction): Promise<void>;
    getQuestionDifficulty(req: Request, res: Response, next: NextFunction): Promise<void>;
    getDistractorAnalysis(req: Request, res: Response, next: NextFunction): Promise<void>;
    getIntegrityReport(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const analyticsController: AnalyticsController;
//# sourceMappingURL=analytics.controller.d.ts.map