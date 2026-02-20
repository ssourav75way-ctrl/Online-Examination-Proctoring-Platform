import { Request, Response, NextFunction } from "express";
import { departmentService } from "./department.service";
import { ForbiddenError } from "../../utils/app-error";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
} from "../../utils/response.util";

export class DepartmentController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.globalRole === "SUPER_ADMIN") {
        throw new ForbiddenError(
          "Super Admin cannot create departments. This action is reserved for Institution Admins.",
        );
      }
      const dept = await departmentService.create(
        req.params.institutionId as string,
        req.body,
      );
      sendCreated(res, dept);
    } catch (error) {
      next(error);
    }
  }

  async getByInstitution(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const institutionId = req.params.institutionId as string;
      const departmentIds = req.scopedUser?.departmentIds;

      const depts = await departmentService.getByInstitution(
        institutionId,
        departmentIds,
      );
      sendSuccess(res, depts);
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
      const dept = await departmentService.getById(req.params.id as string);
      sendSuccess(res, dept);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dept = await departmentService.update(
        req.params.id as string,
        req.body,
      );
      sendSuccess(res, dept, "Department updated");
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await departmentService.delete(req.params.id as string);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const departmentController = new DepartmentController();
