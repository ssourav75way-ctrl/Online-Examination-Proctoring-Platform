import { apiSlice } from "./api";
import { Exam } from "@/types/exam";

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

interface Enrollment {
  id: string;
  examId: string;
  candidateId: string;
  attemptNumber: number;
  status: string;
  accommodationType: string;
  adjustedDurationMinutes: number | null;
  enrolledAt: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
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
  }),
});

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
} = examApi;
