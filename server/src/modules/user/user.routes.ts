import { Router } from "express";
import { userController } from "./user.controller";
import { authenticate, requireGlobalRole } from "../../middlewares";

const router = Router();

router.get("/profile", authenticate, (req, res, next) =>
  userController.getProfile(req, res, next),
);
router.put("/profile", authenticate, (req, res, next) =>
  userController.updateProfile(req, res, next),
);
router.get(
  "/",
  authenticate,
  requireGlobalRole("SUPER_ADMIN"),
  (req, res, next) => userController.getAll(req, res, next),
);
router.get("/search", authenticate, (req, res, next) =>
  userController.findByEmail(req, res, next),
);
router.get("/:id", authenticate, (req, res, next) =>
  userController.getById(req, res, next),
);
router.patch(
  "/:id/deactivate",
  authenticate,
  requireGlobalRole("SUPER_ADMIN"),
  (req, res, next) => userController.deactivate(req, res, next),
);
router.patch(
  "/:id/activate",
  authenticate,
  requireGlobalRole("SUPER_ADMIN"),
  (req, res, next) => userController.activate(req, res, next),
);

export default router;
