import { InstitutionRole } from "@prisma/client";

export interface CreateInstitutionInput {
  name: string;
  code: string;
}

export interface AddMemberInput {
  userId: string;
  role: InstitutionRole;
  departmentIds?: string[];
}
