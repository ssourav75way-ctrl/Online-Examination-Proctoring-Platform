import { Router } from "express";
import { proctoringController } from "./proctoring.controller";
import { authenticate, snapshotLimiter } from "../../middlewares";

const router = Router();

// Candidate endpoints
router.post("/snapshots", authenticate, snapshotLimiter, (req, res, next) =>
  proctoringController.uploadSnapshot(req, res, next),
);

// Proctor endpoints
router.get("/flags/pending", authenticate, (req, res, next) =>
  proctoringController.getPendingFlags(req, res, next),
);
router.patch("/flags/:flagId/review", authenticate, (req, res, next) =>
  proctoringController.reviewFlag(req, res, next),
);
router.get("/sessions/:sessionId/snapshots", authenticate, (req, res, next) =>
  proctoringController.getSessionSnapshots(req, res, next),
);
router.get("/sessions/:sessionId/flags", authenticate, (req, res, next) =>
  proctoringController.getSessionFlags(req, res, next),
);

export default router;
