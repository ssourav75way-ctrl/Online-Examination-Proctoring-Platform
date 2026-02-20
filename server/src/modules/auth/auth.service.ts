import prisma from "../../config/database.config";
import { hashPassword, comparePassword } from "../../utils/password.util";
import { generateTokenPair, verifyRefreshToken } from "../../utils/token.util";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "../../utils/app-error";
import { GlobalRole } from "@prisma/client";
import { JwtPayload, TokenPair } from "../../types/auth.types";

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  globalRole?: GlobalRole;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    globalRole: GlobalRole;
    institutionMembers: any[];
  };
  tokens: TokenPair;
}

export class AuthService {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictError("Email already registered");
    }

    if (input.password.length < 8) {
      throw new BadRequestError("Password must be at least 8 characters");
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        globalRole: input.globalRole || GlobalRole.CANDIDATE,
      },
    });

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      globalRole: user.globalRole,
    };

    const tokens = generateTokenPair(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        globalRole: user.globalRole,
        institutionMembers: [],
      },
      tokens,
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    if (!user.isActive) {
      throw new UnauthorizedError("Account is deactivated");
    }

    const isValid = await comparePassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      globalRole: user.globalRole,
    };

    const tokens = generateTokenPair(payload);

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        institutionMembers: {
          include: {
            institution: { select: { id: true, name: true, code: true } },
            departmentAccess: {
              include: { department: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    return {
      user: {
        id: fullUser!.id,
        email: fullUser!.email,
        firstName: fullUser!.firstName,
        lastName: fullUser!.lastName,
        globalRole: fullUser!.globalRole,
        institutionMembers: fullUser!.institutionMembers,
      },
      tokens,
    };
  }

  async refreshToken(refreshTokenStr: string): Promise<TokenPair> {
    try {
      const payload = verifyRefreshToken(refreshTokenStr);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError("User not found or inactive");
      }

      const jwtPayload: JwtPayload = {
        userId: user.id,
        email: user.email,
        globalRole: user.globalRole,
      };

      return generateTokenPair(jwtPayload);
    } catch {
      throw new UnauthorizedError("Invalid refresh token");
    }
  }
}

export const authService = new AuthService();
