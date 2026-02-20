import dotenv from "dotenv";
dotenv.config();

export const appConfig = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
};

export const jwtConfig = {
  secret: process.env.JWT_SECRET || "default-secret-change-me",
  refreshSecret:
    process.env.JWT_REFRESH_SECRET || "default-refresh-secret-change-me",
  expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
};

export const codeExecConfig = {
  timeoutMs: parseInt(process.env.CODE_EXEC_TIMEOUT_MS || "10000", 10),
  memoryLimitMb: parseInt(process.env.CODE_EXEC_MEMORY_LIMIT_MB || "128", 10),
};

export const proctoringConfig = {
  snapshotStoragePath:
    process.env.SNAPSHOT_STORAGE_PATH || "./uploads/snapshots",
  maxTabSwitches: parseInt(process.env.MAX_TAB_SWITCHES || "3", 10),
  proctorResponseTimeoutMinutes: parseInt(
    process.env.PROCTOR_RESPONSE_TIMEOUT_MINUTES || "5",
    10,
  ),
  absenceThresholdSeconds: parseInt(
    process.env.ABSENCE_THRESHOLD_SECONDS || "60",
    10,
  ),
};

export const resultConfig = {
  defaultChallengeWindowDays: parseInt(
    process.env.DEFAULT_CHALLENGE_WINDOW_DAYS || "7",
    10,
  ),
};

export const similarityConfig = {
  shortAnswerThreshold: parseFloat(
    process.env.SHORT_ANSWER_SIMILARITY_THRESHOLD || "0.7",
  ),
};
