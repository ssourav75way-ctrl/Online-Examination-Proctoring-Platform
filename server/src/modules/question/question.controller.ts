import { Request, Response, NextFunction } from "express";
import { questionService } from "./question.service";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
} from "../../utils/response.util";
import {
  parsePagination,
  calculateTotalPages,
} from "../../utils/pagination.util";
import { QuestionType } from "@prisma/client";

export class QuestionController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departmentIds = req.scopedUser?.departmentIds || [];
      const question = await questionService.create(
        req.body,
        req.user!.userId,
        departmentIds,
      );
      sendCreated(res, question);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const question = await questionService.update(
        req.params.id as string,
        req.body,
        req.user!.userId,
      );
      sendSuccess(res, question, "Question updated (new version created)");
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
      const question = await questionService.getById(req.params.id as string);
      sendSuccess(res, question);
    } catch (error) {
      next(error);
    }
  }

  async getByPool(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const pagination = parsePagination(
        req.query as { page?: string; limit?: string },
      );
      const filters = {
        topic: req.query.topic as string | undefined,
        type: req.query.type as QuestionType | undefined,
        difficulty: req.query.difficulty
          ? parseInt(req.query.difficulty as string, 10)
          : undefined,
      };
      const { questions, total } = await questionService.getByPool(
        req.params.poolId as string,
        pagination,
        filters,
      );
      sendSuccess(res, questions, "Questions retrieved", 200, {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: calculateTotalPages(total, pagination.limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async getVersionHistory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const versions = await questionService.getVersionHistory(req.params.id as string);
      sendSuccess(res, versions);
    } catch (error) {
      next(error);
    }
  }

  async deactivate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await questionService.deactivate(req.params.id as string);
      sendSuccess(res, null, "Question deactivated");
    } catch (error) {
      next(error);
    }
  }
}

export const questionController = new QuestionController();
