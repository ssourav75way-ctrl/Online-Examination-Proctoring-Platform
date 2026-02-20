import { Router } from "express";
import { notificationController } from "./notification.controller";
import { authenticate } from "../../middlewares";

const router = Router();

router.get("/", authenticate, (req, res, next) =>
  notificationController.getMyNotifications(req, res, next),
);
router.get("/unread-count", authenticate, (req, res, next) =>
  notificationController.getUnreadCount(req, res, next),
);
router.patch("/:id/read", authenticate, (req, res, next) =>
  notificationController.markAsRead(req, res, next),
);
router.patch("/read-all", authenticate, (req, res, next) =>
  notificationController.markAllAsRead(req, res, next),
);

export default router;
