import { PaginationParams } from "../../utils/pagination.util";
import { CreateInstitutionInput, AddMemberInput } from "../../types/modules/institution.types";
export declare class InstitutionService {
    create(input: CreateInstitutionInput): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
    }>;
    getById(id: string): Promise<{
        _count: {
            exams: number;
            members: number;
        };
        departments: {
            name: string;
            id: string;
            code: string;
        }[];
    } & {
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
    }>;
    getAll(pagination: PaginationParams): Promise<{
        institutions: ({
            _count: {
                departments: number;
                exams: number;
                members: number;
            };
        } & {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string;
        })[];
        total: number;
    }>;
    update(id: string, data: Partial<CreateInstitutionInput>): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
    }>;
    addMember(institutionId: string, input: AddMemberInput): Promise<{
        user: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
        };
        departmentAccess: ({
            department: {
                name: string;
                id: string;
            };
        } & {
            id: string;
            institutionMemberId: string;
            departmentId: string;
        })[];
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        institutionId: string;
        role: import(".prisma/client").$Enums.InstitutionRole;
    }>;
    removeMember(institutionId: string, userId: string): Promise<void>;
    getMembers(institutionId: string, pagination: PaginationParams): Promise<{
        members: ({
            user: {
                email: string;
                globalRole: import(".prisma/client").$Enums.GlobalRole;
                id: string;
                firstName: string;
                lastName: string;
            };
            departmentAccess: ({
                department: {
                    name: string;
                    id: string;
                };
            } & {
                id: string;
                institutionMemberId: string;
                departmentId: string;
            })[];
        } & {
            userId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            institutionId: string;
            role: import(".prisma/client").$Enums.InstitutionRole;
        })[];
        total: number;
    }>;
    updateMemberDepartments(institutionId: string, userId: string, departmentIds: string[]): Promise<({
        user: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
        };
        departmentAccess: ({
            department: {
                name: string;
                id: string;
            };
        } & {
            id: string;
            institutionMemberId: string;
            departmentId: string;
        })[];
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        institutionId: string;
        role: import(".prisma/client").$Enums.InstitutionRole;
    }) | null>;
}
export declare const institutionService: InstitutionService;
//# sourceMappingURL=institution.service.d.ts.map