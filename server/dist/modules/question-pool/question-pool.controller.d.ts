import { Request, Response, NextFunction } from "express";
export declare class QuestionPoolController {
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    getByDepartment(req: Request, res: Response, next: NextFunction): Promise<void>;
    getAccessiblePools(req: Request, res: Response, next: NextFunction): Promise<void>;
    getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
    delete(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const questionPoolController: QuestionPoolController;
//# sourceMappingURL=question-pool.controller.d.ts.map