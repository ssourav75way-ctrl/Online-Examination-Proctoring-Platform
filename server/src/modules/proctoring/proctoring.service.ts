import prisma from "../../config/database.config";
import { NotFoundError } from "../../utils/app-error";
import { FlagType, ReviewStatus } from "@prisma/client";
import { proctoringConfig } from "../../config";
import { PaginationParams } from "../../utils/pagination.util";

import { UploadSnapshotInput } from "../../types/modules/proctoring.types";

export class ProctoringService {
  async uploadSnapshot(input: UploadSnapshotInput) {
    const session = await prisma.examSession.findUnique({
      where: { id: input.sessionId },
    });
    if (!session) throw new NotFoundError("Session not found");


    let candidateAbsent = input.candidateAbsent;
    const lastSnapshot = await prisma.proctorSnapshot.findFirst({
      where: { sessionId: input.sessionId },
      orderBy: { capturedAt: "desc" },
      select: { capturedAt: true },
    });
    if (lastSnapshot) {
      const gapSeconds = Math.floor(
        (Date.now() - lastSnapshot.capturedAt.getTime()) / 1000,
      );
      if (gapSeconds > proctoringConfig.absenceThresholdSeconds) {
        candidateAbsent = true;
      }
    }

    const snapshot = await prisma.proctorSnapshot.create({
      data: {
        sessionId: input.sessionId,
        imageUrl: input.imageUrl,
        faceDetected: input.faceDetected,
        multipleFaces: input.multipleFaces,
        candidateAbsent,
      },
    });

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
    if (candidateAbsent) {

      const actualGap = lastSnapshot
        ? Math.floor((Date.now() - lastSnapshot.capturedAt.getTime()) / 1000)
        : 0;
      flags.push({
        flagType: FlagType.ABSENT_60S,
        description: `Candidate absent for ${actualGap > 0 ? actualGap : "more than " + proctoringConfig.absenceThresholdSeconds} seconds (threshold: ${proctoringConfig.absenceThresholdSeconds}s)`,
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

  async getActiveSessions(institutionId: string) {
    const sessions = await prisma.examSession.findMany({
      where: {
        finishedAt: null,
        enrollment: { exam: { institutionId } },
      },
      include: {
        enrollment: {
          include: {
            candidate: {
              select: { id: true, firstName: true, lastName: true },
            },
            exam: { select: { id: true, title: true } },
          },
        },
        snapshots: {
          orderBy: { capturedAt: "desc" },
          take: 1,
        },
        _count: { select: { flags: { where: { reviewStatus: "PENDING" } } } },
      },
      orderBy: { startedAt: "desc" },
    });

    return sessions;
  }
}

export const proctoringService = new ProctoringService();
