import jwt, { SignOptions } from "jsonwebtoken";
import { jwtConfig } from "../config";
import {
  JwtPayload,
  RefreshTokenPayload,
  TokenPair,
} from "../types/auth.types";

export const generateTokenPair = (payload: JwtPayload): TokenPair => {
  const accessOptions: SignOptions = {
    expiresIn: jwtConfig.expiresIn as jwt.SignOptions["expiresIn"],
  };

  const accessToken = jwt.sign(
    { ...payload } as Record<string, unknown>,
    jwtConfig.secret,
    accessOptions,
  );

  const refreshPayload: RefreshTokenPayload = {
    userId: payload.userId,
    type: "refresh",
  };

  const refreshOptions: SignOptions = {
    expiresIn: jwtConfig.refreshExpiresIn as jwt.SignOptions["expiresIn"],
  };

  const refreshToken = jwt.sign(
    { ...refreshPayload } as Record<string, unknown>,
    jwtConfig.refreshSecret,
    refreshOptions,
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, jwtConfig.secret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, jwtConfig.refreshSecret) as RefreshTokenPayload;
};
