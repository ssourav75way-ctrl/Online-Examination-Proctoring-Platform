import { Request, Response, NextFunction } from "express";
import { GlobalRole, InstitutionRole } from "@prisma/client";
export declare const requireGlobalRole: (...allowedRoles: GlobalRole[]) => (req: Request, _res: Response, next: NextFunction) => void;
export declare const requireInstitutionRole: (...allowedRoles: InstitutionRole[]) => (req: Request, _res: Response, next: NextFunction) => void;
export declare const requireAnyRole: (globalRoles: GlobalRole[], institutionRoles: InstitutionRole[]) => (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=role.middleware.d.ts.map