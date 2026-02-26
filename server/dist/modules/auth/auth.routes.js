"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const middlewares_1 = require("../../middlewares");
const router = (0, express_1.Router)();
router.post("/register", middlewares_1.authLimiter, (req, res, next) => auth_controller_1.authController.register(req, res, next));
router.post("/login", middlewares_1.authLimiter, (req, res, next) => auth_controller_1.authController.login(req, res, next));
router.post("/refresh", middlewares_1.authLimiter, (req, res, next) => auth_controller_1.authController.refreshToken(req, res, next));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map