"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const database_config_1 = __importDefault(require("../../config/database.config"));
class NotificationService {
    async getUserNotifications(userId, pagination, unreadOnly) {
        const where = { recipientId: userId };
        if (unreadOnly)
            where.isRead = false;
        const [notifications, total] = await Promise.all([
            database_config_1.default.notification.findMany({
                where,
                skip: pagination.skip,
                take: pagination.limit,
                orderBy: { createdAt: "desc" },
            }),
            database_config_1.default.notification.count({ where }),
        ]);
        return { notifications, total };
    }
    async markAsRead(notificationId, userId) {
        return database_config_1.default.notification.updateMany({
            where: { id: notificationId, recipientId: userId },
            data: { isRead: true },
        });
    }
    async markAllAsRead(userId) {
        return database_config_1.default.notification.updateMany({
            where: { recipientId: userId, isRead: false },
            data: { isRead: true },
        });
    }
    async getUnreadCount(userId) {
        return database_config_1.default.notification.count({
            where: { recipientId: userId, isRead: false },
        });
    }
    async createNotification(recipientId, type, title, message, metadata) {
        return database_config_1.default.notification.create({
            data: {
                recipientId,
                type,
                title,
                message,
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
            },
        });
    }
    async createBulkNotifications(recipientIds, type, title, message) {
        return database_config_1.default.notification.createMany({
            data: recipientIds.map((recipientId) => ({
                recipientId,
                type,
                title,
                message,
            })),
        });
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
//# sourceMappingURL=notification.service.js.map