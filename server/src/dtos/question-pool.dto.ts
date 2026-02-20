/* ─── Request DTOs ─── */

export interface CreateQuestionPoolRequestDTO {
  departmentId: string;
  name: string;
  description?: string;
  isShared?: boolean;
}

export interface UpdateQuestionPoolRequestDTO {
  name?: string;
  description?: string;
  isShared?: boolean;
}

/* ─── Response DTOs ─── */

export interface QuestionPoolItemDTO {
  id: string;
  name: string;
  description: string | null;
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
  department: { id: string; name: string };
  _count: { questions: number };
}

export interface QuestionPoolDetailDTO extends QuestionPoolItemDTO {
  department: { id: string; name: string; institutionId: string };
}

export interface QuestionPoolListResponseDTO {
  pools: QuestionPoolItemDTO[];
  total: number;
}
