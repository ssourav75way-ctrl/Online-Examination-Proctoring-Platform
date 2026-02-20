import { Request, Response, NextFunction } from "express";
import { accommodationService } from "./accommodation.service";
import { sendSuccess, sendCreated } from "../../utils/response.util";
import {
  parsePagination,
  calculateTotalPages,
} from "../../utils/pagination.util";

export class AccommodationController {
  async grant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accommodation = await accommodationService.grant(
        req.body,
        req.user!.userId,
      );
      sendCreated(res, accommodation, "Accommodation granted");
    } catch (error) {
      next(error);
    }
  }

  async revoke(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await accommodationService.revoke(
        req.params.id as string,
        req.user!.userId,
        req.body.reason,
      );
      sendSuccess(res, null, "Accommodation revoked");
    } catch (error) {
      next(error);
    }
  }

  async modify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accommodation = await accommodationService.modify(
        req.params.id as string,
        req.body,
        req.user!.userId,
      );
      sendSuccess(res, accommodation, "Accommodation modified");
    } catch (error) {
      next(error);
    }
  }

  async getCandidateAccommodations(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const accommodations =
        await accommodationService.getCandidateAccommodations(
          req.params.candidateId as string,
        );
      sendSuccess(res, accommodations);
    } catch (error) {
      next(error);
    }
  }

  async getAuditTrail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const pagination = parsePagination(
        req.query as { page?: string; limit?: string },
      );
      const candidateId = req.query.candidateId as string | undefined;
      const { audits, total } = await accommodationService.getAuditTrail(
        pagination,
        candidateId,
      );
      sendSuccess(res, audits, "Audit trail retrieved", 200, {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: calculateTotalPages(total, pagination.limit),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const accommodationController = new AccommodationController();
