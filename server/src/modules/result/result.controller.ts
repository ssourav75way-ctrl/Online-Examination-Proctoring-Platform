import { Request, Response, NextFunction } from "express";
import { resultService } from "./result.service";
import { sendSuccess, sendCreated } from "../../utils/response.util";
import {
  parsePagination,
  calculateTotalPages,
} from "../../utils/pagination.util";
import { ReEvalStatus } from "@prisma/client";

export class ResultController {
  async generateResults(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const results = await resultService.generateResults(
        req.params.examId as string,
      );
      sendSuccess(res, results, `${results.length} results generated`);
    } catch (error) {
      next(error);
    }
  }

  async publishResults(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await resultService.publishResults(req.params.examId as string);
      sendSuccess(res, null, "Results published");
    } catch (error) {
      next(error);
    }
  }

  async getCandidateResult(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await resultService.getCandidateResult(
        req.params.enrollmentId as string,
        req.user!.userId,
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getMyResults(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const results = await resultService.getMyResults(req.user!.userId);
      sendSuccess(res, results, "Results history retrieved");
    } catch (error) {
      next(error);
    }
  }

  async getExamResults(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const pagination = parsePagination(
        req.query as { page?: string; limit?: string },
      );
      const { results, total } = await resultService.getExamResults(
        req.params.examId as string,
        pagination,
      );
      sendSuccess(res, results, "Results retrieved", 200, {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: calculateTotalPages(total, pagination.limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async fileReEvaluation(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const request = await resultService.fileReEvaluation(
        req.params.resultId as string,
        req.body.candidateAnswerId,
        req.body.justification,
        req.user!.userId,
      );
      sendCreated(res, request, "Re-evaluation request filed");
    } catch (error) {
      next(error);
    }
  }

  async processReEvaluation(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await resultService.processReEvaluation(
        req.params.requestId as string,
        req.user!.userId,
        req.body.status as ReEvalStatus,
        req.body.newScore,
        req.body.reviewNotes,
      );
      sendSuccess(res, result, "Re-evaluation processed");
    } catch (error) {
      next(error);
    }
  }

  async getReEvaluationRequests(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const pagination = parsePagination(
        req.query as { page?: string; limit?: string },
      );
      const { requests, total } = await resultService.getReEvaluationRequests(
        req.params.examId as string,
        pagination,
      );
      sendSuccess(res, requests, "Requests retrieved", 200, {
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

export const resultController = new ResultController();
