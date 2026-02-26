"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentController = exports.DepartmentController = void 0;
const department_service_1 = require("./department.service");
const app_error_1 = require("../../utils/app-error");
const response_util_1 = require("../../utils/response.util");
class DepartmentController {
    async create(req, res, next) {
        try {
            if (req.user?.globalRole === "SUPER_ADMIN") {
                throw new app_error_1.ForbiddenError("Super Admin cannot create departments. This action is reserved for Institution Admins.");
            }
            const dept = await department_service_1.departmentService.create(req.params.institutionId, req.body);
            (0, response_util_1.sendCreated)(res, dept);
        }
        catch (error) {
            next(error);
        }
    }
    async getByInstitution(req, res, next) {
        try {
            const institutionId = req.params.institutionId;
            const departmentIds = req.scopedUser?.departmentIds;
            const depts = await department_service_1.departmentService.getByInstitution(institutionId, departmentIds);
            (0, response_util_1.sendSuccess)(res, depts);
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const dept = await department_service_1.departmentService.getById(req.params.id);
            (0, response_util_1.sendSuccess)(res, dept);
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const dept = await department_service_1.departmentService.update(req.params.id, req.body);
            (0, response_util_1.sendSuccess)(res, dept, "Department updated");
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            await department_service_1.departmentService.delete(req.params.id);
            (0, response_util_1.sendNoContent)(res);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DepartmentController = DepartmentController;
exports.departmentController = new DepartmentController();
//# sourceMappingURL=department.controller.js.map