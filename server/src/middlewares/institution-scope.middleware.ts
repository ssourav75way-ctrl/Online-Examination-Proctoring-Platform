import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../utils/app-error";
import prisma from "../config/database.config";
import { InstitutionScopedUser } from "../types/auth.types";

/**
 * Middleware to scope the request to a specific institution.
 * Reads institutionId from route params and validates membership.
 * Populates req.scopedUser with institution-specific role and department access.
 */
export const institutionScope = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required");
    }

    const institutionId =
      (req.params.institutionId as string) || req.body.institutionId;
    if (!institutionId) {
      throw new ForbiddenError("Institution context required");
    }

    // Super admins bypass institution membership check
    if (req.user.globalRole === "SUPER_ADMIN") {
      const allDepts = await prisma.department.findMany({
        where: { institutionId },
        select: { id: true },
      });
      const scopedUser: InstitutionScopedUser = {
        ...req.user,
        institutionId,
        institutionRole: "ADMIN" as const,
        departmentIds: allDepts.map((d) => d.id),
      };
      req.scopedUser = scopedUser;
      next();
      return;
    }

    const membership = await prisma.institutionMember.findUnique({
      where: {
        userId_institutionId: {
          userId: req.user.userId,
          institutionId,
        },
      },
      include: {
        departmentAccess: {
          select: { departmentId: true },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenError("You are not a member of this institution");
    }

    let departmentIds: string[] = [];
    if (membership.role === "ADMIN") {
      const allDepts = await prisma.department.findMany({
        where: { institutionId },
        select: { id: true },
      });
      departmentIds = allDepts.map((d) => d.id);
    } else {
      departmentIds = membership.departmentAccess.map((da) => da.departmentId);
    }

    const scopedUser: InstitutionScopedUser = {
      ...req.user,
      institutionId,
      institutionRole: membership.role,
      departmentIds,
    };

    req.scopedUser = scopedUser;
    next();
  } catch (error) {
    next(error);
  }
};
