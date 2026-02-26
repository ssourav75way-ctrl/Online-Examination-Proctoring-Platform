"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("./notification.controller");
const middlewares_1 = require("../../middlewares");
const router = (0, express_1.Router)();
router.get("/", middlewares_1.authenticate, (req, res, next) => notification_controller_1.notificationController.getMyNotifications(req, res, next));
router.get("/unread-count", middlewares_1.authenticate, (req, res, next) => notification_controller_1.notificationController.getUnreadCount(req, res, next));
router.patch("/:id/read", middlewares_1.authenticate, (req, res, next) => notification_controller_1.notificationController.markAsRead(req, res, next));
router.patch("/read-all", middlewares_1.authenticate, (req, res, next) => notification_controller_1.notificationController.markAllAsRead(req, res, next));
exports.default = router;
//# sourceMappingURL=notification.routes.js.map