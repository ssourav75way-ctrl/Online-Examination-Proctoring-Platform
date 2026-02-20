import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/token.util";
import { UnauthorizedError } from "../utils/app-error";
import prisma from "../config/database.config";
import { AuthenticatedUser } from "../types/auth.types";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("No token provided");
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        globalRole: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError("User not found or inactive");
    }

    const authenticatedUser: AuthenticatedUser = {
      userId: user.id,
      email: user.email,
      globalRole: user.globalRole,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    req.user = authenticatedUser;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError("Invalid or expired token"));
    }
  }
};
