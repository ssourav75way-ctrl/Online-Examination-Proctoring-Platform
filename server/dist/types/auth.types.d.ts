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
export interface RegisterInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    globalRole?: GlobalRole;
}
export interface LoginInput {
    email: string;
    password: string;
}
export interface InstitutionMembership {
    id: string;
    role: InstitutionRole;
    institution: {
        id: string;
        name: string;
    };
}
export interface AuthResponse {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        globalRole: GlobalRole;
        institutionMembers: InstitutionMembership[];
    };
    tokens: TokenPair;
}
//# sourceMappingURL=auth.types.d.ts.map