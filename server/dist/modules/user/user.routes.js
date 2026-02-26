"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const middlewares_1 = require("../../middlewares");
const router = (0, express_1.Router)();
router.get("/profile", middlewares_1.authenticate, (req, res, next) => user_controller_1.userController.getProfile(req, res, next));
router.put("/profile", middlewares_1.authenticate, (req, res, next) => user_controller_1.userController.updateProfile(req, res, next));
router.get("/", middlewares_1.authenticate, (0, middlewares_1.requireGlobalRole)("SUPER_ADMIN"), (req, res, next) => user_controller_1.userController.getAll(req, res, next));
router.get("/search", middlewares_1.authenticate, (req, res, next) => user_controller_1.userController.findByEmail(req, res, next));
router.get("/:id", middlewares_1.authenticate, (req, res, next) => user_controller_1.userController.getById(req, res, next));
router.patch("/:id/deactivate", middlewares_1.authenticate, (0, middlewares_1.requireGlobalRole)("SUPER_ADMIN"), (req, res, next) => user_controller_1.userController.deactivate(req, res, next));
router.patch("/:id/activate", middlewares_1.authenticate, (0, middlewares_1.requireGlobalRole)("SUPER_ADMIN"), (req, res, next) => user_controller_1.userController.activate(req, res, next));
exports.default = router;
//# sourceMappingURL=user.routes.js.map