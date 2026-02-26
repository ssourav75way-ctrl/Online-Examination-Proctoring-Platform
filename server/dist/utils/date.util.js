"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasCooldownPassed = exports.isWithinChallengeWindow = exports.calculateRemainingSeconds = exports.calculateAdjustedDuration = exports.doTimeRangesOverlap = void 0;
const doTimeRangesOverlap = (start1, end1, start2, end2) => {
    return start1 < end2 && start2 < end1;
};
exports.doTimeRangesOverlap = doTimeRangesOverlap;
const calculateAdjustedDuration = (baseDurationMinutes, accommodationType) => {
    switch (accommodationType) {
        case "TIME_1_5X":
            return Math.ceil(baseDurationMinutes * 1.5);
        case "TIME_2X":
            return baseDurationMinutes * 2;
        default:
            return baseDurationMinutes;
    }
};
exports.calculateAdjustedDuration = calculateAdjustedDuration;
const calculateRemainingSeconds = (serverDeadline, totalPausedSeconds, now) => {
    const currentTime = now || new Date();
    const remainingMs = serverDeadline.getTime() -
        currentTime.getTime() +
        totalPausedSeconds * 1000;
    return Math.max(0, Math.floor(remainingMs / 1000));
};
exports.calculateRemainingSeconds = calculateRemainingSeconds;
const isWithinChallengeWindow = (publishedAt, challengeWindowDays) => {
    const windowEnd = new Date(publishedAt);
    windowEnd.setDate(windowEnd.getDate() + challengeWindowDays);
    return new Date() <= windowEnd;
};
exports.isWithinChallengeWindow = isWithinChallengeWindow;
const hasCooldownPassed = (lastAttemptFinishedAt, cooldownHours) => {
    const cooldownEnd = new Date(lastAttemptFinishedAt);
    cooldownEnd.setHours(cooldownEnd.getHours() + cooldownHours);
    return new Date() >= cooldownEnd;
};
exports.hasCooldownPassed = hasCooldownPassed;
//# sourceMappingURL=date.util.js.map