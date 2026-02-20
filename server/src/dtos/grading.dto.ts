

export interface OverrideScoreRequestDTO {
  answerId: string;
  manualScore: number;
}



export interface GradingResultDTO {
  answerId: string;
  autoScore: number;
  maxScore: number;
  isCorrect: boolean;
}

export interface SessionGradingResponseDTO {
  sessionId: string;
  totalAutoScore: number;
  gradedCount: number;
  results: GradingResultDTO[];
}

export interface ScoreOverrideResponseDTO {
  id: string;
  examQuestionId: string;
  autoScore: number | null;
  manualScore: number;
  finalScore: number;
  isGraded: boolean;
  gradedById: string;
}
