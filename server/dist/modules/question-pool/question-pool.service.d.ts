import { PaginationParams } from "../../utils/pagination.util";
import { CreatePoolInput } from "../../types/modules/question-pool.types";
export declare class QuestionPoolService {
    create(input: CreatePoolInput, departmentIds: string[]): Promise<{
        department: {
            name: string;
            id: string;
            institutionId: string;
        };
        _count: {
            questions: number;
        };
    } & {
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        departmentId: string;
        isShared: boolean;
    }>;
    getByDepartment(departmentId: string, pagination: PaginationParams): Promise<{
        pools: ({
            department: {
                name: string;
                id: string;
            };
            _count: {
                questions: number;
            };
        } & {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            departmentId: string;
            isShared: boolean;
        })[];
        total: number;
    }>;
    getAccessiblePools(institutionId: string, departmentIds: string[], pagination: PaginationParams): Promise<{
        pools: ({
            department: {
                name: string;
                id: string;
            };
            _count: {
                questions: number;
            };
        } & {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            departmentId: string;
            isShared: boolean;
        })[];
        total: number;
    }>;
    getById(id: string): Promise<{
        department: {
            name: string;
            id: string;
            institutionId: string;
        };
        _count: {
            questions: number;
        };
    } & {
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        departmentId: string;
        isShared: boolean;
    }>;
    update(id: string, data: {
        name?: string;
        description?: string;
        isShared?: boolean;
    }): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        departmentId: string;
        isShared: boolean;
    }>;
    delete(id: string): Promise<void>;
}
export declare const questionPoolService: QuestionPoolService;
//# sourceMappingURL=question-pool.service.d.ts.map