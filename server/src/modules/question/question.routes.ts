import { Router } from "express";
import { questionController } from "./question.controller";
import {
  authenticate,
  institutionScope,
  requireInstitutionRole,
} from "../../middlewares";

const router = Router({ mergeParams: true });

router.post(
  "/:institutionId/questions",
  authenticate,
  institutionScope,
  requireInstitutionRole("ADMIN", "EXAMINER"),
  (req, res, next) => questionController.create(req, res, next),
);
router.get(
  "/:institutionId/questions/pool/:poolId",
  authenticate,
  institutionScope,
  (req, res, next) => questionController.getByPool(req, res, next),
);
router.get(
  "/:institutionId/questions/:id",
  authenticate,
  institutionScope,
  (req, res, next) => questionController.getById(req, res, next),
);
router.get(
  "/:institutionId/questions/:id/versions",
  authenticate,
  institutionScope,
  (req, res, next) => questionController.getVersionHistory(req, res, next),
);
router.put(
  "/:institutionId/questions/:id",
  authenticate,
  institutionScope,
  requireInstitutionRole("ADMIN", "EXAMINER"),
  (req, res, next) => questionController.update(req, res, next),
);
router.patch(
  "/:institutionId/questions/:id/deactivate",
  authenticate,
  institutionScope,
  requireInstitutionRole("ADMIN", "EXAMINER"),
  (req, res, next) => questionController.deactivate(req, res, next),
);
router.post(
  "/:institutionId/questions/:id/rollback/:versionId",
  authenticate,
  institutionScope,
  requireInstitutionRole("ADMIN", "EXAMINER"),
  (req, res, next) => questionController.rollback(req, res, next),
);

export default router;
