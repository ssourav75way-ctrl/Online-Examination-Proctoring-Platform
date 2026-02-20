import { apiSlice } from "./api";
import { Exam, Enrollment } from "@/types/modules/exam.types";

interface ExamListParams {
  institutionId: string;
  page?: number;
  limit?: number;
  status?: string;
}

interface EnrollParams {
  institutionId: string;
  examId: string;
  candidateId: string;
  accommodationType?: string;
}

interface RescheduleParams {
  institutionId: string;
  examId: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
}

export const examApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getExamsByInstitution: builder.query<
      {
        data: Exam[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      },
      ExamListParams
    >({
      query: ({ institutionId, ...params }) => ({
        url: `/institutions/${institutionId}/exams`,
        params,
      }),
      providesTags: ["Exam"],
    }),

    getExamById: builder.query<
      { data: Exam },
      { institutionId: string; examId: string }
    >({
      query: ({ institutionId, examId }) =>
        `/institutions/${institutionId}/exams/${examId}`,
      providesTags: (_result, _error, { examId }) => [
        { type: "Exam", id: examId },
      ],
    }),

    createExam: builder.mutation<
      { data: Exam },
      { institutionId: string; body: Partial<Exam> }
    >({
      query: ({ institutionId, body }) => ({
        url: `/institutions/${institutionId}/exams`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Exam"],
    }),

    scheduleExam: builder.mutation<
      { data: Exam },
      { institutionId: string; examId: string }
    >({
      query: ({ institutionId, examId }) => ({
        url: `/institutions/${institutionId}/exams/${examId}/schedule`,
        method: "PATCH",
      }),
      invalidatesTags: ["Exam"],
    }),

    rescheduleExam: builder.mutation<
      { data: { exam: Exam; conflicts: unknown[] } },
      RescheduleParams
    >({
      query: ({ institutionId, examId, ...body }) => ({
        url: `/institutions/${institutionId}/exams/${examId}/reschedule`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Exam"],
    }),

    cancelExam: builder.mutation<
      { data: Exam },
      { institutionId: string; examId: string }
    >({
      query: ({ institutionId, examId }) => ({
        url: `/institutions/${institutionId}/exams/${examId}/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: ["Exam"],
    }),

    enrollCandidate: builder.mutation<{ data: Enrollment }, EnrollParams>({
      query: ({ institutionId, examId, ...body }) => ({
        url: `/institutions/${institutionId}/exams/${examId}/enroll`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Exam"],
    }),

    getEnrollments: builder.query<
      {
        data: Enrollment[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      },
      { institutionId: string; examId: string; page?: number; limit?: number }
    >({
      query: ({ institutionId, examId, ...params }) => ({
        url: `/institutions/${institutionId}/exams/${examId}/enrollments`,
        params,
      }),
      providesTags: ["Exam"],
    }),
    updateExam: builder.mutation<
      { data: Exam },
      { institutionId: string; examId: string; body: Partial<Exam> }
    >({
      query: ({ institutionId, examId, body }) => ({
        url: `/institutions/${institutionId}/exams/${examId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Exam"],
    }),

    getMyEnrollment: builder.query<
      { data: Enrollment | null },
      { institutionId: string; examId: string }
    >({
      query: ({ institutionId, examId }) =>
        `/institutions/${institutionId}/exams/${examId}/my-enrollment`,
    }),

    getExamQuestions: builder.query<
      { data: ExamQuestionItem[] },
      { institutionId: string; examId: string }
    >({
      query: ({ institutionId, examId }) =>
        `/institutions/${institutionId}/exams/${examId}/questions`,
      providesTags: ["ExamQuestion"],
    }),

    addQuestionsToExam: builder.mutation<
      { data: { added: number } },
      { institutionId: string; examId: string; questionIds: string[] }
    >({
      query: ({ institutionId, examId, questionIds }) => ({
        url: `/institutions/${institutionId}/exams/${examId}/questions`,
        method: "POST",
        body: { questionIds },
      }),
      invalidatesTags: ["ExamQuestion", "Exam"],
    }),

    removeExamQuestion: builder.mutation<
      void,
      { institutionId: string; examId: string; examQuestionId: string }
    >({
      query: ({ institutionId, examId, examQuestionId }) => ({
        url: `/institutions/${institutionId}/exams/${examId}/questions/${examQuestionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ExamQuestion", "Exam"],
    }),
  }),
});

export interface ExamQuestionItem {
  id: string;
  questionId: string;
  orderIndex: number;
  question: { id: string; topic: string; type: string };
  questionVersion: {
    id: string;
    content: string;
    difficulty: number;
    marks: number;
    versionNumber: number;
  };
}

export const {
  useGetExamsByInstitutionQuery,
  useGetExamByIdQuery,
  useCreateExamMutation,
  useScheduleExamMutation,
  useRescheduleExamMutation,
  useCancelExamMutation,
  useEnrollCandidateMutation,
  useGetEnrollmentsQuery,
  useUpdateExamMutation,
  useGetMyEnrollmentQuery,
  useGetExamQuestionsQuery,
  useAddQuestionsToExamMutation,
  useRemoveExamQuestionMutation,
} = examApi;
