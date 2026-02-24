import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import {
  AppNotification,
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from "@/services/notificationApi";
import { CONSTANTS } from "@/constants";
import { formatDateIST } from "@/utils/dateFormat";

const resolveNotificationLink = (
  notification: AppNotification,
): string | null => {
  const { type, metadata } = notification;
  const meta = (metadata || {}) as Record<string, unknown>;

  if (type === "RESULT_PUBLISHED") {
    return "/dashboard/history";
  }

  if (type === "EXAM_RESCHEDULE" || type === "EXAM_CONFLICT") {
    const examId = typeof meta.examId === "string" ? meta.examId : null;
    if (examId) {
      return `/dashboard/exams/${examId}`;
    }
    return "/dashboard/exams";
  }

  if (type === "EXAM_LOCKED") {
    return "/dashboard/sessions";
  }

  return null;
};

export function NotificationCenterPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(CONSTANTS.PAGINATION.DEFAULT_PAGE as number);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const { data, isLoading, isError } = useGetNotificationsQuery({
    page,
    limit: CONSTANTS.PAGINATION.DEFAULT_LIMIT,
    unreadOnly: showUnreadOnly,
  });

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkAllLoading }] =
    useMarkAllAsReadMutation();

  const notifications = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  const handleOpenNotification = async (notification: AppNotification) => {
    if (!notification.isRead) {
      try {
        await markAsRead({ id: notification.id }).unwrap();
      } catch {

      }
    }

    const link = resolveNotificationLink(notification);
    if (link) {
      navigate(link);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch {

    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">
            Notification Center
          </h1>
          <p className="text-text-muted mt-1">
            Review important updates about your exams and results.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
              className="rounded border-border text-primary-600 focus:ring-primary-500"
            />
            Unread only
          </label>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isMarkAllLoading || notifications.length === 0}
          >
            Mark all as read
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="card p-8 flex justify-center items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
        </div>
      )}

      {isError && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          Failed to load notifications. Please try again.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-sm">
              You have no notifications.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`px-6 py-4 flex items-start gap-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                    !notification.isRead ? "bg-primary-50/40" : ""
                  }`}
                  onClick={() => handleOpenNotification(notification)}
                >
                  <div className="mt-1">
                    {!notification.isRead && (
                      <span className="inline-block w-2 h-2 rounded-full bg-primary-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-text-main">
                        {notification.title}
                      </h3>
                      <span className="text-xs text-text-muted">
                        {formatDateIST(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted mt-1">
                      {notification.message}
                    </p>
                    <div className="mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary-600 hover:text-primary-700 px-0"
                      >
                        View details
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {notifications.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationCenterPage;
