import { calculateRemainingSeconds } from "../utils/date.util";

import { TimerState } from "../types/modules/timer.types";
export class TimerService {
  getTimerState(
    serverDeadline: Date,
    totalPausedSeconds: number,
    pausedAt: Date | null,
  ): TimerState {
    const isPaused = pausedAt !== null;
    let remainingSeconds: number;

    if (isPaused) {
      remainingSeconds = calculateRemainingSeconds(
        serverDeadline,
        totalPausedSeconds,
        pausedAt!,
      );
    } else {
      remainingSeconds = calculateRemainingSeconds(
        serverDeadline,
        totalPausedSeconds,
      );
    }

    return {
      remainingSeconds,
      serverDeadline,
      totalPausedSeconds,
      isPaused,
      isExpired: remainingSeconds <= 0,
    };
  }

  calculateDeadline(startTime: Date, durationMinutes: number): Date {
    const deadline = new Date(startTime);
    deadline.setMinutes(deadline.getMinutes() + durationMinutes);
    return deadline;
  }

  pauseTimer(
    serverDeadline: Date,
    totalPausedSeconds: number,
  ): { pausedAt: Date; remainingAtPause: number } {
    const now = new Date();
    const remaining = calculateRemainingSeconds(
      serverDeadline,
      totalPausedSeconds,
      now,
    );
    return { pausedAt: now, remainingAtPause: remaining };
  }

  resumeTimer(
    pausedAt: Date,
    totalPausedSeconds: number,
  ): { newTotalPausedSeconds: number } {
    const now = new Date();
    const pausedDuration = Math.floor(
      (now.getTime() - pausedAt.getTime()) / 1000,
    );
    return { newTotalPausedSeconds: totalPausedSeconds + pausedDuration };
  }

  calculateProctorAutoAdjustment(
    lockedAt: Date,
    proctorResponseTime: Date,
    maxResponseMinutes: number,
  ): number {
    const responseTimeSeconds = Math.floor(
      (proctorResponseTime.getTime() - lockedAt.getTime()) / 1000,
    );
    const maxResponseSeconds = maxResponseMinutes * 60;

    if (responseTimeSeconds > maxResponseSeconds) {
      return responseTimeSeconds - maxResponseSeconds;
    }

    return 0;
  }
}

export const timerService = new TimerService();
