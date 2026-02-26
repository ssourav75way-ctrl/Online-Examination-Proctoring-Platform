import { GlobalRole } from "@prisma/client";
export interface UpdateUserRequestDTO {
    firstName?: string;
    lastName?: string;
    highContrastMode?: boolean;
    screenReaderEnabled?: boolean;
}
export interface UserListItemDTO {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    globalRole: GlobalRole;
    isActive: boolean;
    createdAt: Date;
}
export interface UserDetailDTO extends UserListItemDTO {
    highContrastMode: boolean;
    screenReaderEnabled: boolean;
    institutionMembers: InstitutionMembershipDTO[];
}
export interface InstitutionMembershipDTO {
    role: string;
    institution: {
        id: string;
        name: string;
        code: string;
    };
    departmentAccess: {
        department: {
            id: string;
            name: string;
        };
    }[];
}
export interface UserListResponseDTO {
    users: UserListItemDTO[];
    total: number;
}
export interface UserUpdateResponseDTO {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    globalRole: GlobalRole;
    highContrastMode: boolean;
    screenReaderEnabled: boolean;
}
//# sourceMappingURL=user.dto.d.ts.map