export interface TimerState {
  remainingSeconds: number;
  serverDeadline: Date;
  totalPausedSeconds: number;
  isPaused: boolean;
  isExpired: boolean;
}
