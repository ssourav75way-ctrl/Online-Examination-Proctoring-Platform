import { Request, Response, NextFunction } from "express";
import { questionPoolService } from "./question-pool.service";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
} from "../../utils/response.util";
import {
  parsePagination,
  calculateTotalPages,
} from "../../utils/pagination.util";

export class QuestionPoolController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departmentIds = req.scopedUser?.departmentIds || [];
      const pool = await questionPoolService.create(req.body, departmentIds);
      sendCreated(res, pool);
    } catch (error) {
      next(error);
    }
  }

  async getByDepartment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const pagination = parsePagination(
        req.query as { page?: string; limit?: string },
      );
      const { pools, total } = await questionPoolService.getByDepartment(
        req.params.departmentId as string,
        pagination,
      );
      sendSuccess(res, pools, "Pools retrieved", 200, {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: calculateTotalPages(total, pagination.limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async getAccessiblePools(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const pagination = parsePagination(
        req.query as { page?: string; limit?: string },
      );
      const institutionId = req.scopedUser!.institutionId;
      const departmentIds = req.scopedUser!.departmentIds;
      const { pools, total } = await questionPoolService.getAccessiblePools(
        institutionId,
        departmentIds,
        pagination,
      );
      sendSuccess(res, pools, "Accessible pools retrieved", 200, {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: calculateTotalPages(total, pagination.limit),
      });
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
      const pool = await questionPoolService.getById(req.params.id as string);
      sendSuccess(res, pool);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pool = await questionPoolService.update(req.params.id as string, req.body);
      sendSuccess(res, pool, "Pool updated");
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await questionPoolService.delete(req.params.id as string);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const questionPoolController = new QuestionPoolController();
