import { Request, Response, NextFunction } from "express";
export declare class ExamController {
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    getByInstitution(req: Request, res: Response, next: NextFunction): Promise<void>;
    schedule(req: Request, res: Response, next: NextFunction): Promise<void>;
    enrollCandidate(req: Request, res: Response, next: NextFunction): Promise<void>;
    reschedule(req: Request, res: Response, next: NextFunction): Promise<void>;
    getEnrollments(req: Request, res: Response, next: NextFunction): Promise<void>;
    cancel(req: Request, res: Response, next: NextFunction): Promise<void>;
    getRetakeQuestions(req: Request, res: Response, next: NextFunction): Promise<void>;
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
    getMyEnrollment(req: Request, res: Response, next: NextFunction): Promise<void>;
    addQuestions(req: Request, res: Response, next: NextFunction): Promise<void>;
    getExamQuestions(req: Request, res: Response, next: NextFunction): Promise<void>;
    removeQuestion(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const examController: ExamController;
//# sourceMappingURL=exam.controller.d.ts.map