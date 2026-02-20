import prisma from "../../config/database.config";
import { NotFoundError } from "../../utils/app-error";
import { FlagType, ReviewStatus } from "@prisma/client";
import { proctoringConfig } from "../../config";
import { PaginationParams } from "../../utils/pagination.util";

interface UploadSnapshotInput {
  sessionId: string;
  imageUrl: string;
  faceDetected: boolean;
  multipleFaces: boolean;
  candidateAbsent: boolean;
}

export class ProctoringService {
  /**
   * Upload a webcam snapshot and auto-flag anomalies.
   */
  async uploadSnapshot(input: UploadSnapshotInput) {
    const session = await prisma.examSession.findUnique({
      where: { id: input.sessionId },
    });
    if (!session) throw new NotFoundError("Session not found");

    const snapshot = await prisma.proctorSnapshot.create({
      data: {
        sessionId: input.sessionId,
        imageUrl: input.imageUrl,
        faceDetected: input.faceDetected,
        multipleFaces: input.multipleFaces,
        candidateAbsent: input.candidateAbsent,
      },
    });

    // Auto-flag anomalies
    const flags: {
      flagType: FlagType;
      description: string;
      severity: number;
    }[] = [];

    if (!input.faceDetected) {
      flags.push({
        flagType: FlagType.NO_FACE,
        description: "Face not detected in snapshot",
        severity: 3,
      });
    }
    if (input.multipleFaces) {
      flags.push({
        flagType: FlagType.MULTIPLE_FACES,
        description: "Multiple faces detected in snapshot",
        severity: 4,
      });
    }
    if (input.candidateAbsent) {
      flags.push({
        flagType: FlagType.ABSENT_60S,
        description: `Candidate absent for more than ${proctoringConfig.absenceThresholdSeconds} seconds`,
        severity: 4,
      });
    }

    const createdFlags = [];
    for (const flag of flags) {
      const created = await prisma.proctorFlag.create({
        data: {
          sessionId: input.sessionId,
          snapshotId: snapshot.id,
          flagType: flag.flagType,
          description: flag.description,
          severity: flag.severity,
        },
      });
      createdFlags.push(created);
    }

    return { snapshot, flags: createdFlags };
  }

  /**
   * Get all pending flags for proctor review (queued — NOT auto-terminate).
   */
  async getPendingFlags(pagination: PaginationParams, institutionId?: string) {
    const where: Record<string, unknown> = {
      reviewStatus: ReviewStatus.PENDING,
    };

    if (institutionId) {
      where.session = {
        enrollment: { exam: { institutionId } },
      };
    }

    const [flags, total] = await Promise.all([
      prisma.proctorFlag.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        include: {
          session: {
            include: {
              enrollment: {
                include: {
                  candidate: {
                    select: { id: true, firstName: true, lastName: true },
                  },
                  exam: { select: { id: true, title: true } },
                },
              },
            },
          },
          snapshot: { select: { id: true, imageUrl: true, capturedAt: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.proctorFlag.count({ where }),
    ]);

    return { flags, total };
  }

  /**
   * Review a proctor flag (approve or dismiss).
   * Flags don't auto-terminate the exam — they queue for review.
   */
  async reviewFlag(
    flagId: string,
    reviewedById: string,
    status: ReviewStatus,
    reviewNotes?: string,
  ) {
    const flag = await prisma.proctorFlag.findUnique({ where: { id: flagId } });
    if (!flag) throw new NotFoundError("Flag not found");

    return prisma.proctorFlag.update({
      where: { id: flagId },
      data: {
        reviewedById,
        reviewStatus: status,
        reviewedAt: new Date(),
        reviewNotes,
      },
    });
  }

  /**
   * Get snapshots for a session.
   */
  async getSessionSnapshots(sessionId: string, pagination: PaginationParams) {
    const [snapshots, total] = await Promise.all([
      prisma.proctorSnapshot.findMany({
        where: { sessionId },
        skip: pagination.skip,
        take: pagination.limit,
        include: {
          flags: { select: { id: true, flagType: true, reviewStatus: true } },
        },
        orderBy: { capturedAt: "desc" },
      }),
      prisma.proctorSnapshot.count({ where: { sessionId } }),
    ]);

    return { snapshots, total };
  }

  /**
   * Get flags for a specific session.
   */
  async getSessionFlags(sessionId: string) {
    return prisma.proctorFlag.findMany({
      where: { sessionId },
      include: {
        snapshot: { select: { id: true, imageUrl: true, capturedAt: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const proctoringService = new ProctoringService();
