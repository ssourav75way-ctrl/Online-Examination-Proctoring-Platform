"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.proctoringController = exports.ProctoringController = void 0;
const proctoring_service_1 = require("./proctoring.service");
const response_util_1 = require("../../utils/response.util");
const pagination_util_1 = require("../../utils/pagination.util");
class ProctoringController {
    async uploadSnapshot(req, res, next) {
        try {
            const result = await proctoring_service_1.proctoringService.uploadSnapshot(req.body);
            (0, response_util_1.sendCreated)(res, result, "Snapshot uploaded");
        }
        catch (error) {
            next(error);
        }
    }
    async getPendingFlags(req, res, next) {
        try {
            const pagination = (0, pagination_util_1.parsePagination)(req.query);
            const institutionId = req.query.institutionId;
            const { flags, total } = await proctoring_service_1.proctoringService.getPendingFlags(pagination, institutionId);
            (0, response_util_1.sendSuccess)(res, flags, "Pending flags retrieved", 200, {
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
    async reviewFlag(req, res, next) {
        try {
            const flag = await proctoring_service_1.proctoringService.reviewFlag(req.params.flagId, req.user.userId, req.body.status, req.body.reviewNotes);
            (0, response_util_1.sendSuccess)(res, flag, "Flag reviewed");
        }
        catch (error) {
            next(error);
        }
    }
    async getSessionSnapshots(req, res, next) {
        try {
            const pagination = (0, pagination_util_1.parsePagination)(req.query);
            const { snapshots, total } = await proctoring_service_1.proctoringService.getSessionSnapshots(req.params.sessionId, pagination);
            (0, response_util_1.sendSuccess)(res, snapshots, "Snapshots retrieved", 200, {
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
    async getSessionFlags(req, res, next) {
        try {
            const flags = await proctoring_service_1.proctoringService.getSessionFlags(req.params.sessionId);
            (0, response_util_1.sendSuccess)(res, flags);
        }
        catch (error) {
            next(error);
        }
    }
    async getActiveSessions(req, res, next) {
        try {
            const institutionId = req.query.institutionId ||
                req.params.institutionId;
            const sessions = await proctoring_service_1.proctoringService.getActiveSessions(institutionId);
            (0, response_util_1.sendSuccess)(res, sessions, "Active proctoring sessions retrieved");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProctoringController = ProctoringController;
exports.proctoringController = new ProctoringController();
//# sourceMappingURL=proctoring.controller.js.map