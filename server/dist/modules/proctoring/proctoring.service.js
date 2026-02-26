"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.proctoringService = exports.ProctoringService = void 0;
const database_config_1 = __importDefault(require("../../config/database.config"));
const app_error_1 = require("../../utils/app-error");
const client_1 = require("@prisma/client");
const config_1 = require("../../config");
class ProctoringService {
    async uploadSnapshot(input) {
        const session = await database_config_1.default.examSession.findUnique({
            where: { id: input.sessionId },
        });
        if (!session)
            throw new app_error_1.NotFoundError("Session not found");
        let candidateAbsent = input.candidateAbsent;
        const lastSnapshot = await database_config_1.default.proctorSnapshot.findFirst({
            where: { sessionId: input.sessionId },
            orderBy: { capturedAt: "desc" },
            select: { capturedAt: true },
        });
        if (lastSnapshot) {
            const gapSeconds = Math.floor((Date.now() - lastSnapshot.capturedAt.getTime()) / 1000);
            if (gapSeconds > config_1.proctoringConfig.absenceThresholdSeconds) {
                candidateAbsent = true;
            }
        }
        const snapshot = await database_config_1.default.proctorSnapshot.create({
            data: {
                sessionId: input.sessionId,
                imageUrl: input.imageUrl,
                faceDetected: input.faceDetected,
                multipleFaces: input.multipleFaces,
                candidateAbsent,
            },
        });
        const flags = [];
        if (!input.faceDetected) {
            flags.push({
                flagType: client_1.FlagType.NO_FACE,
                description: "Face not detected in snapshot",
                severity: 3,
            });
        }
        if (input.multipleFaces) {
            flags.push({
                flagType: client_1.FlagType.MULTIPLE_FACES,
                description: "Multiple faces detected in snapshot",
                severity: 4,
            });
        }
        if (candidateAbsent) {
            const actualGap = lastSnapshot
                ? Math.floor((Date.now() - lastSnapshot.capturedAt.getTime()) / 1000)
                : 0;
            flags.push({
                flagType: client_1.FlagType.ABSENT_60S,
                description: `Candidate absent for ${actualGap > 0 ? actualGap : "more than " + config_1.proctoringConfig.absenceThresholdSeconds} seconds (threshold: ${config_1.proctoringConfig.absenceThresholdSeconds}s)`,
                severity: 4,
            });
        }
        const createdFlags = [];
        for (const flag of flags) {
            const created = await database_config_1.default.proctorFlag.create({
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
    async getPendingFlags(pagination, institutionId) {
        const where = {
            reviewStatus: client_1.ReviewStatus.PENDING,
        };
        if (institutionId) {
            where.session = {
                enrollment: { exam: { institutionId } },
            };
        }
        const [flags, total] = await Promise.all([
            database_config_1.default.proctorFlag.findMany({
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
            database_config_1.default.proctorFlag.count({ where }),
        ]);
        return { flags, total };
    }
    async reviewFlag(flagId, reviewedById, status, reviewNotes) {
        const flag = await database_config_1.default.proctorFlag.findUnique({ where: { id: flagId } });
        if (!flag)
            throw new app_error_1.NotFoundError("Flag not found");
        return database_config_1.default.proctorFlag.update({
            where: { id: flagId },
            data: {
                reviewedById,
                reviewStatus: status,
                reviewedAt: new Date(),
                reviewNotes,
            },
        });
    }
    async getSessionSnapshots(sessionId, pagination) {
        const [snapshots, total] = await Promise.all([
            database_config_1.default.proctorSnapshot.findMany({
                where: { sessionId },
                skip: pagination.skip,
                take: pagination.limit,
                include: {
                    flags: { select: { id: true, flagType: true, reviewStatus: true } },
                },
                orderBy: { capturedAt: "desc" },
            }),
            database_config_1.default.proctorSnapshot.count({ where: { sessionId } }),
        ]);
        return { snapshots, total };
    }
    async getSessionFlags(sessionId) {
        return database_config_1.default.proctorFlag.findMany({
            where: { sessionId },
            include: {
                snapshot: { select: { id: true, imageUrl: true, capturedAt: true } },
                reviewedBy: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async getActiveSessions(institutionId) {
        const sessions = await database_config_1.default.examSession.findMany({
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
exports.ProctoringService = ProctoringService;
exports.proctoringService = new ProctoringService();
//# sourceMappingURL=proctoring.service.js.map