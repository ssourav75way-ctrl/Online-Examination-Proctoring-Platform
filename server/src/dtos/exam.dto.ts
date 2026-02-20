import {
  ExamStatus,
  AccommodationType,
  EnrollmentStatus,
  ResultStatus,
} from "@prisma/client";



export interface CreateExamRequestDTO {
  institutionId: string;
  title: string;
  description?: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  durationMinutes: number;
  isAdaptive?: boolean;
  maxAttempts?: number;
  cooldownHours?: number;
  challengeWindowDays?: number;
  totalMarks: number;
  passingScore: number;
  questionSelections: QuestionSelectionDTO[];
}

export interface QuestionSelectionDTO {
  poolId: string;
  questionIds: string[];
  quota?: number;
}

export interface EnrollCandidateRequestDTO {
  candidateId: string;
  accommodationType?: AccommodationType;
}

export interface RescheduleExamRequestDTO {
  newStartTime: string;
  newEndTime: string;
}



export interface ExamListItemDTO {
  id: string;
  title: string;
  description: string | null;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  durationMinutes: number;
  status: ExamStatus;
  totalMarks: number;
  passingScore: number;
  resultStatus: ResultStatus;
  createdAt: Date;
  institution: { id: string; name: string };
  _count: { questions: number; enrollments: number };
}

export interface ExamDetailDTO {
  id: string;
  institutionId: string;
  title: string;
  description: string | null;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  durationMinutes: number;
  status: ExamStatus;
  isAdaptive: boolean;
  maxAttempts: number;
  cooldownHours: number;
  challengeWindowDays: number;
  totalMarks: number;
  passingScore: number;
  resultStatus: ResultStatus;
  createdAt: Date;
  createdBy: { id: string; firstName: string; lastName: string };
  questions: ExamQuestionDTO[];
  _count: { enrollments: number };
}

export interface ExamQuestionDTO {
  id: string;
  orderIndex: number;
  poolId: string;
  poolQuota: number | null;
  question: {
    id: string;
    topic: string;
    type: string;
  };
  questionVersion: {
    id: string;
    content: string;
    difficulty: number;
    marks: number;
  };
}

export interface ExamListResponseDTO {
  exams: ExamListItemDTO[];
  total: number;
}

export interface EnrollmentListItemDTO {
  id: string;
  attemptNumber: number;
  status: EnrollmentStatus;
  accommodationType: AccommodationType;
  adjustedDurationMinutes: number | null;
  enrolledAt: Date;
  candidate: { id: string; email: string; firstName: string; lastName: string };
  session: { id: string; startedAt: Date; finishedAt: Date | null } | null;
}

export interface EnrollmentListResponseDTO {
  enrollments: EnrollmentListItemDTO[];
  total: number;
}

export interface ConflictDTO {
  candidateId: string;
  candidateName: string;
  conflictingExamTitle: string;
  conflictingInstitution: string;
}

export interface RescheduleResponseDTO {
  exam: ExamDetailDTO;
  conflicts: ConflictDTO[];
}
