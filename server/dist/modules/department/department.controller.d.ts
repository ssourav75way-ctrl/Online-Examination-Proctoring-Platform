import { Request, Response, NextFunction } from "express";
export declare class DepartmentController {
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    getByInstitution(req: Request, res: Response, next: NextFunction): Promise<void>;
    getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
    delete(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const departmentController: DepartmentController;
//# sourceMappingURL=department.controller.d.ts.map