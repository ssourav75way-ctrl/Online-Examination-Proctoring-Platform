"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const department_controller_1 = require("./department.controller");
const middlewares_1 = require("../../middlewares");
const router = (0, express_1.Router)({ mergeParams: true });
router.post("/:institutionId/departments", middlewares_1.authenticate, middlewares_1.institutionScope, (0, middlewares_1.requireInstitutionRole)("ADMIN"), (req, res, next) => department_controller_1.departmentController.create(req, res, next));
router.get("/:institutionId/departments", middlewares_1.authenticate, middlewares_1.institutionScope, (req, res, next) => department_controller_1.departmentController.getByInstitution(req, res, next));
router.get("/:institutionId/departments/:id", middlewares_1.authenticate, middlewares_1.institutionScope, (req, res, next) => department_controller_1.departmentController.getById(req, res, next));
router.put("/:institutionId/departments/:id", middlewares_1.authenticate, middlewares_1.institutionScope, (0, middlewares_1.requireInstitutionRole)("ADMIN"), (req, res, next) => department_controller_1.departmentController.update(req, res, next));
router.delete("/:institutionId/departments/:id", middlewares_1.authenticate, middlewares_1.institutionScope, (0, middlewares_1.requireInstitutionRole)("ADMIN"), (req, res, next) => department_controller_1.departmentController.delete(req, res, next));
exports.default = router;
//# sourceMappingURL=department.routes.js.map