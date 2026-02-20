import { Request, Response, NextFunction } from "express";
import { gradingService } from "./grading.service";
import { sendSuccess } from "../../utils/response.util";

export class GradingController {
  async autoGradeSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const results = await gradingService.autoGradeSession(
        req.params.sessionId as string,
      );
      sendSuccess(res, results, "Session auto-graded");
    } catch (error) {
      next(error);
    }
  }

  async overrideScore(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const answer = await gradingService.overrideScore(
        req.params.answerId as string,
        req.body.score,
        req.user!.userId,
      );
      sendSuccess(res, answer, "Score overridden");
    } catch (error) {
      next(error);
    }
  }
}

export const gradingController = new GradingController();
