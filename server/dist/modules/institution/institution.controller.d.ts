import { Request, Response, NextFunction } from "express";
export declare class InstitutionController {
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    getAll(req: Request, res: Response, next: NextFunction): Promise<void>;
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
    addMember(req: Request, res: Response, next: NextFunction): Promise<void>;
    removeMember(req: Request, res: Response, next: NextFunction): Promise<void>;
    getMembers(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateMemberDepartments(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const institutionController: InstitutionController;
//# sourceMappingURL=institution.controller.d.ts.map