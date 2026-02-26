import { CreateDepartmentInput } from "../../types/modules/department.types";
export declare class DepartmentService {
    create(institutionId: string, input: CreateDepartmentInput): Promise<{
        questionPools: {
            name: string;
            id: string;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        institutionId: string;
        description: string | null;
        code: string;
    }>;
    getByInstitution(institutionId: string, departmentIds?: string[]): Promise<({
        _count: {
            questionPools: number;
        };
        questionPools: {
            name: string;
            id: string;
            isShared: boolean;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        institutionId: string;
        description: string | null;
        code: string;
    })[]>;
    getById(id: string): Promise<{
        institution: {
            name: string;
            id: string;
        };
        questionPools: {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            departmentId: string;
            isShared: boolean;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        institutionId: string;
        description: string | null;
        code: string;
    }>;
    update(id: string, input: Partial<CreateDepartmentInput>): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        institutionId: string;
        description: string | null;
        code: string;
    }>;
    delete(id: string): Promise<void>;
}
export declare const departmentService: DepartmentService;
//# sourceMappingURL=department.service.d.ts.map