import { GlobalRole } from "@prisma/client";
import { PaginationParams } from "../../utils/pagination.util";
import { UpdateUserInput } from "../../types/modules/user.types";
export declare class UserService {
    getById(userId: string): Promise<{
        email: string;
        globalRole: import(".prisma/client").$Enums.GlobalRole;
        id: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        highContrastMode: boolean;
        screenReaderEnabled: boolean;
        createdAt: Date;
        institutionMembers: ({
            institution: {
                name: string;
                id: string;
                code: string;
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
    }>;
    getAll(pagination: PaginationParams, role?: GlobalRole): Promise<{
        users: {
            email: string;
            globalRole: import(".prisma/client").$Enums.GlobalRole;
            id: string;
            firstName: string;
            lastName: string;
            isActive: boolean;
            createdAt: Date;
        }[];
        total: number;
    }>;
    findByEmail(email: string): Promise<{
        email: string;
        globalRole: import(".prisma/client").$Enums.GlobalRole;
        id: string;
        firstName: string;
        lastName: string;
    } | null>;
    update(userId: string, input: UpdateUserInput): Promise<{
        email: string;
        globalRole: import(".prisma/client").$Enums.GlobalRole;
        id: string;
        firstName: string;
        lastName: string;
        highContrastMode: boolean;
        screenReaderEnabled: boolean;
    }>;
    deactivate(userId: string): Promise<{
        email: string;
        globalRole: import(".prisma/client").$Enums.GlobalRole;
        id: string;
        passwordHash: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        highContrastMode: boolean;
        screenReaderEnabled: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    activate(userId: string): Promise<{
        email: string;
        globalRole: import(".prisma/client").$Enums.GlobalRole;
        id: string;
        passwordHash: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        highContrastMode: boolean;
        screenReaderEnabled: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export declare const userService: UserService;
//# sourceMappingURL=user.service.d.ts.map