/** Question Formats supported by the system */
export type QuestionType =
  | "MCQ"
  | "MULTI_SELECT"
  | "FILL_BLANK"
  | "SHORT_ANSWER"
  | "CODE";

export interface McqOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionVersion {
  id: string;
  questionId: string;
  versionNumber: number;
  content: string;
  type: QuestionType;
  difficulty: number;
  marks: number;
  options: McqOption[] | null;
  correctAnswer: string | null;
  codeTemplate: string | null;
  codeLanguage: string | null;
  createdAt: string;
}

export interface Question {
  id: string;
  poolId: string;
  topic: string;
  type: QuestionType;
  isActive: boolean;
  latestVersion: QuestionVersion;
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
  startTime: string;
  actualEndTime: string | null;
  tabSwitchCount: number;
  isLocked: boolean;
  lockReason: string | null;
  totalPausedSeconds: number;
}
