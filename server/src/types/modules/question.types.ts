import { QuestionType } from "@prisma/client";
import { McqOption, KeywordConfig } from "../exam.types";

export interface CreateQuestionInput {
  poolId: string;
  type: QuestionType;
  topic: string;
  content: string;
  difficulty: number;
  marks: number;
  negativeMarks?: number;
  options?: McqOption[];
  correctAnswer?: string;
  keywords?: KeywordConfig[];
  similarityThreshold?: number;
  codeTemplate?: string;
  codeLanguage?: string;
  testCases?: {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    timeoutMs?: number;
  }[];
}

export interface UpdateQuestionInput {
  content?: string;
  difficulty?: number;
  marks?: number;
  negativeMarks?: number;
  options?: McqOption[];
  correctAnswer?: string;
  keywords?: KeywordConfig[];
  similarityThreshold?: number;
  codeTemplate?: string;
  codeLanguage?: string;
  testCases?: {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    timeoutMs?: number;
  }[];
}
