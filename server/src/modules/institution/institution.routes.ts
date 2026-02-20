import { Router } from "express";
import { institutionController } from "./institution.controller";
import {
  authenticate,
  requireGlobalRole,
  institutionScope,
  requireInstitutionRole,
} from "../../middlewares";

const router = Router();

router.post(
  "/",
  authenticate,
  requireGlobalRole("SUPER_ADMIN"),
  (req, res, next) => institutionController.create(req, res, next),
);
router.get("/", authenticate, (req, res, next) =>
  institutionController.getAll(req, res, next),
);
router.get("/:id", authenticate, (req, res, next) =>
  institutionController.getById(req, res, next),
);
router.put(
  "/:id",
  authenticate,
  requireGlobalRole("SUPER_ADMIN"),
  (req, res, next) => institutionController.update(req, res, next),
);


router.get(
  "/:institutionId/members",
  authenticate,
  institutionScope,
  requireInstitutionRole("ADMIN"),
  (req, res, next) => institutionController.getMembers(req, res, next),
);
router.post(
  "/:institutionId/members",
  authenticate,
  institutionScope,
  requireInstitutionRole("ADMIN"),
  (req, res, next) => institutionController.addMember(req, res, next),
);
router.delete(
  "/:institutionId/members/:userId",
  authenticate,
  institutionScope,
  requireInstitutionRole("ADMIN"),
  (req, res, next) => institutionController.removeMember(req, res, next),
);
router.put(
  "/:institutionId/members/:userId/departments",
  authenticate,
  institutionScope,
  requireInstitutionRole("ADMIN"),
  (req, res, next) =>
    institutionController.updateMemberDepartments(req, res, next),
);

export default router;
