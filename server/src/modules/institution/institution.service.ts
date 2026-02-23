import prisma from "../../config/database.config";
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "../../utils/app-error";
import { InstitutionRole } from "@prisma/client";
import { PaginationParams } from "../../utils/pagination.util";

import {
  CreateInstitutionInput,
  AddMemberInput,
} from "../../types/modules/institution.types";

export class InstitutionService {
  async create(input: CreateInstitutionInput) {
    const existing = await prisma.institution.findUnique({
      where: { code: input.code },
    });
    if (existing) {
      throw new ConflictError("Institution code already exists");
    }

    return prisma.institution.create({
      data: { name: input.name, code: input.code },
    });
  }

  async getById(id: string) {
    const institution = await prisma.institution.findUnique({
      where: { id },
      include: {
        departments: { select: { id: true, name: true, code: true } },
        _count: { select: { members: true, exams: true } },
      },
    });

    if (!institution) {
      throw new NotFoundError("Institution not found");
    }

    return institution;
  }

  async getAll(pagination: PaginationParams) {
    const [institutions, total] = await Promise.all([
      prisma.institution.findMany({
        skip: pagination.skip,
        take: pagination.limit,
        include: {
          _count: { select: { members: true, departments: true, exams: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.institution.count(),
    ]);

    return { institutions, total };
  }

  async update(id: string, data: Partial<CreateInstitutionInput>) {
    const institution = await prisma.institution.findUnique({ where: { id } });
    if (!institution) throw new NotFoundError("Institution not found");

    if (data.code) {
      const existing = await prisma.institution.findFirst({
        where: { code: data.code, NOT: { id } },
      });
      if (existing) throw new ConflictError("Institution code already exists");
    }

    return prisma.institution.update({ where: { id }, data });
  }

  async addMember(institutionId: string, input: AddMemberInput) {
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
    });
    if (!institution) throw new NotFoundError("Institution not found");

    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) throw new NotFoundError("User not found");

    const existing = await prisma.institutionMember.findUnique({
      where: { userId_institutionId: { userId: input.userId, institutionId } },
    });

    if (existing) {
      throw new ConflictError("User is already a member of this institution");
    }

    if (input.departmentIds && input.departmentIds.length > 0) {
      const departments = await prisma.department.findMany({
        where: { id: { in: input.departmentIds }, institutionId },
      });
      if (departments.length !== input.departmentIds.length) {
        throw new BadRequestError(
          "One or more department IDs are invalid for this institution",
        );
      }
    }

    return prisma.institutionMember.create({
      data: {
        userId: input.userId,
        institutionId,
        role: input.role,
        departmentAccess: input.departmentIds
          ? {
              create: input.departmentIds.map((deptId) => ({
                departmentId: deptId,
              })),
            }
          : undefined,
      },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        departmentAccess: {
          include: { department: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async removeMember(institutionId: string, userId: string) {
    const membership = await prisma.institutionMember.findUnique({
      where: { userId_institutionId: { userId, institutionId } },
    });

    if (!membership) {
      throw new NotFoundError("Membership not found");
    }

    await prisma.institutionMember.delete({
      where: { id: membership.id },
    });
  }

  async getMembers(institutionId: string, pagination: PaginationParams) {
    const [members, total] = await Promise.all([
      prisma.institutionMember.findMany({
        where: { institutionId },
        skip: pagination.skip,
        take: pagination.limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              globalRole: true,
            },
          },
          departmentAccess: {
            include: { department: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.institutionMember.count({ where: { institutionId } }),
    ]);

    return { members, total };
  }

  async updateMemberDepartments(
    institutionId: string,
    userId: string,
    departmentIds: string[],
  ) {
    const membership = await prisma.institutionMember.findUnique({
      where: { userId_institutionId: { userId, institutionId } },
    });

    if (!membership) throw new NotFoundError("Membership not found");

    if (departmentIds.length > 0) {
      const departments = await prisma.department.findMany({
        where: { id: { in: departmentIds }, institutionId },
      });
      if (departments.length !== departmentIds.length) {
        throw new BadRequestError(
          "One or more department IDs are invalid for this institution",
        );
      }
    }

    await prisma.institutionMemberDepartment.deleteMany({
      where: { institutionMemberId: membership.id },
    });

    if (departmentIds.length > 0) {
      await prisma.institutionMemberDepartment.createMany({
        data: departmentIds.map((deptId) => ({
          institutionMemberId: membership.id,
          departmentId: deptId,
        })),
      });
    }

    return prisma.institutionMember.findUnique({
      where: { id: membership.id },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        departmentAccess: {
          include: { department: { select: { id: true, name: true } } },
        },
      },
    });
  }
}

export const institutionService = new InstitutionService();
