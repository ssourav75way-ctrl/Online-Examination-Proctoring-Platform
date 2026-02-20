import { GlobalRole, InstitutionRole } from "@prisma/client";

export interface JwtPayload {
  userId: string;
  email: string;
  globalRole: GlobalRole;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  globalRole: GlobalRole;
  firstName: string;
  lastName: string;
}

export interface InstitutionScopedUser extends AuthenticatedUser {
  institutionId: string;
  institutionRole: InstitutionRole;
  departmentIds: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenPayload {
  userId: string;
  type: "refresh";
}
