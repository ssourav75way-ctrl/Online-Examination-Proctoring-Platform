import { TimerState } from "../types/modules/timer.types";
export declare class TimerService {
    getTimerState(serverDeadline: Date, totalPausedSeconds: number, pausedAt: Date | null): TimerState;
    calculateDeadline(startTime: Date, durationMinutes: number): Date;
    pauseTimer(serverDeadline: Date, totalPausedSeconds: number): {
        pausedAt: Date;
        remainingAtPause: number;
    };
    resumeTimer(pausedAt: Date, totalPausedSeconds: number): {
        newTotalPausedSeconds: number;
    };
    calculateProctorAutoAdjustment(lockedAt: Date, proctorResponseTime: Date, maxResponseMinutes: number): number;
}
export declare const timerService: TimerService;
//# sourceMappingURL=timer.service.d.ts.map