import { Router } from "express";
import { questionPoolController } from "./question-pool.controller";
import {
  authenticate,
  institutionScope,
  requireInstitutionRole,
} from "../../middlewares";

const router = Router({ mergeParams: true });

router.post(
  "/:institutionId/question-pools",
  authenticate,
  institutionScope,
  requireInstitutionRole("ADMIN", "EXAMINER"),
  (req, res, next) => questionPoolController.create(req, res, next),
);
router.get(
  "/:institutionId/question-pools",
  authenticate,
  institutionScope,
  (req, res, next) => questionPoolController.getAccessiblePools(req, res, next),
);
router.get(
  "/:institutionId/question-pools/department/:departmentId",
  authenticate,
  institutionScope,
  (req, res, next) => questionPoolController.getByDepartment(req, res, next),
);
router.get(
  "/:institutionId/question-pools/:id",
  authenticate,
  institutionScope,
  (req, res, next) => questionPoolController.getById(req, res, next),
);
router.put(
  "/:institutionId/question-pools/:id",
  authenticate,
  institutionScope,
  requireInstitutionRole("ADMIN", "EXAMINER"),
  (req, res, next) => questionPoolController.update(req, res, next),
);
router.delete(
  "/:institutionId/question-pools/:id",
  authenticate,
  institutionScope,
  requireInstitutionRole("ADMIN"),
  (req, res, next) => questionPoolController.delete(req, res, next),
);

export default router;
