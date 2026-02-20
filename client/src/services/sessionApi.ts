import { apiSlice } from "./api";
import { ExamSession } from "@/types/exam";

interface SessionStatus {
  session: ExamSession;
  remainingSeconds: number;
  serverTime: string;
}

interface AnswerResult {
  answerId: string;
  autoScore: number | null;
  isCorrect: boolean | null;
}

interface ViolationResult {
  totalViolations: number;
  isLocked: boolean;
}

export const sessionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    startSession: builder.mutation<
      { data: { session: ExamSession; questions: unknown[] } },
      { enrollmentId: string }
    >({
      query: ({ enrollmentId }) => ({
        url: `/exam-sessions/start/${enrollmentId}`,
        method: "POST",
      }),
      invalidatesTags: ["ExamSession"],
    }),

    submitAnswer: builder.mutation<
      { data: AnswerResult },
      { sessionId: string; body: Record<string, unknown> }
    >({
      query: ({ sessionId, body }) => ({
        url: `/exam-sessions/${sessionId}/submit`,
        method: "POST",
        body,
      }),
    }),

    reconnectSession: builder.query<
      { data: SessionStatus },
      { sessionId: string }
    >({
      query: ({ sessionId }) => `/exam-sessions/${sessionId}/reconnect`,
    }),

    getSessionStatus: builder.query<
      { data: SessionStatus },
      { sessionId: string }
    >({
      query: ({ sessionId }) => `/exam-sessions/${sessionId}/status`,
    }),

    reportViolation: builder.mutation<
      { data: ViolationResult },
      { sessionId: string; type: string; metadata?: Record<string, unknown> }
    >({
      query: ({ sessionId, ...body }) => ({
        url: `/exam-sessions/${sessionId}/violation`,
        method: "POST",
        body,
      }),
    }),

    finishSession: builder.mutation<
      { data: ExamSession },
      { sessionId: string }
    >({
      query: ({ sessionId }) => ({
        url: `/exam-sessions/${sessionId}/finish`,
        method: "POST",
      }),
      invalidatesTags: ["ExamSession"],
    }),

    // Proctor actions
    proctorUnlock: builder.mutation<
      { data: ExamSession },
      { sessionId: string }
    >({
      query: ({ sessionId }) => ({
        url: `/exam-sessions/${sessionId}/unlock`,
        method: "PATCH",
      }),
    }),

    extendTime: builder.mutation<
      { data: ExamSession },
      { sessionId: string; additionalMinutes: number }
    >({
      query: ({ sessionId, ...body }) => ({
        url: `/exam-sessions/${sessionId}/extend-time`,
        method: "PATCH",
        body,
      }),
    }),
  }),
});

export const {
  useStartSessionMutation,
  useSubmitAnswerMutation,
  useLazyReconnectSessionQuery,
  useLazyGetSessionStatusQuery,
  useReportViolationMutation,
  useFinishSessionMutation,
  useProctorUnlockMutation,
  useExtendTimeMutation,
} = sessionApi;
