import { Request, Response, NextFunction } from "express";
import { institutionService } from "./institution.service";
import { ForbiddenError } from "../../utils/app-error";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
} from "../../utils/response.util";
import { NotFoundError } from "../../utils/app-error";
import {
  parsePagination,
  calculateTotalPages,
} from "../../utils/pagination.util";

export class InstitutionController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institution = await institutionService.create(req.body);
      sendCreated(res, institution);
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const institution = await institutionService.getById(
        req.params.id as string,
      );
      sendSuccess(res, institution);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = parsePagination(
        req.query as { page?: string; limit?: string },
      );
      const { institutions, total } =
        await institutionService.getAll(pagination);
      sendSuccess(res, institutions, "Institutions retrieved", 200, {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: calculateTotalPages(total, pagination.limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institution = await institutionService.update(
        req.params.id as string,
        req.body,
      );
      sendSuccess(res, institution, "Institution updated");
    } catch (error) {
      next(error);
    }
  }

  async addMember(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { role } = req.body;
      const isSuperAdmin = req.user?.globalRole === "SUPER_ADMIN";

      if (isSuperAdmin && role !== "ADMIN") {
        throw new ForbiddenError(
          "Super Admin can only assign the Institution Admin role",
        );
      }

      if (!isSuperAdmin && role === "ADMIN") {
        throw new ForbiddenError(
          "Only Super Admin can assign the Institution Admin role",
        );
      }

      const member = await institutionService.addMember(
        req.params.institutionId as string,
        req.body,
      );
      sendCreated(res, member, "Member added");
    } catch (error) {
      next(error);
    }
  }

  async removeMember(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const institutionId = req.params.institutionId as string;
      const userId = req.params.userId as string;
      const isSuperAdmin = req.user?.globalRole === "SUPER_ADMIN";

      // Fetch the member to check their role before deletion
      const { members } = await institutionService.getMembers(institutionId, {
        page: 1,
        limit: 100,
        skip: 0,
      });
      const targetMember = members.find((m: any) => m.user.id === userId);

      if (!targetMember) throw new NotFoundError("Member not found");

      if (isSuperAdmin && targetMember.role !== "ADMIN") {
        throw new ForbiddenError(
          "Super Admin can only remove Institution Admins",
        );
      }

      if (!isSuperAdmin && targetMember.role === "ADMIN") {
        throw new ForbiddenError(
          "Only Super Admin can remove Institution Admins",
        );
      }

      await institutionService.removeMember(institutionId, userId);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  async getMembers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const pagination = parsePagination(
        req.query as { page?: string; limit?: string },
      );
      const { members, total } = await institutionService.getMembers(
        req.params.institutionId as string,
        pagination,
      );
      sendSuccess(res, members, "Members retrieved", 200, {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: calculateTotalPages(total, pagination.limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMemberDepartments(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (req.user?.globalRole === "SUPER_ADMIN") {
        throw new ForbiddenError(
          "Super Admin cannot manage member departments. This action is reserved for Institution Admins.",
        );
      }
      const result = await institutionService.updateMemberDepartments(
        req.params.institutionId as string,
        req.params.userId as string,
        req.body.departmentIds,
      );
      sendSuccess(res, result, "Member departments updated");
    } catch (error) {
      next(error);
    }
  }
}

export const institutionController = new InstitutionController();
