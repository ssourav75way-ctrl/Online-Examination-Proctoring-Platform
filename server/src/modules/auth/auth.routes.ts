import { Router } from "express";
import { authController } from "./auth.controller";
import { authLimiter } from "../../middlewares";

const router = Router();

router.post("/register", authLimiter, (req, res, next) =>
  authController.register(req, res, next),
);
router.post("/login", authLimiter, (req, res, next) =>
  authController.login(req, res, next),
);
router.post("/refresh", authLimiter, (req, res, next) =>
  authController.refreshToken(req, res, next),
);

export default router;
