import prisma from "../../config/database.config";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../../utils/app-error";
import { PaginationParams } from "../../utils/pagination.util";

import { CreatePoolInput } from "../../types/modules/question-pool.types";

export class QuestionPoolService {
  async create(input: CreatePoolInput, departmentIds: string[]) {
    if (!departmentIds.includes(input.departmentId)) {
      throw new ForbiddenError("You do not have access to this department");
    }

    return prisma.questionPool.create({
      data: {
        departmentId: input.departmentId,
        name: input.name,
        description: input.description,
        isShared: input.isShared || false,
      },
      include: {
        department: { select: { id: true, name: true, institutionId: true } },
        _count: { select: { questions: true } },
      },
    });
  }

  async getByDepartment(departmentId: string, pagination: PaginationParams) {
    const [pools, total] = await Promise.all([
      prisma.questionPool.findMany({
        where: { departmentId },
        skip: pagination.skip,
        take: pagination.limit,
        include: {
          department: { select: { id: true, name: true } },
          _count: { select: { questions: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.questionPool.count({ where: { departmentId } }),
    ]);

    return { pools, total };
  }

  async getAccessiblePools(
    institutionId: string,
    departmentIds: string[],
    pagination: PaginationParams,
  ) {
    const where = {
      department: { institutionId },
      OR: [{ departmentId: { in: departmentIds } }, { isShared: true }],
    };

    const [pools, total] = await Promise.all([
      prisma.questionPool.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        include: {
          department: { select: { id: true, name: true } },
          _count: { select: { questions: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.questionPool.count({ where }),
    ]);

    return { pools, total };
  }

  async getById(id: string) {
    const pool = await prisma.questionPool.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true, institutionId: true } },
        _count: { select: { questions: true } },
      },
    });
    if (!pool) throw new NotFoundError("Question pool not found");
    return pool;
  }

  async update(
    id: string,
    data: { name?: string; description?: string; isShared?: boolean },
  ) {
    const pool = await prisma.questionPool.findUnique({ where: { id } });
    if (!pool) throw new NotFoundError("Question pool not found");
    return prisma.questionPool.update({ where: { id }, data });
  }

  async delete(id: string) {
    const pool = await prisma.questionPool.findUnique({ where: { id } });
    if (!pool) throw new NotFoundError("Question pool not found");
    await prisma.questionPool.delete({ where: { id } });
  }
}

export const questionPoolService = new QuestionPoolService();
