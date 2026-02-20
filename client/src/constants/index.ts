
export const CONSTANTS = {
  APP_NAME: "Online Examining Platform",

  API_BASE_URL:
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",

  
  STORAGE_KEYS: {
    ACCESS_TOKEN: "oep_access_token",
    REFRESH_TOKEN: "oep_refresh_token",
    THEME: "oep_theme_preference",
  },

  
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
  },

  
  POLLING_INTERVAL_MS: 30000,
  PROCTOR_SNAPSHOT_INTERVAL_MS: 60000,

  
  MESSAGES: {
    REQUIRED_FIELD: "This field is required",
    INVALID_EMAIL: "Please enter a valid email address",
    MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
    MAX_LENGTH: (max: number) => `Must be at most ${max} characters`,
    PASSWORD_MATCH: "Passwords must match",
    SESSION_EXPIRED: "Your session has expired. Please log in again.",
    NETWORK_ERROR:
      "Unable to connect to the server. Please check your internet connection.",
  },
} as const;


export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  EXAMINER: "EXAMINER",
  PROCTOR: "PROCTOR",
  CANDIDATE: "CANDIDATE",
} as const;
