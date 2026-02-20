import { apiSlice } from "./api";

interface GradedAnswer {
  id: string;
  autoScore: number | null;
  manualScore: number | null;
  finalScore: number | null;
  isGraded: boolean;
}

interface AutoGradeResult {
  totalGraded: number;
  answers: GradedAnswer[];
}

export const gradingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    autoGradeSession: builder.mutation<
      { data: AutoGradeResult },
      { sessionId: string }
    >({
      query: ({ sessionId }) => ({
        url: `/grading/sessions/${sessionId}/auto-grade`,
        method: "POST",
      }),
      invalidatesTags: ["Result"],
    }),

    overrideScore: builder.mutation<
      { data: GradedAnswer },
      { answerId: string; score: number }
    >({
      query: ({ answerId, ...body }) => ({
        url: `/grading/answers/${answerId}/override`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Result"],
    }),
  }),
});

export const { useAutoGradeSessionMutation, useOverrideScoreMutation } =
  gradingApi;
