import { InstitutionRole } from "@prisma/client";
export interface CreateInstitutionRequestDTO {
    name: string;
    code: string;
}
export interface UpdateInstitutionRequestDTO {
    name?: string;
    code?: string;
}
export interface AddMemberRequestDTO {
    userId: string;
    role: InstitutionRole;
    departmentIds?: string[];
}
export interface UpdateMemberDepartmentsRequestDTO {
    departmentIds: string[];
}
export interface InstitutionListItemDTO {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: {
        members: number;
        departments: number;
        exams: number;
    };
}
export interface InstitutionDetailDTO {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    departments: DepartmentSummaryDTO[];
    _count: {
        members: number;
        exams: number;
    };
}
export interface DepartmentSummaryDTO {
    id: string;
    name: string;
    code: string;
}
export interface InstitutionListResponseDTO {
    institutions: InstitutionListItemDTO[];
    total: number;
}
export interface MemberDTO {
    id: string;
    role: InstitutionRole;
    createdAt: Date;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
    departmentAccess: {
        department: {
            id: string;
            name: string;
        };
    }[];
}
export interface MemberListResponseDTO {
    members: MemberDTO[];
    total: number;
}
//# sourceMappingURL=institution.dto.d.ts.map