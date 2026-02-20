import { AccommodationType, AccommodationAction } from "@prisma/client";

/* ─── Request DTOs ─── */

export interface GrantAccommodationRequestDTO {
  candidateId: string;
  type: AccommodationType;
  reason: string;
  validFrom: string;
  validUntil?: string;
}

export interface ModifyAccommodationRequestDTO {
  type?: AccommodationType;
  validUntil?: string;
}

export interface RevokeAccommodationRequestDTO {
  reason?: string;
}

/* ─── Response DTOs ─── */

export interface AccommodationDTO {
  id: string;
  candidateId: string;
  type: AccommodationType;
  reason: string;
  validFrom: Date;
  validUntil: Date | null;
  isActive: boolean;
  createdAt: Date;
  approvedBy: { id: string; firstName: string; lastName: string };
}

export interface AccommodationAuditDTO {
  id: string;
  accommodationId: string;
  action: AccommodationAction;
  details: string | null;
  timestamp: Date;
  accommodation: {
    candidate: { id: string; firstName: string; lastName: string };
  };
  performedBy: { id: string; firstName: string; lastName: string };
}

export interface AuditListResponseDTO {
  audits: AccommodationAuditDTO[];
  total: number;
}
