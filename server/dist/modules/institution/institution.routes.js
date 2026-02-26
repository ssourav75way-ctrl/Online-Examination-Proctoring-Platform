"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const institution_controller_1 = require("./institution.controller");
const middlewares_1 = require("../../middlewares");
const router = (0, express_1.Router)();
router.post("/", middlewares_1.authenticate, (0, middlewares_1.requireGlobalRole)("SUPER_ADMIN"), (req, res, next) => institution_controller_1.institutionController.create(req, res, next));
router.get("/", middlewares_1.authenticate, (req, res, next) => institution_controller_1.institutionController.getAll(req, res, next));
router.get("/:id", middlewares_1.authenticate, (req, res, next) => institution_controller_1.institutionController.getById(req, res, next));
router.put("/:id", middlewares_1.authenticate, (0, middlewares_1.requireGlobalRole)("SUPER_ADMIN"), (req, res, next) => institution_controller_1.institutionController.update(req, res, next));
router.get("/:institutionId/members", middlewares_1.authenticate, middlewares_1.institutionScope, (0, middlewares_1.requireInstitutionRole)("ADMIN"), (req, res, next) => institution_controller_1.institutionController.getMembers(req, res, next));
router.post("/:institutionId/members", middlewares_1.authenticate, middlewares_1.institutionScope, (0, middlewares_1.requireInstitutionRole)("ADMIN"), (req, res, next) => institution_controller_1.institutionController.addMember(req, res, next));
router.delete("/:institutionId/members/:userId", middlewares_1.authenticate, middlewares_1.institutionScope, (0, middlewares_1.requireInstitutionRole)("ADMIN"), (req, res, next) => institution_controller_1.institutionController.removeMember(req, res, next));
router.put("/:institutionId/members/:userId/departments", middlewares_1.authenticate, middlewares_1.institutionScope, (0, middlewares_1.requireInstitutionRole)("ADMIN"), (req, res, next) => institution_controller_1.institutionController.updateMemberDepartments(req, res, next));
exports.default = router;
//# sourceMappingURL=institution.routes.js.map