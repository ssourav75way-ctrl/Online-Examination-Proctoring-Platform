export interface GradingResult {
  score: number;
  maxScore: number;
  isPartialCredit: boolean;
  details: string;
}

export interface MultiSelectScoringInput {
  selectedOptionIds: string[];
  correctOptionIds: string[];
  totalCorrect: number;
  marks: number;
}

export interface ShortAnswerScoringInput {
  answer: string;
  keywords: { keyword: string; weight: number }[];
  similarityThreshold: number;
  marks: number;
}

export interface IntegrityScoreFactors {
  proctorFlagCount: number;
  proctorFlagSeveritySum: number;
  timingAnomalyCount: number;
  collusionScore: number;
  tabSwitchCount: number;
}

export interface QuestionAnalytics {
  questionId: string;
  difficultyIndex: number;
  discriminationIndex: number;
  distractorAnalysis: DistractorInfo[];
  flaggedForReview: boolean;
  flagReason: string | null;
}

export interface DistractorInfo {
  optionId: string;
  optionText: string;
  selectionCount: number;
  selectionPercentage: number;
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
