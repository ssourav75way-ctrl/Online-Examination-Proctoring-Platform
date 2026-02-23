export interface TestCaseInput {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  timeoutMs: number;
}
