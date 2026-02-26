import { AccommodationType } from "@prisma/client";
export interface CreateAccommodationInput {
    candidateId: string;
    type: AccommodationType;
    reason: string;
    validFrom: string;
    validUntil?: string;
}
//# sourceMappingURL=accommodation.types.d.ts.map