import prisma from "../../config/database.config";
import { NotFoundError, BadRequestError } from "../../utils/app-error";
import { AccommodationType, AccommodationAction } from "@prisma/client";
import { PaginationParams } from "../../utils/pagination.util";

interface CreateAccommodationInput {
  candidateId: string;
  type: AccommodationType;
  reason: string;
  validFrom: string;
  validUntil?: string;
}

export class AccommodationService {
  /**
   * Grant an accommodation (1.5x, 2x time) — logged for audit.
   * Applied per candidate without revealing to others.
   */
  async grant(input: CreateAccommodationInput, approvedById: string) {
    const candidate = await prisma.user.findUnique({
      where: { id: input.candidateId },
    });
    if (!candidate) throw new NotFoundError("Candidate not found");
    if (candidate.globalRole !== "CANDIDATE")
      throw new BadRequestError("User is not a candidate");

    const accommodation = await prisma.accommodation.create({
      data: {
        candidateId: input.candidateId,
        type: input.type,
        reason: input.reason,
        approvedById,
        validFrom: new Date(input.validFrom),
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
      },
    });

    // Audit log
    await prisma.accommodationAudit.create({
      data: {
        accommodationId: accommodation.id,
        action: AccommodationAction.GRANTED,
        performedById: approvedById,
        details: `Granted ${input.type} accommodation. Reason: ${input.reason}`,
      },
    });

    return accommodation;
  }

  async revoke(
    accommodationId: string,
    performedById: string,
    reason?: string,
  ) {
    const accommodation = await prisma.accommodation.findUnique({
      where: { id: accommodationId },
    });
    if (!accommodation) throw new NotFoundError("Accommodation not found");

    await prisma.accommodation.update({
      where: { id: accommodationId },
      data: { isActive: false },
    });

    await prisma.accommodationAudit.create({
      data: {
        accommodationId,
        action: AccommodationAction.REVOKED,
        performedById,
        details: reason || "Accommodation revoked",
      },
    });
  }

  async modify(
    accommodationId: string,
    data: { type?: AccommodationType; validUntil?: string },
    performedById: string,
  ) {
    const accommodation = await prisma.accommodation.findUnique({
      where: { id: accommodationId },
    });
    if (!accommodation) throw new NotFoundError("Accommodation not found");

    const updated = await prisma.accommodation.update({
      where: { id: accommodationId },
      data: {
        type: data.type,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      },
    });

    await prisma.accommodationAudit.create({
      data: {
        accommodationId,
        action: AccommodationAction.MODIFIED,
        performedById,
        details: `Modified to type: ${data.type || accommodation.type}`,
      },
    });

    return updated;
  }

  async getCandidateAccommodations(candidateId: string) {
    return prisma.accommodation.findMany({
      where: { candidateId },
      include: {
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        audits: { orderBy: { timestamp: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAuditTrail(pagination: PaginationParams, candidateId?: string) {
    const where: Record<string, unknown> = {};
    if (candidateId) {
      where.accommodation = { candidateId };
    }

    const [audits, total] = await Promise.all([
      prisma.accommodationAudit.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        include: {
          accommodation: {
            include: {
              candidate: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
          performedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { timestamp: "desc" },
      }),
      prisma.accommodationAudit.count({ where }),
    ]);

    return { audits, total };
  }
}

export const accommodationService = new AccommodationService();
