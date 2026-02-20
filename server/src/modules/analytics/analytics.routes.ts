import { Router } from "express";
import { analyticsController } from "./analytics.controller";
import { authenticate } from "../../middlewares";

const router = Router();

router.get("/exams/:examId", authenticate, (req, res, next) =>
  analyticsController.getExamAnalytics(req, res, next),
);
router.get("/exams/:examId/integrity", authenticate, (req, res, next) =>
  analyticsController.getIntegrityReport(req, res, next),
);
router.get(
  "/questions/:examQuestionId/difficulty",
  authenticate,
  (req, res, next) => analyticsController.getQuestionDifficulty(req, res, next),
);
router.get(
  "/questions/:examQuestionId/distractors",
  authenticate,
  (req, res, next) => analyticsController.getDistractorAnalysis(req, res, next),
);

export default router;
