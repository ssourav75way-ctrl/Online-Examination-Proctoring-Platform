"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeExecutorService = exports.CodeExecutorService = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const uuid_1 = require("uuid");
const config_1 = require("../config");
class CodeExecutorService {
    constructor() {
        this.tempDir = (0, path_1.join)(process.cwd(), "tmp", "code-exec");
        if (!(0, fs_1.existsSync)(this.tempDir)) {
            (0, fs_1.mkdirSync)(this.tempDir, { recursive: true });
        }
    }
    async execute(code, language, testCases) {
        const execId = (0, uuid_1.v4)();
        const testResults = [];
        let compilationError = null;
        try {
            const { filePath, command } = this.prepareExecution(execId, code, language);
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
        }
        finally {
            this.cleanup(execId);
        }
    }
    getVisibleResults(results) {
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
    prepareExecution(execId, code, language) {
        const extensions = {
            javascript: "js",
            typescript: "ts",
            python: "py",
            java: "java",
            cpp: "cpp",
            c: "c",
        };
        const ext = extensions[language] || "txt";
        const filePath = (0, path_1.join)(this.tempDir, `${execId}.${ext}`);
        (0, fs_1.writeFileSync)(filePath, code);
        const commands = {
            javascript: `node ${filePath}`,
            typescript: `npx ts-node ${filePath}`,
            python: `python3 ${filePath}`,
            java: `java ${filePath}`,
            cpp: `${(0, path_1.join)(this.tempDir, execId)}`,
            c: `${(0, path_1.join)(this.tempDir, execId)}`,
        };
        return {
            filePath,
            command: commands[language] || `node ${filePath}`,
        };
    }
    compileCode(filePath, language, execId) {
        try {
            if (language === "cpp") {
                (0, child_process_1.execSync)(`g++ -o ${(0, path_1.join)(this.tempDir, execId)} ${filePath} 2>&1`, {
                    timeout: config_1.codeExecConfig.timeoutMs,
                });
            }
            else if (language === "c") {
                (0, child_process_1.execSync)(`gcc -o ${(0, path_1.join)(this.tempDir, execId)} ${filePath} 2>&1`, {
                    timeout: config_1.codeExecConfig.timeoutMs,
                });
            }
            return null;
        }
        catch (error) {
            if (error instanceof Error) {
                return error.message;
            }
            return "Compilation error";
        }
    }
    runTestCase(command, testCase, language) {
        const startTime = Date.now();
        const dangerousPatterns = {
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
            const output = (0, child_process_1.execSync)(command, {
                input: testCase.input,
                timeout: Math.min(testCase.timeoutMs, config_1.codeExecConfig.timeoutMs),
                maxBuffer: config_1.codeExecConfig.memoryLimitMb * 1024 * 1024,
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
        }
        catch (e) {
            const error = e;
            let errorMessage = "Execution error";
            if (error.signal === "SIGTERM" || error.status === 124) {
                errorMessage = "Time Limit Exceeded";
            }
            else if (error.status === 139) {
                errorMessage = "Segmentation Fault";
            }
            else if (error.message.includes("stdout maxBuffer length exceeded")) {
                errorMessage = "Memory Limit Exceeded / Output Too Large";
            }
            else {
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
    cleanup(execId) {
        const extensions = ["js", "ts", "py", "java", "cpp", "c", ""];
        for (const ext of extensions) {
            const filePath = ext
                ? (0, path_1.join)(this.tempDir, `${execId}.${ext}`)
                : (0, path_1.join)(this.tempDir, execId);
            try {
                (0, fs_1.unlinkSync)(filePath);
            }
            catch { }
        }
    }
}
exports.CodeExecutorService = CodeExecutorService;
exports.codeExecutorService = new CodeExecutorService();
//# sourceMappingURL=code-executor.service.js.map