"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const response_util_1 = require("../../utils/response.util");
class AuthController {
    async register(req, res, next) {
        try {
            const { email, password, firstName, lastName, globalRole } = req.body;
            const result = await auth_service_1.authService.register({
                email,
                password,
                firstName,
                lastName,
                globalRole,
            });
            (0, response_util_1.sendCreated)(res, result, "Registration successful");
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await auth_service_1.authService.login({ email, password });
            (0, response_util_1.sendSuccess)(res, result, "Login successful");
        }
        catch (error) {
            next(error);
        }
    }
    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const tokens = await auth_service_1.authService.refreshToken(refreshToken);
            (0, response_util_1.sendSuccess)(res, tokens, "Token refreshed");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map