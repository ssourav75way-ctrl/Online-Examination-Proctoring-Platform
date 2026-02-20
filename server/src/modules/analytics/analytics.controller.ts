import { Request, Response, NextFunction } from "express";
import { analyticsService } from "./analytics.service";
import { sendSuccess } from "../../utils/response.util";

export class AnalyticsController {
  async getExamAnalytics(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const analytics = await analyticsService.getExamAnalytics(
        req.params.examId as string,
      );
      sendSuccess(res, analytics, "Analytics retrieved");
    } catch (error) {
      next(error);
    }
  }

  async getQuestionDifficulty(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const index = await analyticsService.getQuestionDifficultyIndex(
        req.params.examQuestionId as string,
      );
      sendSuccess(res, { difficultyIndex: index });
    } catch (error) {
      next(error);
    }
  }

  async getDistractorAnalysis(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const analysis = await analyticsService.getDistractorAnalysis(
        req.params.examQuestionId as string,
      );
      sendSuccess(res, analysis);
    } catch (error) {
      next(error);
    }
  }

  async getIntegrityReport(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const report = await analyticsService.getIntegrityReport(
        req.params.examId as string,
      );
      sendSuccess(res, report, "Integrity report generated");
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
