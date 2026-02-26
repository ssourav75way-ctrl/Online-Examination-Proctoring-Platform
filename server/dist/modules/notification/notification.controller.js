"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const notification_service_1 = require("./notification.service");
const response_util_1 = require("../../utils/response.util");
const pagination_util_1 = require("../../utils/pagination.util");
class NotificationController {
    async getMyNotifications(req, res, next) {
        try {
            const pagination = (0, pagination_util_1.parsePagination)(req.query);
            const unreadOnly = req.query.unreadOnly === "true";
            const { notifications, total } = await notification_service_1.notificationService.getUserNotifications(req.user.userId, pagination, unreadOnly);
            (0, response_util_1.sendSuccess)(res, notifications, "Notifications retrieved", 200, {
                page: pagination.page,
                limit: pagination.limit,
                total,
                totalPages: (0, pagination_util_1.calculateTotalPages)(total, pagination.limit),
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getUnreadCount(req, res, next) {
        try {
            const count = await notification_service_1.notificationService.getUnreadCount(req.user.userId);
            (0, response_util_1.sendSuccess)(res, { unreadCount: count });
        }
        catch (error) {
            next(error);
        }
    }
    async markAsRead(req, res, next) {
        try {
            await notification_service_1.notificationService.markAsRead(req.params.id, req.user.userId);
            (0, response_util_1.sendSuccess)(res, null, "Notification marked as read");
        }
        catch (error) {
            next(error);
        }
    }
    async markAllAsRead(req, res, next) {
        try {
            await notification_service_1.notificationService.markAllAsRead(req.user.userId);
            (0, response_util_1.sendSuccess)(res, null, "All notifications marked as read");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
//# sourceMappingURL=notification.controller.js.map