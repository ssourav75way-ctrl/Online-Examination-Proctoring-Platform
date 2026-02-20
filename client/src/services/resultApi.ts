import { apiSlice } from "./api";

interface ExamResult {
  id: string;
  enrollmentId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  integrityScore: number | null;
  timingAnomalyCount: number;
  collusionScore: number | null;
  status: "PENDING_REVIEW" | "PUBLISHED";
  publishedAt: string | null;
  createdAt: string;
  enrollment?: {
    candidate: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    attemptNumber: number;
  };
}

interface ReEvaluationRequest {
  id: string;
  resultId: string;
  candidateAnswerId: string;
  justification: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedById: string | null;
  reviewNotes: string | null;
  previousScore: number | null;
  newScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export const resultApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Examiner: generate results for an exam
    generateResults: builder.mutation<
      { data: ExamResult[] },
      { examId: string }
    >({
      query: ({ examId }) => ({
        url: `/results/exams/${examId}/generate`,
        method: "POST",
      }),
      invalidatesTags: ["Result"],
    }),

    // Examiner: publish results
    publishResults: builder.mutation<{ data: null }, { examId: string }>({
      query: ({ examId }) => ({
        url: `/results/exams/${examId}/publish`,
        method: "PATCH",
      }),
      invalidatesTags: ["Result"],
    }),

    // Examiner: get all results for an exam
    getExamResults: builder.query<
      {
        data: ExamResult[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      },
      { examId: string; page?: number; limit?: number }
    >({
      query: ({ examId, ...params }) => ({
        url: `/results/exams/${examId}`,
        params,
      }),
      providesTags: ["Result"],
    }),

    // Candidate: get own result
    getCandidateResult: builder.query<
      { data: ExamResult },
      { enrollmentId: string }
    >({
      query: ({ enrollmentId }) => `/results/enrollments/${enrollmentId}`,
      providesTags: ["Result"],
    }),

    // Candidate: get all own results
    getMyResults: builder.query<{ data: ExamResult[] }, void>({
      query: () => "/results/my-results",
      providesTags: ["Result"],
    }),

    // Candidate: file re-evaluation
    fileReEvaluation: builder.mutation<
      { data: ReEvaluationRequest },
      { resultId: string; candidateAnswerId: string; justification: string }
    >({
      query: ({ resultId, ...body }) => ({
        url: `/results/${resultId}/re-evaluate`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Result"],
    }),

    // Examiner: get re-evaluation requests for an exam
    getReEvaluationRequests: builder.query<
      {
        data: ReEvaluationRequest[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      },
      { examId: string; page?: number; limit?: number }
    >({
      query: ({ examId, ...params }) => ({
        url: `/results/exams/${examId}/re-evaluations`,
        params,
      }),
      providesTags: ["Result"],
    }),

    // Examiner: process re-evaluation
    processReEvaluation: builder.mutation<
      { data: ReEvaluationRequest },
      {
        requestId: string;
        status: "APPROVED" | "REJECTED";
        newScore?: number;
        reviewNotes?: string;
      }
    >({
      query: ({ requestId, ...body }) => ({
        url: `/results/re-evaluations/${requestId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Result"],
    }),
  }),
});

export const {
  useGenerateResultsMutation,
  usePublishResultsMutation,
  useGetExamResultsQuery,
  useGetCandidateResultQuery,
  useGetMyResultsQuery,
  useFileReEvaluationMutation,
  useGetReEvaluationRequestsQuery,
  useProcessReEvaluationMutation,
} = resultApi;
