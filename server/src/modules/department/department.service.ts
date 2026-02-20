import prisma from "../../config/database.config";
import { NotFoundError, ConflictError } from "../../utils/app-error";

interface CreateDepartmentInput {
  name: string;
  code: string;
  description?: string;
}

export class DepartmentService {
  async create(institutionId: string, input: CreateDepartmentInput) {
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
    });
    if (!institution) throw new NotFoundError("Institution not found");

    const existing = await prisma.department.findUnique({
      where: { institutionId_code: { institutionId, code: input.code } },
    });
    if (existing)
      throw new ConflictError(
        "Department code already exists in this institution",
      );

    return prisma.department.create({
      data: { ...input, institutionId },
      include: { questionPools: { select: { id: true, name: true } } },
    });
  }

  async getByInstitution(institutionId: string) {
    return prisma.department.findMany({
      where: { institutionId },
      include: {
        questionPools: { select: { id: true, name: true, isShared: true } },
        _count: { select: { questionPools: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  async getById(id: string) {
    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        institution: { select: { id: true, name: true } },
        questionPools: true,
      },
    });
    if (!dept) throw new NotFoundError("Department not found");
    return dept;
  }

  async update(id: string, input: Partial<CreateDepartmentInput>) {
    const dept = await prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundError("Department not found");

    if (input.code) {
      const existing = await prisma.department.findFirst({
        where: {
          institutionId: dept.institutionId,
          code: input.code,
          NOT: { id },
        },
      });
      if (existing) throw new ConflictError("Department code already exists");
    }

    return prisma.department.update({ where: { id }, data: input });
  }

  async delete(id: string) {
    const dept = await prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundError("Department not found");
    await prisma.department.delete({ where: { id } });
  }
}

export const departmentService = new DepartmentService();
