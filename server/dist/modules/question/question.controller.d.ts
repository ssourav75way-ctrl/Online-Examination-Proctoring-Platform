import { Request, Response, NextFunction } from "express";
export declare class QuestionController {
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
    getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    getByPool(req: Request, res: Response, next: NextFunction): Promise<void>;
    getVersionHistory(req: Request, res: Response, next: NextFunction): Promise<void>;
    deactivate(req: Request, res: Response, next: NextFunction): Promise<void>;
    rollback(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const questionController: QuestionController;
//# sourceMappingURL=question.controller.d.ts.map