import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../utils/app-error";
import { GlobalRole, InstitutionRole } from "@prisma/client";

export const requireGlobalRole = (...allowedRoles: GlobalRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError("Authentication required"));
      return;
    }

    if (!allowedRoles.includes(req.user.globalRole)) {
      next(new ForbiddenError("Insufficient permissions"));
      return;
    }

    next();
  };
};

export const requireInstitutionRole = (...allowedRoles: InstitutionRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.scopedUser) {
      next(new ForbiddenError("Institution context required"));
      return;
    }

    if (!allowedRoles.includes(req.scopedUser.institutionRole)) {
      next(new ForbiddenError("Insufficient institution permissions"));
      return;
    }

    next();
  };
};

export const requireAnyRole = (
  globalRoles: GlobalRole[],
  institutionRoles: InstitutionRole[],
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError("Authentication required"));
      return;
    }

    const hasGlobalRole = globalRoles.includes(req.user.globalRole);
    const hasInstitutionRole =
      req.scopedUser &&
      institutionRoles.includes(req.scopedUser.institutionRole);

    if (!hasGlobalRole && !hasInstitutionRole) {
      next(new ForbiddenError("Insufficient permissions"));
      return;
    }

    next();
  };
};
