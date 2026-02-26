import { JwtPayload, RefreshTokenPayload, TokenPair } from "../types/auth.types";
export declare const generateTokenPair: (payload: JwtPayload) => TokenPair;
export declare const verifyAccessToken: (token: string) => JwtPayload;
export declare const verifyRefreshToken: (token: string) => RefreshTokenPayload;
//# sourceMappingURL=token.util.d.ts.map