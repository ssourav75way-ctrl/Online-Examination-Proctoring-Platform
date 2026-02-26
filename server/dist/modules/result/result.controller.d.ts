import { Request, Response, NextFunction } from "express";
export declare class ResultController {
    generateResults(req: Request, res: Response, next: NextFunction): Promise<void>;
    publishResults(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCandidateResult(req: Request, res: Response, next: NextFunction): Promise<void>;
    getMyResults(req: Request, res: Response, next: NextFunction): Promise<void>;
    getExamResults(req: Request, res: Response, next: NextFunction): Promise<void>;
    fileReEvaluation(req: Request, res: Response, next: NextFunction): Promise<void>;
    processReEvaluation(req: Request, res: Response, next: NextFunction): Promise<void>;
    getReEvaluationRequests(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const resultController: ResultController;
//# sourceMappingURL=result.controller.d.ts.map