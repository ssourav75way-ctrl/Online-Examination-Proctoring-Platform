import { apiSlice } from "./api";
import { Question, QuestionVersion } from "@/types/exam";

export interface QuestionPool {
  id: string;
  departmentId: string;
  name: string;
  description: string | null;
  isShared: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { questions: number };
}

interface PoolListParams {
  institutionId: string;
  page?: number;
  limit?: number;
  departmentId?: string;
}

interface QuestionListParams {
  institutionId: string;
  poolId: string;
  page?: number;
  limit?: number;
  topic?: string;
  type?: string;
  difficulty?: number;
}

interface CreateQuestionBody {
  poolId: string;
  type: string;
  topic: string;
  content: string;
  difficulty: number;
  marks: number;
  negativeMarks?: number;
  options?: unknown;
  correctAnswer?: string;
  keywords?: unknown;
  similarityThreshold?: number;
  codeTemplate?: string;
  codeLanguage?: string;
}

export const questionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getQuestionPools: builder.query<
      {
        data: QuestionPool[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      },
      PoolListParams
    >({
      query: ({ institutionId, ...params }) => ({
        url: `/institutions/${institutionId}/question-pools`,
        params,
      }),
      providesTags: ["QuestionPool"],
    }),

    getQuestionPoolById: builder.query<
      { data: QuestionPool },
      { institutionId: string; poolId: string }
    >({
      query: ({ institutionId, poolId }) =>
        `/institutions/${institutionId}/question-pools/${poolId}`,
      providesTags: (_r, _e, { poolId }) => [
        { type: "QuestionPool", id: poolId },
      ],
    }),

    createQuestionPool: builder.mutation<
      { data: QuestionPool },
      {
        institutionId: string;
        body: {
          name: string;
          description?: string;
          departmentId: string;
          isShared?: boolean;
        };
      }
    >({
      query: ({ institutionId, body }) => ({
        url: `/institutions/${institutionId}/question-pools`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["QuestionPool"],
    }),

    updateQuestionPool: builder.mutation<
      { data: QuestionPool },
      { institutionId: string; poolId: string; body: Partial<QuestionPool> }
    >({
      query: ({ institutionId, poolId, body }) => ({
        url: `/institutions/${institutionId}/question-pools/${poolId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["QuestionPool"],
    }),

    deleteQuestionPool: builder.mutation<
      void,
      { institutionId: string; poolId: string }
    >({
      query: ({ institutionId, poolId }) => ({
        url: `/institutions/${institutionId}/question-pools/${poolId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["QuestionPool"],
    }),

    getQuestionsByPool: builder.query<
      {
        data: Question[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      },
      QuestionListParams
    >({
      query: ({ institutionId, poolId, ...params }) => ({
        url: `/institutions/${institutionId}/questions/pool/${poolId}`,
        params,
      }),
      providesTags: ["Question"],
    }),

    getQuestionById: builder.query<
      { data: Question },
      { institutionId: string; questionId: string }
    >({
      query: ({ institutionId, questionId }) =>
        `/institutions/${institutionId}/questions/${questionId}`,
      providesTags: (_r, _e, { questionId }) => [
        { type: "Question", id: questionId },
      ],
    }),

    createQuestion: builder.mutation<
      { data: Question },
      { institutionId: string; body: CreateQuestionBody }
    >({
      query: ({ institutionId, body }) => ({
        url: `/institutions/${institutionId}/questions`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Question"],
    }),

    updateQuestion: builder.mutation<
      { data: Question },
      {
        institutionId: string;
        questionId: string;
        body: Partial<CreateQuestionBody>;
      }
    >({
      query: ({ institutionId, questionId, body }) => ({
        url: `/institutions/${institutionId}/questions/${questionId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Question"],
    }),

    deactivateQuestion: builder.mutation<
      { data: null },
      { institutionId: string; questionId: string }
    >({
      query: ({ institutionId, questionId }) => ({
        url: `/institutions/${institutionId}/questions/${questionId}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["Question"],
    }),

    getQuestionVersions: builder.query<
      { data: QuestionVersion[] },
      { institutionId: string; questionId: string }
    >({
      query: ({ institutionId, questionId }) =>
        `/institutions/${institutionId}/questions/${questionId}/versions`,
      providesTags: (_r, _e, { questionId }) => [
        { type: "Question", id: questionId },
      ],
    }),

    rollbackQuestion: builder.mutation<
      { data: Question },
      { institutionId: string; questionId: string; versionId: string }
    >({
      query: ({ institutionId, questionId, versionId }) => ({
        url: `/institutions/${institutionId}/questions/${questionId}/rollback/${versionId}`,
        method: "POST",
      }),
      invalidatesTags: ["Question"],
    }),
  }),
});

export const {
  useGetQuestionPoolsQuery,
  useGetQuestionPoolByIdQuery,
  useCreateQuestionPoolMutation,
  useUpdateQuestionPoolMutation,
  useDeleteQuestionPoolMutation,
  useGetQuestionsByPoolQuery,
  useGetQuestionByIdQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeactivateQuestionMutation,
  useGetQuestionVersionsQuery,
  useRollbackQuestionMutation,
} = questionApi;
