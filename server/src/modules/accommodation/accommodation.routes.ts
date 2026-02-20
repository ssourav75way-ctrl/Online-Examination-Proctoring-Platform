import { Router } from "express";
import { accommodationController } from "./accommodation.controller";
import { authenticate } from "../../middlewares";

const router = Router();

router.post("/", authenticate, (req, res, next) =>
  accommodationController.grant(req, res, next),
);
router.patch("/:id/revoke", authenticate, (req, res, next) =>
  accommodationController.revoke(req, res, next),
);
router.patch("/:id", authenticate, (req, res, next) =>
  accommodationController.modify(req, res, next),
);
router.get("/candidate/:candidateId", authenticate, (req, res, next) =>
  accommodationController.getCandidateAccommodations(req, res, next),
);
router.get("/audit", authenticate, (req, res, next) =>
  accommodationController.getAuditTrail(req, res, next),
);

export default router;
