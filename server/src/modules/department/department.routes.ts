import { Router } from "express";
import { departmentController } from "./department.controller";
import {
  authenticate,
  institutionScope,
  requireInstitutionRole,
} from "../../middlewares";

const router = Router();

router.post(
  "/:institutionId/departments",
  authenticate,
  institutionScope,
  requireInstitutionRole("ADMIN"),
  (req, res, next) => departmentController.create(req, res, next),
);
router.get(
  "/:institutionId/departments",
  authenticate,
  institutionScope,
  (req, res, next) => departmentController.getByInstitution(req, res, next),
);
router.get(
  "/:institutionId/departments/:id",
  authenticate,
  institutionScope,
  (req, res, next) => departmentController.getById(req, res, next),
);
router.put(
  "/:institutionId/departments/:id",
  authenticate,
  institutionScope,
  requireInstitutionRole("ADMIN"),
  (req, res, next) => departmentController.update(req, res, next),
);
router.delete(
  "/:institutionId/departments/:id",
  authenticate,
  institutionScope,
  requireInstitutionRole("ADMIN"),
  (req, res, next) => departmentController.delete(req, res, next),
);

export default router;
