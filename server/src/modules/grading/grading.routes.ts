import { Router } from "express";
import { gradingController } from "./grading.controller";
import { authenticate } from "../../middlewares";

const router = Router();

router.post("/sessions/:sessionId/auto-grade", authenticate, (req, res, next) =>
  gradingController.autoGradeSession(req, res, next),
);
router.patch("/answers/:answerId/override", authenticate, (req, res, next) =>
  gradingController.overrideScore(req, res, next),
);

export default router;
