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
      (req.params.institutionId as string) ||
      (req.params.id as string) ||
      (req.body.institutionId as string);

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
        institutionRole: "ADMIN",
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
    const normalizedRole = String(membership.role).toUpperCase();

    console.log(
      `[InstitutionScope] User: ${req.user.userId}, Inst: ${institutionId}, Role: ${normalizedRole}`,
    );

    if (normalizedRole === "ADMIN" || normalizedRole === "EXAMINER") {
      // If ADMIN, grant all.
      // If EXAMINER, check if they have specific assignments. If none, grant all for now to avoid blocking.
      if (
        normalizedRole === "ADMIN" ||
        membership.departmentAccess.length === 0
      ) {
        const allDepts = await prisma.department.findMany({
          where: { institutionId },
          select: { id: true },
        });
        departmentIds = allDepts.map((d) => d.id);
        console.log(
          `[InstitutionScope] Full access granted to ${departmentIds.length} departments for ${normalizedRole}`,
        );
      } else {
        departmentIds = membership.departmentAccess.map(
          (da) => da.departmentId,
        );
        console.log(
          `[InstitutionScope] Restricted access granted to ${departmentIds.length} departments for ${normalizedRole}`,
        );
      }
    } else {
      // For other roles, use specific department assignments
      departmentIds = membership.departmentAccess.map((da) => da.departmentId);
      console.log(
        `[InstitutionScope] Access granted to ${departmentIds.length} departments for ${normalizedRole}`,
      );
    }

    const scopedUser: InstitutionScopedUser = {
      ...req.user,
      institutionId,
      institutionRole: membership.role as any,
      departmentIds,
    };

    req.scopedUser = scopedUser;
    next();
  } catch (error) {
    console.error("[InstitutionScope] Error:", error);
    next(error);
  }
};
