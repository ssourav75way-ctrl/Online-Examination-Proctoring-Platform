import { apiSlice } from "./api";

export interface AppNotification {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      {
        data: AppNotification[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      },
      { page?: number; limit?: number; unreadOnly?: boolean }
    >({
      query: (params) => ({
        url: "/notifications",
        params,
      }),
      providesTags: ["Notification"],
    }),

    getUnreadCount: builder.query<{ data: { unreadCount: number } }, void>({
      query: () => "/notifications/unread-count",
      providesTags: ["Notification"],
    }),

    markAsRead: builder.mutation<{ data: null }, { id: string }>({
      query: ({ id }) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),

    markAllAsRead: builder.mutation<{ data: null }, void>({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} = notificationApi;
