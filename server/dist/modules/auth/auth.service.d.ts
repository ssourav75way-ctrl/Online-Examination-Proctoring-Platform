import { TokenPair, RegisterInput, LoginInput, AuthResponse } from "../../types/auth.types";
export declare class AuthService {
    register(input: RegisterInput): Promise<AuthResponse>;
    login(input: LoginInput): Promise<AuthResponse>;
    refreshToken(refreshTokenStr: string): Promise<TokenPair>;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map