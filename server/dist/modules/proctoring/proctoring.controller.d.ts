import { Request, Response, NextFunction } from "express";
export declare class ProctoringController {
    uploadSnapshot(req: Request, res: Response, next: NextFunction): Promise<void>;
    getPendingFlags(req: Request, res: Response, next: NextFunction): Promise<void>;
    reviewFlag(req: Request, res: Response, next: NextFunction): Promise<void>;
    getSessionSnapshots(req: Request, res: Response, next: NextFunction): Promise<void>;
    getSessionFlags(req: Request, res: Response, next: NextFunction): Promise<void>;
    getActiveSessions(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const proctoringController: ProctoringController;
//# sourceMappingURL=proctoring.controller.d.ts.map