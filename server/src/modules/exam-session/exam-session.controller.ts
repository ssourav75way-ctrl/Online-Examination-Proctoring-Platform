import { Request, Response, NextFunction } from "express";
import { examSessionService } from "./exam-session.service";
import { sendSuccess, sendCreated } from "../../utils/response.util";

export class ExamSessionController {
  async start(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await examSessionService.startSession(
        req.params.enrollmentId as string,
        req.ip || "unknown",
        req.headers["user-agent"] || "unknown",
      );
      sendCreated(res, result, "Exam session started");
    } catch (error) {
      next(error);
    }
  }

  async submitAnswer(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await examSessionService.submitAnswer(
        req.params.sessionId as string,
        req.body,
      );
      sendSuccess(res, result, "Answer submitted");
    } catch (error) {
      next(error);
    }
  }

  async reconnect(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await examSessionService.reconnect(
        req.params.sessionId as string,
      );
      sendSuccess(res, result, "Reconnected successfully");
    } catch (error) {
      next(error);
    }
  }

  async reportViolation(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await examSessionService.reportViolation(
        req.params.sessionId as string,
        req.body.type,
        req.body.metadata,
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async proctorUnlock(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await examSessionService.proctorUnlock(
        req.params.sessionId as string,
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async extendTime(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await examSessionService.extendTime(
        req.params.sessionId as string,
        req.body.additionalMinutes,
      );
      sendSuccess(res, result, "Time extended");
    } catch (error) {
      next(error);
    }
  }

  async finish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await examSessionService.finishSession(
        req.params.sessionId as string,
      );
      sendSuccess(res, session, "Exam finished");
    } catch (error) {
      next(error);
    }
  }

  async getQuestion(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await examSessionService.getQuestionByIndex(
        req.params.sessionId as string,
        parseInt(req.params.index as string),
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getMarkers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await examSessionService.getSessionQuestionMarkers(
        req.params.sessionId as string,
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
  async getStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await examSessionService.getSessionStatus(
        req.params.sessionId as string,
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const examSessionController = new ExamSessionController();
