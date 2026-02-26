"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const user_service_1 = require("./user.service");
const response_util_1 = require("../../utils/response.util");
const app_error_1 = require("../../utils/app-error");
const pagination_util_1 = require("../../utils/pagination.util");
class UserController {
    async getProfile(req, res, next) {
        try {
            const user = await user_service_1.userService.getById(req.user.userId);
            (0, response_util_1.sendSuccess)(res, user);
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const user = await user_service_1.userService.getById(req.params.id);
            (0, response_util_1.sendSuccess)(res, user);
        }
        catch (error) {
            next(error);
        }
    }
    async getAll(req, res, next) {
        try {
            const pagination = (0, pagination_util_1.parsePagination)(req.query);
            const role = req.query.role;
            const { users, total } = await user_service_1.userService.getAll(pagination, role);
            (0, response_util_1.sendSuccess)(res, users, "Users retrieved", 200, {
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
    async findByEmail(req, res, next) {
        try {
            const email = req.query.email;
            if (!email)
                throw new app_error_1.BadRequestError("Email is required");
            const user = await user_service_1.userService.findByEmail(email);
            (0, response_util_1.sendSuccess)(res, user);
        }
        catch (error) {
            next(error);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const user = await user_service_1.userService.update(req.user.userId, req.body);
            (0, response_util_1.sendSuccess)(res, user, "Profile updated");
        }
        catch (error) {
            next(error);
        }
    }
    async deactivate(req, res, next) {
        try {
            await user_service_1.userService.deactivate(req.params.id);
            (0, response_util_1.sendSuccess)(res, null, "User deactivated");
        }
        catch (error) {
            next(error);
        }
    }
    async activate(req, res, next) {
        try {
            await user_service_1.userService.activate(req.params.id);
            (0, response_util_1.sendSuccess)(res, null, "User activated");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UserController = UserController;
exports.userController = new UserController();
//# sourceMappingURL=user.controller.js.map