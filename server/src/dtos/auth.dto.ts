import { GlobalRole } from "@prisma/client";

/* ─── Request DTOs ─── */

export interface RegisterRequestDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  globalRole?: GlobalRole;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface RefreshTokenRequestDTO {
  refreshToken: string;
}

/* ─── Response DTOs ─── */

export interface UserProfileDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  globalRole: GlobalRole;
}

export interface TokenPairDTO {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseDTO {
  user: UserProfileDTO;
  tokens: TokenPairDTO;
}
