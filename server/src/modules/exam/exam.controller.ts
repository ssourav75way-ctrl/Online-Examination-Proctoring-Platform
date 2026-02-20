import { Request, Response, NextFunction } from "express";
import { examService } from "./exam.service";
import { sendSuccess, sendCreated } from "../../utils/response.util";
import {
  parsePagination,
  calculateTotalPages,
} from "../../utils/pagination.util";
import { ExamStatus } from "@prisma/client";

export class ExamController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exam = await examService.create(req.body, req.user!.userId);
      sendCreated(res, exam);
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
      const exam = await examService.getById(req.params.id as string);
      sendSuccess(res, exam);
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
      const pagination = parsePagination(
        req.query as { page?: string; limit?: string },
      );
      const status = req.query.status as ExamStatus | undefined;
      const { exams, total } = await examService.getByInstitution(
        req.params.institutionId as string,
        pagination,
        status,
      );
      sendSuccess(res, exams, "Exams retrieved", 200, {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: calculateTotalPages(total, pagination.limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async schedule(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const exam = await examService.schedule(req.params.id as string);
      sendSuccess(res, exam, "Exam scheduled");
    } catch (error) {
      next(error);
    }
  }

  async enrollCandidate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const enrollment = await examService.enrollCandidate(
        req.params.id as string,
        req.body,
      );
      sendCreated(res, enrollment, "Candidate enrolled");
    } catch (error) {
      next(error);
    }
  }

  async reschedule(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await examService.reschedule(
        req.params.id as string,
        req.body.scheduledStartTime,
        req.body.scheduledEndTime,
      );
      sendSuccess(
        res,
        result,
        result.conflicts.length > 0
          ? `Rescheduled with ${result.conflicts.length} conflict(s) detected`
          : "Rescheduled successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getEnrollments(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const pagination = parsePagination(
        req.query as { page?: string; limit?: string },
      );
      const { enrollments, total } = await examService.getEnrollments(
        req.params.id as string,
        pagination,
      );
      sendSuccess(res, enrollments, "Enrollments retrieved", 200, {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: calculateTotalPages(total, pagination.limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exam = await examService.cancelExam(req.params.id as string);
      sendSuccess(res, exam, "Exam cancelled");
    } catch (error) {
      next(error);
    }
  }

  async getRetakeQuestions(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const questionIds = await examService.getRetakeQuestionSet(
        req.params.id as string,
        req.params.candidateId as string,
      );
      sendSuccess(res, {
        availableQuestionIds: questionIds,
        count: questionIds.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exam = await examService.update(req.params.id as string, req.body);
      sendSuccess(res, exam, "Exam updated");
    } catch (error) {
      next(error);
    }
  }
}

export const examController = new ExamController();
