import { apiSlice } from "./api";

export interface DistractorInfo {
  optionId: string;
  optionText: string;
  selectionCount: number;
  selectionPercentage: number;
}

export interface QuestionAnalytics {
  questionId: string;
  difficultyIndex: number;
  discriminationIndex: number;
  distractorAnalysis: DistractorInfo[];
  flaggedForReview: boolean;
  flagReason: string | null;
}

export interface CandidateIntegrityReport {
  candidateId: string;
  candidateName: string;
  integrityScore: number;
  proctorFlags: number;
  timingAnomalies: number;
  collusionScore: number;
  tabSwitches: number;
  evidenceIds: string[];
}

export const analyticsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getExamAnalytics: builder.query<
      { data: QuestionAnalytics[] },
      { examId: string }
    >({
      query: ({ examId }) => `/analytics/exams/${examId}`,
      providesTags: ["Analytics"],
    }),
    getIntegrityReport: builder.query<
      { data: CandidateIntegrityReport[] },
      { examId: string }
    >({
      query: ({ examId }) => `/analytics/exams/${examId}/integrity`,
      providesTags: ["Analytics"],
    }),
  }),
});

export const { useGetExamAnalyticsQuery, useGetIntegrityReportQuery } =
  analyticsApi;
