import { Request, Response, NextFunction } from "express";
export declare class GradingController {
    autoGradeSession(req: Request, res: Response, next: NextFunction): Promise<void>;
    overrideScore(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const gradingController: GradingController;
//# sourceMappingURL=grading.controller.d.ts.map