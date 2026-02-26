"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timerService = exports.TimerService = void 0;
const date_util_1 = require("../utils/date.util");
class TimerService {
    getTimerState(serverDeadline, totalPausedSeconds, pausedAt) {
        const isPaused = pausedAt !== null;
        let remainingSeconds;
        if (isPaused) {
            remainingSeconds = (0, date_util_1.calculateRemainingSeconds)(serverDeadline, totalPausedSeconds, pausedAt);
        }
        else {
            remainingSeconds = (0, date_util_1.calculateRemainingSeconds)(serverDeadline, totalPausedSeconds);
        }
        return {
            remainingSeconds,
            serverDeadline,
            totalPausedSeconds,
            isPaused,
            isExpired: remainingSeconds <= 0,
        };
    }
    calculateDeadline(startTime, durationMinutes) {
        const deadline = new Date(startTime);
        deadline.setMinutes(deadline.getMinutes() + durationMinutes);
        return deadline;
    }
    pauseTimer(serverDeadline, totalPausedSeconds) {
        const now = new Date();
        const remaining = (0, date_util_1.calculateRemainingSeconds)(serverDeadline, totalPausedSeconds, now);
        return { pausedAt: now, remainingAtPause: remaining };
    }
    resumeTimer(pausedAt, totalPausedSeconds) {
        const now = new Date();
        const pausedDuration = Math.floor((now.getTime() - pausedAt.getTime()) / 1000);
        return { newTotalPausedSeconds: totalPausedSeconds + pausedDuration };
    }
    calculateProctorAutoAdjustment(lockedAt, proctorResponseTime, maxResponseMinutes) {
        const responseTimeSeconds = Math.floor((proctorResponseTime.getTime() - lockedAt.getTime()) / 1000);
        const maxResponseSeconds = maxResponseMinutes * 60;
        if (responseTimeSeconds > maxResponseSeconds) {
            return responseTimeSeconds - maxResponseSeconds;
        }
        return 0;
    }
}
exports.TimerService = TimerService;
exports.timerService = new TimerService();
//# sourceMappingURL=timer.service.js.map