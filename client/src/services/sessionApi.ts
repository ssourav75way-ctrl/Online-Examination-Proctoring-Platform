import { apiSlice } from "./api";
import {
  ExamSession,
  QuestionItem,
  TimerState,
  CandidateAnswer,
} from "@/types/modules/exam.types";

interface SessionStatus {
  session: ExamSession;
  timerState: TimerState;
}

interface AnswerResult {
  answer: CandidateAnswer;
  nextQuestion: QuestionItem | null;
  timerState: TimerState;
  isLastQuestion: boolean;
}

interface ViolationResult {
  totalViolations: number;
  isLocked: boolean;
}

export const sessionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    startSession: builder.mutation<
      {
        data: {
          session: ExamSession;
          timerState: TimerState;
          currentQuestion: QuestionItem;
        };
      },
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
      invalidatesTags: ["ExamMarkers"],
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
    getQuestion: builder.query<
      { data: { question: QuestionItem; answer: CandidateAnswer | null } },
      { sessionId: string; index: number }
    >({
      query: ({ sessionId, index }) =>
        `/exam-sessions/${sessionId}/questions/${index}`,
    }),
    getMarkers: builder.query<
      { data: { id: string; index: number; isAnswered: boolean }[] },
      { sessionId: string }
    >({
      query: ({ sessionId }) => `/exam-sessions/${sessionId}/markers`,
      providesTags: ["ExamMarkers"],
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

    proctorUnlock: builder.mutation<
      {
        data: {
          unlocked: boolean;
          additionalTimePausedSeconds: number;
          message: string;
        };
      },
      { sessionId: string }
    >({
      query: ({ sessionId }) => ({
        url: `/exam-sessions/${sessionId}/unlock`,
        method: "PATCH",
      }),
    }),

    extendTime: builder.mutation<
      {
        data: {
          newDeadline: string;
          remainingSeconds: number;
        };
      },
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
  useLazyGetQuestionQuery,
  useGetMarkersQuery,
  useReportViolationMutation,
  useFinishSessionMutation,
  useProctorUnlockMutation,
  useExtendTimeMutation,
} = sessionApi;
