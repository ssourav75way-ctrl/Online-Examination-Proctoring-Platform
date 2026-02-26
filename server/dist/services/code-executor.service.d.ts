import { CodeExecutionResult } from "../types/exam.types";
import { TestCaseInput } from "../types/modules/code-executor.types";
export declare class CodeExecutorService {
    private readonly tempDir;
    constructor();
    execute(code: string, language: string, testCases: TestCaseInput[]): Promise<CodeExecutionResult>;
    getVisibleResults(results: CodeExecutionResult): CodeExecutionResult;
    private prepareExecution;
    private compileCode;
    private runTestCase;
    private cleanup;
}
export declare const codeExecutorService: CodeExecutorService;
//# sourceMappingURL=code-executor.service.d.ts.map