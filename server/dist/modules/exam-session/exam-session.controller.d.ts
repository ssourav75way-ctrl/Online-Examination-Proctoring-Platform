import { Request, Response, NextFunction } from "express";
export declare class ExamSessionController {
    start(req: Request, res: Response, next: NextFunction): Promise<void>;
    submitAnswer(req: Request, res: Response, next: NextFunction): Promise<void>;
    reconnect(req: Request, res: Response, next: NextFunction): Promise<void>;
    reportViolation(req: Request, res: Response, next: NextFunction): Promise<void>;
    proctorUnlock(req: Request, res: Response, next: NextFunction): Promise<void>;
    extendTime(req: Request, res: Response, next: NextFunction): Promise<void>;
    finish(req: Request, res: Response, next: NextFunction): Promise<void>;
    getQuestion(req: Request, res: Response, next: NextFunction): Promise<void>;
    getMarkers(req: Request, res: Response, next: NextFunction): Promise<void>;
    getStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const examSessionController: ExamSessionController;
//# sourceMappingURL=exam-session.controller.d.ts.map