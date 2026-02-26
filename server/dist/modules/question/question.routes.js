"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const question_controller_1 = require("./question.controller");
const middlewares_1 = require("../../middlewares");
const router = (0, express_1.Router)({ mergeParams: true });
router.post("/:institutionId/questions", middlewares_1.authenticate, middlewares_1.institutionScope, (0, middlewares_1.requireInstitutionRole)("ADMIN", "EXAMINER"), (req, res, next) => question_controller_1.questionController.create(req, res, next));
router.get("/:institutionId/questions/pool/:poolId", middlewares_1.authenticate, middlewares_1.institutionScope, (req, res, next) => question_controller_1.questionController.getByPool(req, res, next));
router.get("/:institutionId/questions/:id", middlewares_1.authenticate, middlewares_1.institutionScope, (req, res, next) => question_controller_1.questionController.getById(req, res, next));
router.get("/:institutionId/questions/:id/versions", middlewares_1.authenticate, middlewares_1.institutionScope, (req, res, next) => question_controller_1.questionController.getVersionHistory(req, res, next));
router.put("/:institutionId/questions/:id", middlewares_1.authenticate, middlewares_1.institutionScope, (0, middlewares_1.requireInstitutionRole)("ADMIN", "EXAMINER"), (req, res, next) => question_controller_1.questionController.update(req, res, next));
router.patch("/:institutionId/questions/:id/deactivate", middlewares_1.authenticate, middlewares_1.institutionScope, (0, middlewares_1.requireInstitutionRole)("ADMIN", "EXAMINER"), (req, res, next) => question_controller_1.questionController.deactivate(req, res, next));
router.post("/:institutionId/questions/:id/rollback/:versionId", middlewares_1.authenticate, middlewares_1.institutionScope, (0, middlewares_1.requireInstitutionRole)("ADMIN", "EXAMINER"), (req, res, next) => question_controller_1.questionController.rollback(req, res, next));
exports.default = router;
//# sourceMappingURL=question.routes.js.map