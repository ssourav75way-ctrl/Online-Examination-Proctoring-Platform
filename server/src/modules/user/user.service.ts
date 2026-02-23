import prisma from "../../config/database.config";
import { NotFoundError, BadRequestError } from "../../utils/app-error";
import { GlobalRole } from "@prisma/client";
import { PaginationParams } from "../../utils/pagination.util";

import { UpdateUserInput } from "../../types/modules/user.types";

export class UserService {
  async getById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        globalRole: true,
        isActive: true,
        highContrastMode: true,
        screenReaderEnabled: true,
        createdAt: true,
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

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }

  async getAll(pagination: PaginationParams, role?: GlobalRole) {
    const where = role ? { globalRole: role } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          globalRole: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async findByEmail(email: string) {
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        globalRole: true,
      },
    });
    return user;
  }

  async update(userId: string, input: UpdateUserInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return prisma.user.update({
      where: { id: userId },
      data: input,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        globalRole: true,
        highContrastMode: true,
        screenReaderEnabled: true,
      },
    });
  }

  async deactivate(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!user.isActive) {
      throw new BadRequestError("User is already deactivated");
    }

    return prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  async activate(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
  }
}

export const userService = new UserService();
