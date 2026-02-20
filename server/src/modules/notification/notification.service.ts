import prisma from "../../config/database.config";
import { PaginationParams } from "../../utils/pagination.util";
import { NotificationType } from "@prisma/client";

export class NotificationService {
  async getUserNotifications(
    userId: string,
    pagination: PaginationParams,
    unreadOnly?: boolean,
  ) {
    const where: Record<string, unknown> = { recipientId: userId };
    if (unreadOnly) where.isRead = false;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, recipientId: userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  async createNotification(
    recipientId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
  ) {
    return prisma.notification.create({
      data: {
        recipientId,
        type,
        title,
        message,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  }

  async createBulkNotifications(
    recipientIds: string[],
    type: NotificationType,
    title: string,
    message: string,
  ) {
    return prisma.notification.createMany({
      data: recipientIds.map((recipientId) => ({
        recipientId,
        type,
        title,
        message,
      })),
    });
  }
}

export const notificationService = new NotificationService();
