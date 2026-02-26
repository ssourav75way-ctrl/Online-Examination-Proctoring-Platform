import { Request, Response, NextFunction } from "express";
export declare class NotificationController {
    getMyNotifications(req: Request, res: Response, next: NextFunction): Promise<void>;
    getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void>;
    markAsRead(req: Request, res: Response, next: NextFunction): Promise<void>;
    markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const notificationController: NotificationController;
//# sourceMappingURL=notification.controller.d.ts.map