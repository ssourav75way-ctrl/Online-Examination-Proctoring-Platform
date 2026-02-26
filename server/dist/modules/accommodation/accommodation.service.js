"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.accommodationService = exports.AccommodationService = void 0;
const database_config_1 = __importDefault(require("../../config/database.config"));
const app_error_1 = require("../../utils/app-error");
const client_1 = require("@prisma/client");
class AccommodationService {
    async grant(input, approvedById) {
        const candidate = await database_config_1.default.user.findUnique({
            where: { id: input.candidateId },
        });
        if (!candidate)
            throw new app_error_1.NotFoundError("Candidate not found");
        if (candidate.globalRole !== "CANDIDATE")
            throw new app_error_1.BadRequestError("User is not a candidate");
        const accommodation = await database_config_1.default.accommodation.create({
            data: {
                candidateId: input.candidateId,
                type: input.type,
                reason: input.reason,
                approvedById,
                validFrom: new Date(input.validFrom),
                validUntil: input.validUntil ? new Date(input.validUntil) : null,
            },
        });
        await database_config_1.default.accommodationAudit.create({
            data: {
                accommodationId: accommodation.id,
                action: client_1.AccommodationAction.GRANTED,
                performedById: approvedById,
                details: `Granted ${input.type} accommodation. Reason: ${input.reason}`,
            },
        });
        return accommodation;
    }
    async revoke(accommodationId, performedById, reason) {
        const accommodation = await database_config_1.default.accommodation.findUnique({
            where: { id: accommodationId },
        });
        if (!accommodation)
            throw new app_error_1.NotFoundError("Accommodation not found");
        await database_config_1.default.accommodation.update({
            where: { id: accommodationId },
            data: { isActive: false },
        });
        await database_config_1.default.accommodationAudit.create({
            data: {
                accommodationId,
                action: client_1.AccommodationAction.REVOKED,
                performedById,
                details: reason || "Accommodation revoked",
            },
        });
    }
    async modify(accommodationId, data, performedById) {
        const accommodation = await database_config_1.default.accommodation.findUnique({
            where: { id: accommodationId },
        });
        if (!accommodation)
            throw new app_error_1.NotFoundError("Accommodation not found");
        const updated = await database_config_1.default.accommodation.update({
            where: { id: accommodationId },
            data: {
                type: data.type,
                validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
            },
        });
        await database_config_1.default.accommodationAudit.create({
            data: {
                accommodationId,
                action: client_1.AccommodationAction.MODIFIED,
                performedById,
                details: `Modified to type: ${data.type || accommodation.type}`,
            },
        });
        return updated;
    }
    async getCandidateAccommodations(candidateId) {
        return database_config_1.default.accommodation.findMany({
            where: { candidateId },
            include: {
                approvedBy: { select: { id: true, firstName: true, lastName: true } },
                audits: { orderBy: { timestamp: "desc" } },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async getAuditTrail(pagination, candidateId) {
        const where = {};
        if (candidateId) {
            where.accommodation = { candidateId };
        }
        const [audits, total] = await Promise.all([
            database_config_1.default.accommodationAudit.findMany({
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
            database_config_1.default.accommodationAudit.count({ where }),
        ]);
        return { audits, total };
    }
}
exports.AccommodationService = AccommodationService;
exports.accommodationService = new AccommodationService();
//# sourceMappingURL=accommodation.service.js.map