import { execSync } from "child_process";
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { codeExecConfig } from "../config";
import { CodeExecutionResult, TestCaseResult } from "../types/exam.types";

interface TestCaseInput {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  timeoutMs: number;
}


export class CodeExecutorService {
  private readonly tempDir: string;

  constructor() {
    this.tempDir = join(process.cwd(), "tmp", "code-exec");
    if (!existsSync(this.tempDir)) {
      mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async execute(
    code: string,
    language: string,
    testCases: TestCaseInput[],
  ): Promise<CodeExecutionResult> {
    const execId = uuidv4();
    const testResults: TestCaseResult[] = [];
    let compilationError: string | null = null;

    try {
      
      const { filePath, command } = this.prepareExecution(
        execId,
        code,
        language,
      );

      
      const compileResult = this.compileCode(filePath, language, execId);
      if (compileResult) {
        compilationError = compileResult;
        return {
          success: false,
          testResults: [],
          compilationError,
          totalPassed: 0,
          totalFailed: testCases.length,
          totalTests: testCases.length,
        };
      }

      
      for (const testCase of testCases) {
        const result = this.runTestCase(command, testCase, language);
        testResults.push(result);
      }

      const totalPassed = testResults.filter((r) => r.passed).length;

      return {
        success: compilationError === null,
        testResults,
        compilationError: null,
        totalPassed,
        totalFailed: testResults.length - totalPassed,
        totalTests: testResults.length,
      };
    } finally {
      
      this.cleanup(execId);
    }
  }

  
  getVisibleResults(results: CodeExecutionResult): CodeExecutionResult {
    return {
      ...results,
      testResults: results.testResults.map((r) => {
        if (r.isHidden) {
          return { ...r, actualOutput: "[hidden]", expectedOutput: "[hidden]" };
        }
        return r;
      }),
    };
  }

  private prepareExecution(
    execId: string,
    code: string,
    language: string,
  ): { filePath: string; command: string } {
    const extensions: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      cpp: "cpp",
      c: "c",
    };

    const ext = extensions[language] || "txt";
    const filePath = join(this.tempDir, `${execId}.${ext}`);
    writeFileSync(filePath, code);

    const commands: Record<string, string> = {
      javascript: `node ${filePath}`,
      typescript: `npx ts-node ${filePath}`,
      python: `python3 ${filePath}`,
      java: `java ${filePath}`,
      cpp: `${join(this.tempDir, execId)}`,
      c: `${join(this.tempDir, execId)}`,
    };

    return {
      filePath,
      command: commands[language] || `node ${filePath}`,
    };
  }

  private compileCode(
    filePath: string,
    language: string,
    execId: string,
  ): string | null {
    try {
      if (language === "cpp") {
        execSync(`g++ -o ${join(this.tempDir, execId)} ${filePath} 2>&1`, {
          timeout: codeExecConfig.timeoutMs,
        });
      } else if (language === "c") {
        execSync(`gcc -o ${join(this.tempDir, execId)} ${filePath} 2>&1`, {
          timeout: codeExecConfig.timeoutMs,
        });
      }
      return null;
    } catch (error) {
      if (error instanceof Error) {
        return error.message;
      }
      return "Compilation error";
    }
  }

  private runTestCase(
    command: string,
    testCase: TestCaseInput,
    language: string,
  ): TestCaseResult {
    const startTime = Date.now();

    
    const dangerousPatterns: Record<string, string[]> = {
      javascript: [
        "fs.",
        "child_process",
        "process.exit",
        "process.env",
        "eval(",
        "Function(",
        "require(",
      ],
      typescript: [
        "fs.",
        "child_process",
        "process.exit",
        "process.env",
        "eval(",
        "Function(",
        "require(",
      ],
      python: [
        "os.",
        "sys.",
        "subprocess",
        "open(",
        "eval(",
        "exec(",
        "socket",
      ],
      java: ["java.io.", "java.net.", "java.lang.Process", "System.exit"],
      cpp: ["fstream", "iostream", "socket", "system(", "fork(", "exec"],
      c: ["stdio.h", "stdlib.h", "unistd.h", "system(", "fork(", "exec"],
    };

    
    

    try {
      
      
      
      const output = execSync(command, {
        input: testCase.input,
        timeout: Math.min(testCase.timeoutMs, codeExecConfig.timeoutMs),
        maxBuffer: codeExecConfig.memoryLimitMb * 1024 * 1024,
        encoding: "utf-8",
        env: {
          NODE_ENV: "production",
          PATH: process.env.PATH, 
          
        },
        
      });

      const actualOutput = output.trim();
      const expectedOutput = testCase.expectedOutput.trim();
      const passed = actualOutput === expectedOutput;

      return {
        testCaseId: testCase.id,
        passed,
        actualOutput,
        expectedOutput: testCase.expectedOutput,
        isHidden: testCase.isHidden,
        executionTimeMs: Math.min(Date.now() - startTime, testCase.timeoutMs),
        error: null,
      };
    } catch (error: any) {
      let errorMessage = "Execution error";
      if (error.signal === "SIGTERM" || error.status === 124) {
        errorMessage = "Time Limit Exceeded";
      } else if (error.status === 139) {
        errorMessage = "Segmentation Fault";
      } else if (error.message.includes("stdout maxBuffer length exceeded")) {
        errorMessage = "Memory Limit Exceeded / Output Too Large";
      } else {
        errorMessage = error.stderr || error.message;
      }

      return {
        testCaseId: testCase.id,
        passed: false,
        actualOutput: "",
        expectedOutput: testCase.expectedOutput,
        isHidden: testCase.isHidden,
        executionTimeMs: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  private cleanup(execId: string): void {
    const extensions = ["js", "ts", "py", "java", "cpp", "c", ""];
    for (const ext of extensions) {
      const filePath = ext
        ? join(this.tempDir, `${execId}.${ext}`)
        : join(this.tempDir, execId);
      try {
        unlinkSync(filePath);
      } catch {
        
      }
    }
  }
}

export const codeExecutorService = new CodeExecutorService();
