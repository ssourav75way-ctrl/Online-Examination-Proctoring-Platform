
export const doTimeRangesOverlap = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean => {
  return start1 < end2 && start2 < end1;
};


export const calculateAdjustedDuration = (
  baseDurationMinutes: number,
  accommodationType: string,
): number => {
  switch (accommodationType) {
    case "TIME_1_5X":
      return Math.ceil(baseDurationMinutes * 1.5);
    case "TIME_2X":
      return baseDurationMinutes * 2;
    default:
      return baseDurationMinutes;
  }
};


export const calculateRemainingSeconds = (
  serverDeadline: Date,
  totalPausedSeconds: number,
  now?: Date,
): number => {
  const currentTime = now || new Date();
  const remainingMs =
    serverDeadline.getTime() -
    currentTime.getTime() +
    totalPausedSeconds * 1000;
  return Math.max(0, Math.floor(remainingMs / 1000));
};


export const isWithinChallengeWindow = (
  publishedAt: Date,
  challengeWindowDays: number,
): boolean => {
  const windowEnd = new Date(publishedAt);
  windowEnd.setDate(windowEnd.getDate() + challengeWindowDays);
  return new Date() <= windowEnd;
};


export const hasCooldownPassed = (
  lastAttemptFinishedAt: Date,
  cooldownHours: number,
): boolean => {
  const cooldownEnd = new Date(lastAttemptFinishedAt);
  cooldownEnd.setHours(cooldownEnd.getHours() + cooldownHours);
  return new Date() >= cooldownEnd;
};
