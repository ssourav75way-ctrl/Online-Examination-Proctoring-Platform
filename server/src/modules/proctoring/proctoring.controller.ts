import { Request, Response, NextFunction } from "express";
import { proctoringService } from "./proctoring.service";
import { sendSuccess, sendCreated } from "../../utils/response.util";
import {
  parsePagination,
  calculateTotalPages,
} from "../../utils/pagination.util";
import { ReviewStatus } from "@prisma/client";

export class ProctoringController {
  async uploadSnapshot(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await proctoringService.uploadSnapshot(req.body);
      sendCreated(res, result, "Snapshot uploaded");
    } catch (error) {
      next(error);
    }
  }

  async getPendingFlags(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const pagination = parsePagination(
        req.query as { page?: string; limit?: string },
      );
      const institutionId = req.query.institutionId as string | undefined;
      const { flags, total } = await proctoringService.getPendingFlags(
        pagination,
        institutionId,
      );
      sendSuccess(res, flags, "Pending flags retrieved", 200, {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: calculateTotalPages(total, pagination.limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async reviewFlag(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const flag = await proctoringService.reviewFlag(
        req.params.flagId as string,
        req.user!.userId,
        req.body.status as ReviewStatus,
        req.body.reviewNotes,
      );
      sendSuccess(res, flag, "Flag reviewed");
    } catch (error) {
      next(error);
    }
  }

  async getSessionSnapshots(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const pagination = parsePagination(
        req.query as { page?: string; limit?: string },
      );
      const { snapshots, total } = await proctoringService.getSessionSnapshots(
        req.params.sessionId as string,
        pagination,
      );
      sendSuccess(res, snapshots, "Snapshots retrieved", 200, {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: calculateTotalPages(total, pagination.limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async getSessionFlags(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const flags = await proctoringService.getSessionFlags(
        req.params.sessionId as string,
      );
      sendSuccess(res, flags);
    } catch (error) {
      next(error);
    }
  }

  async getActiveSessions(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const institutionId =
        (req.query.institutionId as string) ||
        (req.params.institutionId as string);
      const sessions = await proctoringService.getActiveSessions(institutionId);
      sendSuccess(res, sessions, "Active proctoring sessions retrieved");
    } catch (error) {
      next(error);
    }
  }
}

export const proctoringController = new ProctoringController();
