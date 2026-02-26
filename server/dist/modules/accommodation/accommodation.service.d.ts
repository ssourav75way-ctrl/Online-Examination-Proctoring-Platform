import { AccommodationType } from "@prisma/client";
import { PaginationParams } from "../../utils/pagination.util";
import { CreateAccommodationInput } from "../../types/modules/accommodation.types";
export declare class AccommodationService {
    grant(input: CreateAccommodationInput, approvedById: string): Promise<{
        type: import(".prisma/client").$Enums.AccommodationType;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        candidateId: string;
        reason: string;
        approvedById: string;
        validFrom: Date;
        validUntil: Date | null;
    }>;
    revoke(accommodationId: string, performedById: string, reason?: string): Promise<void>;
    modify(accommodationId: string, data: {
        type?: AccommodationType;
        validUntil?: string;
    }, performedById: string): Promise<{
        type: import(".prisma/client").$Enums.AccommodationType;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        candidateId: string;
        reason: string;
        approvedById: string;
        validFrom: Date;
        validUntil: Date | null;
    }>;
    getCandidateAccommodations(candidateId: string): Promise<({
        audits: {
            id: string;
            accommodationId: string;
            action: import(".prisma/client").$Enums.AccommodationAction;
            performedById: string;
            details: string | null;
            timestamp: Date;
        }[];
        approvedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        type: import(".prisma/client").$Enums.AccommodationType;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        candidateId: string;
        reason: string;
        approvedById: string;
        validFrom: Date;
        validUntil: Date | null;
    })[]>;
    getAuditTrail(pagination: PaginationParams, candidateId?: string): Promise<{
        audits: ({
            accommodation: {
                candidate: {
                    id: string;
                    firstName: string;
                    lastName: string;
                };
            } & {
                type: import(".prisma/client").$Enums.AccommodationType;
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                candidateId: string;
                reason: string;
                approvedById: string;
                validFrom: Date;
                validUntil: Date | null;
            };
            performedBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            accommodationId: string;
            action: import(".prisma/client").$Enums.AccommodationAction;
            performedById: string;
            details: string | null;
            timestamp: Date;
        })[];
        total: number;
    }>;
}
export declare const accommodationService: AccommodationService;
//# sourceMappingURL=accommodation.service.d.ts.map