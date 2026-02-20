

export interface CreateDepartmentRequestDTO {
  name: string;
  code: string;
}

export interface UpdateDepartmentRequestDTO {
  name?: string;
  code?: string;
}



export interface DepartmentListItemDTO {
  id: string;
  name: string;
  code: string;
  institutionId: string;
  createdAt: Date;
  updatedAt: Date;
  questionPools: { id: string; name: string; isShared: boolean }[];
  _count: { questionPools: number };
}

export interface DepartmentDetailDTO {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
  institution: { id: string; name: string };
  questionPools: QuestionPoolSummaryDTO[];
}

export interface QuestionPoolSummaryDTO {
  id: string;
  name: string;
  description: string | null;
  isShared: boolean;
  departmentId: string;
  createdAt: Date;
  updatedAt: Date;
}
