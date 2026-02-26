import { PaginationParams } from "../../utils/pagination.util";
import { NotificationType } from "@prisma/client";
export declare class NotificationService {
    getUserNotifications(userId: string, pagination: PaginationParams, unreadOnly?: boolean): Promise<{
        notifications: {
            type: import(".prisma/client").$Enums.NotificationType;
            id: string;
            createdAt: Date;
            title: string;
            recipientId: string;
            message: string;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
            isRead: boolean;
        }[];
        total: number;
    }>;
    markAsRead(notificationId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAllAsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getUnreadCount(userId: string): Promise<number>;
    createNotification(recipientId: string, type: NotificationType, title: string, message: string, metadata?: Record<string, unknown>): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        id: string;
        createdAt: Date;
        title: string;
        recipientId: string;
        message: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        isRead: boolean;
    }>;
    createBulkNotifications(recipientIds: string[], type: NotificationType, title: string, message: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=notification.service.d.ts.map