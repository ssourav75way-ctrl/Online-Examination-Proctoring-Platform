import { NotificationType } from "@prisma/client";

/* ─── Response DTOs ─── */

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationListResponseDTO {
  notifications: NotificationDTO[];
  total: number;
}

export interface UnreadCountResponseDTO {
  count: number;
}
