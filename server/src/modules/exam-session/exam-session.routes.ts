import { Router } from "express";
import { examSessionController } from "./exam-session.controller";
import { authenticate } from "../../middlewares";

const router = Router();

// Candidate endpoints
router.post("/start/:enrollmentId", authenticate, (req, res, next) =>
  examSessionController.start(req, res, next),
);
router.post("/:sessionId/submit", authenticate, (req, res, next) =>
  examSessionController.submitAnswer(req, res, next),
);
router.get("/:sessionId/reconnect", authenticate, (req, res, next) =>
  examSessionController.reconnect(req, res, next),
);
router.post("/:sessionId/violation", authenticate, (req, res, next) =>
  examSessionController.reportViolation(req, res, next),
);
router.post("/:sessionId/finish", authenticate, (req, res, next) =>
  examSessionController.finish(req, res, next),
);
router.get("/:sessionId/status", authenticate, (req, res, next) =>
  examSessionController.getStatus(req, res, next),
);

// Proctor endpoints
router.patch("/:sessionId/unlock", authenticate, (req, res, next) =>
  examSessionController.proctorUnlock(req, res, next),
);
router.patch("/:sessionId/extend-time", authenticate, (req, res, next) =>
  examSessionController.extendTime(req, res, next),
);

export default router;
