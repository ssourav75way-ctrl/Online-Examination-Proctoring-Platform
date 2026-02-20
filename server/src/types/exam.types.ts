import { QuestionType } from "@prisma/client";

export interface McqOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface KeywordConfig {
  keyword: string;
  weight: number;
}

export interface TestCaseResult {
  testCaseId: string;
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  isHidden: boolean;
  executionTimeMs: number;
  error: string | null;
}

export interface CodeExecutionResult {
  success: boolean;
  testResults: TestCaseResult[];
  compilationError: string | null;
  totalPassed: number;
  totalFailed: number;
  totalTests: number;
}

export interface AdaptiveState {
  currentDifficulty: number;
  topicAccuracyMap: Record<string, { correct: number; total: number }>;
  totalDifficulty: number;
  questionsServed: number;
  runningAccuracy: number;
}

export interface QuestionDeliveryItem {
  examQuestionId: string;
  questionVersionId: string;
  type: QuestionType;
  content: string;
  options: McqOption[] | null;
  codeTemplate: string | null;
  codeLanguage: string | null;
  marks: number;
  orderIndex: number;
  screenReaderHint: string;
}
