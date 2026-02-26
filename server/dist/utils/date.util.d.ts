export declare const doTimeRangesOverlap: (start1: Date, end1: Date, start2: Date, end2: Date) => boolean;
export declare const calculateAdjustedDuration: (baseDurationMinutes: number, accommodationType: string) => number;
export declare const calculateRemainingSeconds: (serverDeadline: Date, totalPausedSeconds: number, now?: Date) => number;
export declare const isWithinChallengeWindow: (publishedAt: Date, challengeWindowDays: number) => boolean;
export declare const hasCooldownPassed: (lastAttemptFinishedAt: Date, cooldownHours: number) => boolean;
//# sourceMappingURL=date.util.d.ts.map