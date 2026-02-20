export type QuestionType =
  | "MCQ"
  | "MULTI_SELECT"
  | "FILL_BLANK"
  | "SHORT_ANSWER"
  | "CODE";

export interface McqOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface Exam {
  id: string;
  institutionId: string;
  title: string;
  description: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  durationMinutes: number;
  status: "DRAFT" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  isAdaptive: boolean;
  maxAttempts: number;
  cooldownHours: number;
  totalMarks: number;
  passingScore: number;
  createdAt: string;
}

export interface ExamSession {
  id: string;
  enrollmentId: string;
  startedAt: string;
  finishedAt: string | null;
  serverDeadline: string;
  currentQuestionIndex: number;
  tabSwitchCount: number;
  isLocked: boolean;
  lockReason: string | null;
}

export interface Enrollment {
  id: string;
  examId: string;
  candidateId: string;
  attemptNumber: number;
  status: "ENROLLED" | "IN_PROGRESS" | "COMPLETED" | "LOCKED" | "ABANDONED";
  accommodationType: "NONE" | "TIME_1_5X" | "TIME_2X";
  adjustedDurationMinutes: number | null;
  enrolledAt: string;
  candidate?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  exam?: Exam;
  session?: ExamSession | null;
}

export interface QuestionItem {
  examQuestionId: string;
  questionVersionId: string;
  type: QuestionType;
  content: string;
  options: McqOption[] | null;
  codeTemplate: string | null;
  codeLanguage: string | null;
  marks: number;
  orderIndex: number;
  screenReaderHint?: string;
}
export interface TimerState {
  remainingSeconds: number;
  isExpired: boolean;
  isPaused: boolean;
  serverDeadline: string;
  totalPausedSeconds: number;
}

export interface CandidateAnswer {
  id: string;
  sessionId: string;
  examQuestionId: string;
  answerContent?: string;
  codeSubmission?: string;
  timeTakenSeconds: number;
  answeredAt: string;
}
