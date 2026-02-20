import { apiSlice } from "./api";

export interface ProctorFlag {
  id: string;
  sessionId: string;
  snapshotId: string | null;
  flagType: string;
  description: string | null;
  severity: number;
  reviewedById: string | null;
  reviewStatus: "PENDING" | "APPROVED" | "DISMISSED";
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
  session?: {
    enrollment: {
      exam: { title: string; id: string };
      candidate: { firstName: string; lastName: string; email: string };
    };
  };
}

export interface ProctorSnapshot {
  id: string;
  sessionId: string;
  imageUrl: string;
  capturedAt: string;
  faceDetected: boolean;
  multipleFaces: boolean;
  candidateAbsent: boolean;
}

export interface LiveSession {
  id: string;
  enrollment: {
    candidate: { id: string; firstName: string; lastName: string };
    exam: { id: string; title: string };
  };
  snapshots: ProctorSnapshot[];
  _count: {
    flags: number;
  };
}

export const proctorApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPendingFlags: builder.query<
      {
        data: ProctorFlag[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      },
      { page?: number; limit?: number; institutionId?: string }
    >({
      query: (params) => ({
        url: "/proctoring/flags/pending",
        params,
      }),
      providesTags: ["Proctor"],
    }),

    reviewFlag: builder.mutation<
      { data: ProctorFlag },
      { flagId: string; status: "APPROVED" | "DISMISSED"; reviewNotes?: string }
    >({
      query: ({ flagId, ...body }) => ({
        url: `/proctoring/flags/${flagId}/review`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Proctor"],
    }),

    uploadSnapshot: builder.mutation<
      { data: { snapshot: ProctorSnapshot; flags: ProctorFlag[] } },
      {
        sessionId: string;
        imageUrl: string;
        faceDetected: boolean;
        multipleFaces: boolean;
        candidateAbsent: boolean;
      }
    >({
      query: (body) => ({
        url: "/proctoring/snapshots",
        method: "POST",
        body,
      }),
    }),

    getSessionSnapshots: builder.query<
      {
        data: ProctorSnapshot[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      },
      { sessionId: string; page?: number; limit?: number }
    >({
      query: ({ sessionId, ...params }) => ({
        url: `/proctoring/sessions/${sessionId}/snapshots`,
        params,
      }),
    }),

    getSessionFlags: builder.query<
      { data: ProctorFlag[] },
      { sessionId: string }
    >({
      query: ({ sessionId }) => `/proctoring/sessions/${sessionId}/flags`,
    }),

    getActiveSessions: builder.query<
      { data: LiveSession[] },
      { institutionId: string }
    >({
      query: ({ institutionId }) => ({
        url: "/proctoring/active-sessions",
        params: { institutionId },
      }),
      providesTags: ["Proctor"],
    }),
  }),
});

export const {
  useGetPendingFlagsQuery,
  useReviewFlagMutation,
  useUploadSnapshotMutation,
  useGetSessionSnapshotsQuery,
  useGetSessionFlagsQuery,
  useGetActiveSessionsQuery,
} = proctorApi;
