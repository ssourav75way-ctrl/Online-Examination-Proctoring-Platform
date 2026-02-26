import { GlobalRole } from "@prisma/client";
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
//# sourceMappingURL=auth.dto.d.ts.map