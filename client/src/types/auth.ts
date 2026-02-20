/** Base response interface guaranteeing typed API responses */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Utility Types */
export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "EXAMINER"
  | "PROCTOR"
  | "CANDIDATE";

// Application State Base Error
export interface AppError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

// User Entity
export interface InstitutionMembership {
  role: "ADMIN" | "EXAMINER" | "PROCTOR";
  institution: { id: string; name: string; code: string };
  departmentAccess: { department: { id: string; name: string } }[];
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  globalRole: Role;
  isActive: boolean;
  needsPasswordReset: boolean;
  accessibilityPreferences: AccessibilityPreferences | null;
  institutionMembers?: InstitutionMembership[];
  createdAt: string;
}

export interface AccessibilityPreferences {
  highContrast: boolean;
  fontSize: "NORMAL" | "LARGE" | "EXTRA_LARGE";
}

// Token Payloads
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  globalRole: Role;
  iat: number;
  exp: number;
}
