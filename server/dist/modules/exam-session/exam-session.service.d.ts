import { QuestionDeliveryItem } from "../../types/exam.types";
import { SubmitAnswerInput } from "../../types/modules/exam-session.types";
export declare class ExamSessionService {
    startSession(enrollmentId: string, ipAddress: string, userAgent: string): Promise<{
        session: {
            id: string;
            enrollmentId: string;
            startedAt: Date;
            serverDeadline: Date;
            pausedAt: Date | null;
            totalPausedSeconds: number;
            currentQuestionIndex: number;
            runningAccuracy: number;
            questionsAnswered: number;
            correctAnswers: number;
            tabSwitchCount: number;
            isLocked: boolean;
            lockedAt: Date | null;
            lockReason: string | null;
            proctorUnlockedAt: Date | null;
            finishedAt: Date | null;
            ipAddress: string | null;
            userAgent: string | null;
            autoPauseAdjustmentMs: number | null;
            autoPauseTriggered: boolean;
        };
        timerState: import("../../types/modules/timer.types").TimerState;
        currentQuestion: QuestionDeliveryItem | null;
    }>;
    submitAnswer(sessionId: string, input: SubmitAnswerInput): Promise<{
        answer: {
            id: string;
            sessionId: string;
            examQuestionId: string;
            answerContent: string | null;
            codeSubmission: string | null;
            answeredAt: Date;
            timeTakenSeconds: number;
            autoScore: number | null;
            manualScore: number | null;
            finalScore: number | null;
            isGraded: boolean;
            gradedById: string | null;
        };
        nextQuestion: QuestionDeliveryItem | null;
        timerState: import("../../types/modules/timer.types").TimerState;
        isLastQuestion: boolean;
    }>;
    reconnect(sessionId: string): Promise<{
        session: {
            id: string;
            isLocked: boolean;
            lockReason: string | null;
        };
        timerState: import("../../types/modules/timer.types").TimerState;
        currentQuestion: QuestionDeliveryItem | null;
        questionsAnswered: number;
    }>;
    reportViolation(sessionId: string, type: "TAB_SWITCH" | "FOCUS_LOSS" | "BROWSER_RESIZE", metadata?: Record<string, unknown>): Promise<{
        locked: boolean;
        tabSwitchCount: number;
        remaining?: undefined;
    } | {
        locked: boolean;
        tabSwitchCount: number;
        remaining: number;
    } | {
        locked: boolean;
        tabSwitchCount?: undefined;
        remaining?: undefined;
    } | undefined>;
    proctorUnlock(sessionId: string): Promise<{
        unlocked: boolean;
        additionalTimePausedSeconds: number;
        message: string;
    }>;
    extendTime(sessionId: string, additionalMinutes: number): Promise<{
        newDeadline: Date;
        remainingSeconds: number;
    }>;
    finishSession(sessionId: string): Promise<{
        id: string;
        enrollmentId: string;
        startedAt: Date;
        serverDeadline: Date;
        pausedAt: Date | null;
        totalPausedSeconds: number;
        currentQuestionIndex: number;
        runningAccuracy: number;
        questionsAnswered: number;
        correctAnswers: number;
        tabSwitchCount: number;
        isLocked: boolean;
        lockedAt: Date | null;
        lockReason: string | null;
        proctorUnlockedAt: Date | null;
        finishedAt: Date | null;
        ipAddress: string | null;
        userAgent: string | null;
        autoPauseAdjustmentMs: number | null;
        autoPauseTriggered: boolean;
    }>;
    getSessionStatus(sessionId: string): Promise<{
        session: {
            _count: {
                answers: number;
                flags: number;
                violations: number;
            };
            enrollment: {
                exam: {
                    title: string;
                    isAdaptive: boolean;
                    totalMarks: number;
                };
                candidate: {
                    id: string;
                    firstName: string;
                    lastName: string;
                };
            } & {
                id: string;
                accommodationId: string | null;
                candidateId: string;
                examId: string;
                attemptNumber: number;
                status: import(".prisma/client").$Enums.EnrollmentStatus;
                accommodationType: import(".prisma/client").$Enums.AccommodationType;
                adjustedDurationMinutes: number | null;
                enrolledAt: Date;
                effectiveEndTime: Date | null;
                effectiveStartTime: Date | null;
            };
        } & {
            id: string;
            enrollmentId: string;
            startedAt: Date;
            serverDeadline: Date;
            pausedAt: Date | null;
            totalPausedSeconds: number;
            currentQuestionIndex: number;
            runningAccuracy: number;
            questionsAnswered: number;
            correctAnswers: number;
            tabSwitchCount: number;
            isLocked: boolean;
            lockedAt: Date | null;
            lockReason: string | null;
            proctorUnlockedAt: Date | null;
            finishedAt: Date | null;
            ipAddress: string | null;
            userAgent: string | null;
            autoPauseAdjustmentMs: number | null;
            autoPauseTriggered: boolean;
        };
        timerState: import("../../types/modules/timer.types").TimerState;
    }>;
    getQuestionByIndex(sessionId: string, index: number): Promise<{
        question: QuestionDeliveryItem;
        answer: {
            answerContent: string | null;
            codeSubmission: string | null;
        } | null;
    }>;
    getSessionQuestionMarkers(sessionId: string): Promise<{
        id: string;
        index: number;
        isAnswered: boolean;
    }[]>;
    private getInitialAdaptiveState;
}
export declare const examSessionService: ExamSessionService;
//# sourceMappingURL=exam-session.service.d.ts.map