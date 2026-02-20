import { Router } from "express";
import { proctoringController } from "./proctoring.controller";
import { authenticate, snapshotLimiter } from "../../middlewares";

const router = Router();


router.post("/snapshots", authenticate, snapshotLimiter, (req, res, next) =>
  proctoringController.uploadSnapshot(req, res, next),
);


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
router.get("/active-sessions", authenticate, (req, res, next) =>
  proctoringController.getActiveSessions(req, res, next),
);

export default router;
