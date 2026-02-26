"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accommodationController = exports.AccommodationController = void 0;
const accommodation_service_1 = require("./accommodation.service");
const response_util_1 = require("../../utils/response.util");
const pagination_util_1 = require("../../utils/pagination.util");
class AccommodationController {
    async grant(req, res, next) {
        try {
            const accommodation = await accommodation_service_1.accommodationService.grant(req.body, req.user.userId);
            (0, response_util_1.sendCreated)(res, accommodation, "Accommodation granted");
        }
        catch (error) {
            next(error);
        }
    }
    async revoke(req, res, next) {
        try {
            await accommodation_service_1.accommodationService.revoke(req.params.id, req.user.userId, req.body.reason);
            (0, response_util_1.sendSuccess)(res, null, "Accommodation revoked");
        }
        catch (error) {
            next(error);
        }
    }
    async modify(req, res, next) {
        try {
            const accommodation = await accommodation_service_1.accommodationService.modify(req.params.id, req.body, req.user.userId);
            (0, response_util_1.sendSuccess)(res, accommodation, "Accommodation modified");
        }
        catch (error) {
            next(error);
        }
    }
    async getCandidateAccommodations(req, res, next) {
        try {
            const accommodations = await accommodation_service_1.accommodationService.getCandidateAccommodations(req.params.candidateId);
            (0, response_util_1.sendSuccess)(res, accommodations);
        }
        catch (error) {
            next(error);
        }
    }
    async getAuditTrail(req, res, next) {
        try {
            const pagination = (0, pagination_util_1.parsePagination)(req.query);
            const candidateId = req.query.candidateId;
            const { audits, total } = await accommodation_service_1.accommodationService.getAuditTrail(pagination, candidateId);
            (0, response_util_1.sendSuccess)(res, audits, "Audit trail retrieved", 200, {
                page: pagination.page,
                limit: pagination.limit,
                total,
                totalPages: (0, pagination_util_1.calculateTotalPages)(total, pagination.limit),
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AccommodationController = AccommodationController;
exports.accommodationController = new AccommodationController();
//# sourceMappingURL=accommodation.controller.js.map