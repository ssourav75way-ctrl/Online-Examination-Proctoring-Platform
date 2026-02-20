import { Request, Response, NextFunction } from "express";
import { notificationService } from "./notification.service";
import { sendSuccess } from "../../utils/response.util";
import {
  parsePagination,
  calculateTotalPages,
} from "../../utils/pagination.util";

export class NotificationController {
  async getMyNotifications(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const pagination = parsePagination(
        req.query as { page?: string; limit?: string },
      );
      const unreadOnly = req.query.unreadOnly === "true";
      const { notifications, total } =
        await notificationService.getUserNotifications(
          req.user!.userId,
          pagination,
          unreadOnly,
        );
      sendSuccess(res, notifications, "Notifications retrieved", 200, {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: calculateTotalPages(total, pagination.limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const count = await notificationService.getUnreadCount(req.user!.userId);
      sendSuccess(res, { unreadCount: count });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await notificationService.markAsRead(req.params.id as string, req.user!.userId);
      sendSuccess(res, null, "Notification marked as read");
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await notificationService.markAllAsRead(req.user!.userId);
      sendSuccess(res, null, "All notifications marked as read");
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
