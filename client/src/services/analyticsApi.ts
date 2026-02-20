import { apiSlice } from "./api";

interface QuestionAnalyticsData {
  questionId: string;
  questionVersionId: string;
  content: string;
  topic: string;
  difficulty: number;
  totalAttempts: number;
  correctAttempts: number;
  difficultyIndex: number;
  discriminationIndex: number | null;
  isFlagged: boolean;
}

interface ExamAnalytics {
  examId: string;
  totalCandidates: number;
  averageScore: number;
  passRate: number;
  questions: QuestionAnalyticsData[];
}

interface DistractorAnalysis {
  questionId: string;
  options: Record<string, number>;
  totalResponses: number;
}

interface IntegrityReportEntry {
  candidateId: string;
  candidateName: string;
  integrityScore: number;
  timingAnomalyCount: number;
  collusionScore: number | null;
  proctorFlagCount: number;
  tabSwitchCount: number;
}

export const analyticsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getExamAnalytics: builder.query<
      { data: ExamAnalytics },
      { examId: string }
    >({
      query: ({ examId }) => `/analytics/exams/${examId}`,
      providesTags: ["Analytics"],
    }),

    getIntegrityReport: builder.query<
      { data: IntegrityReportEntry[] },
      { examId: string }
    >({
      query: ({ examId }) => `/analytics/exams/${examId}/integrity`,
      providesTags: ["Analytics"],
    }),

    getQuestionDifficulty: builder.query<
      { data: { difficultyIndex: number } },
      { examQuestionId: string }
    >({
      query: ({ examQuestionId }) =>
        `/analytics/questions/${examQuestionId}/difficulty`,
    }),

    getDistractorAnalysis: builder.query<
      { data: DistractorAnalysis },
      { examQuestionId: string }
    >({
      query: ({ examQuestionId }) =>
        `/analytics/questions/${examQuestionId}/distractors`,
    }),
  }),
});

export const {
  useGetExamAnalyticsQuery,
  useGetIntegrityReportQuery,
  useGetQuestionDifficultyQuery,
  useGetDistractorAnalysisQuery,
} = analyticsApi;
