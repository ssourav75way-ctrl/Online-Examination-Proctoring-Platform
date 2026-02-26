"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.institutionController = exports.InstitutionController = void 0;
const institution_service_1 = require("./institution.service");
const app_error_1 = require("../../utils/app-error");
const response_util_1 = require("../../utils/response.util");
const app_error_2 = require("../../utils/app-error");
const pagination_util_1 = require("../../utils/pagination.util");
class InstitutionController {
    async create(req, res, next) {
        try {
            const institution = await institution_service_1.institutionService.create(req.body);
            (0, response_util_1.sendCreated)(res, institution);
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const institution = await institution_service_1.institutionService.getById(req.params.id);
            (0, response_util_1.sendSuccess)(res, institution);
        }
        catch (error) {
            next(error);
        }
    }
    async getAll(req, res, next) {
        try {
            const pagination = (0, pagination_util_1.parsePagination)(req.query);
            const { institutions, total } = await institution_service_1.institutionService.getAll(pagination);
            (0, response_util_1.sendSuccess)(res, institutions, "Institutions retrieved", 200, {
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
    async update(req, res, next) {
        try {
            const institution = await institution_service_1.institutionService.update(req.params.id, req.body);
            (0, response_util_1.sendSuccess)(res, institution, "Institution updated");
        }
        catch (error) {
            next(error);
        }
    }
    async addMember(req, res, next) {
        try {
            const { role } = req.body;
            const isSuperAdmin = req.user?.globalRole === "SUPER_ADMIN";
            if (isSuperAdmin && role !== "ADMIN") {
                throw new app_error_1.ForbiddenError("Super Admin can only assign the Institution Admin role");
            }
            if (!isSuperAdmin && role === "ADMIN") {
                throw new app_error_1.ForbiddenError("Only Super Admin can assign the Institution Admin role");
            }
            const member = await institution_service_1.institutionService.addMember(req.params.institutionId, req.body);
            (0, response_util_1.sendCreated)(res, member, "Member added");
        }
        catch (error) {
            next(error);
        }
    }
    async removeMember(req, res, next) {
        try {
            const institutionId = req.params.institutionId;
            const userId = req.params.userId;
            const isSuperAdmin = req.user?.globalRole === "SUPER_ADMIN";
            const { members } = await institution_service_1.institutionService.getMembers(institutionId, {
                page: 1,
                limit: 100,
                skip: 0,
            });
            const targetMember = members.find((m) => m.user.id === userId);
            if (!targetMember)
                throw new app_error_2.NotFoundError("Member not found");
            if (isSuperAdmin && targetMember.role !== "ADMIN") {
                throw new app_error_1.ForbiddenError("Super Admin can only remove Institution Admins");
            }
            if (!isSuperAdmin && targetMember.role === "ADMIN") {
                throw new app_error_1.ForbiddenError("Only Super Admin can remove Institution Admins");
            }
            await institution_service_1.institutionService.removeMember(institutionId, userId);
            (0, response_util_1.sendNoContent)(res);
        }
        catch (error) {
            next(error);
        }
    }
    async getMembers(req, res, next) {
        try {
            const pagination = (0, pagination_util_1.parsePagination)(req.query);
            const { members, total } = await institution_service_1.institutionService.getMembers(req.params.institutionId, pagination);
            (0, response_util_1.sendSuccess)(res, members, "Members retrieved", 200, {
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
    async updateMemberDepartments(req, res, next) {
        try {
            if (req.user?.globalRole === "SUPER_ADMIN") {
                throw new app_error_1.ForbiddenError("Super Admin cannot manage member departments. This action is reserved for Institution Admins.");
            }
            const result = await institution_service_1.institutionService.updateMemberDepartments(req.params.institutionId, req.params.userId, req.body.departmentIds);
            (0, response_util_1.sendSuccess)(res, result, "Member departments updated");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.InstitutionController = InstitutionController;
exports.institutionController = new InstitutionController();
//# sourceMappingURL=institution.controller.js.map