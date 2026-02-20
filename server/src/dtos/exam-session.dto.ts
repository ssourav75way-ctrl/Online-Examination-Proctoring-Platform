import { ViolationType } from "@prisma/client";



export interface StartSessionRequestDTO {
  enrollmentId: string;
}

export interface SubmitAnswerRequestDTO {
  examQuestionId: string;
  answerContent?: string;
  codeSubmission?: string;
}

export interface ReportViolationRequestDTO {
  type: ViolationType;
  metadata?: Record<string, unknown>;
}

export interface ExtendTimeRequestDTO {
  additionalMinutes: number;
}



export interface SessionResponseDTO {
  id: string;
  enrollmentId: string;
  startedAt: Date;
  serverDeadline: Date;
  remainingSeconds: number;
  currentQuestionIndex: number;
  questionsAnswered: number;
  isLocked: boolean;
  questions: SessionQuestionDTO[];
}

export interface SessionQuestionDTO {
  id: string;
  orderIndex: number;
  question: {
    id: string;
    type: string;
    topic: string;
  };
  questionVersion: {
    id: string;
    content: string;
    marks: number;
    options: string | null;
    codeTemplate: string | null;
    codeLanguage: string | null;
  };
}

export interface SessionStatusDTO {
  id: string;
  startedAt: Date;
  serverDeadline: Date;
  remainingSeconds: number;
  currentQuestionIndex: number;
  questionsAnswered: number;
  tabSwitchCount: number;
  isLocked: boolean;
  lockedAt: Date | null;
  lockReason: string | null;
  finishedAt: Date | null;
}

export interface AnswerResponseDTO {
  id: string;
  examQuestionId: string;
  answerContent: string | null;
  codeSubmission: string | null;
  answeredAt: Date;
  timeTakenSeconds: number;
  autoScore: number | null;
}

export interface ViolationResponseDTO {
  id: string;
  type: ViolationType;
  occurredAt: Date;
  lockTriggered: boolean;
}
