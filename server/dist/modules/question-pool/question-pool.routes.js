"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const question_pool_controller_1 = require("./question-pool.controller");
const middlewares_1 = require("../../middlewares");
const router = (0, express_1.Router)({ mergeParams: true });
router.post("/:institutionId/question-pools", middlewares_1.authenticate, middlewares_1.institutionScope, (0, middlewares_1.requireInstitutionRole)("ADMIN", "EXAMINER"), (req, res, next) => question_pool_controller_1.questionPoolController.create(req, res, next));
router.get("/:institutionId/question-pools", middlewares_1.authenticate, middlewares_1.institutionScope, (req, res, next) => question_pool_controller_1.questionPoolController.getAccessiblePools(req, res, next));
router.get("/:institutionId/question-pools/department/:departmentId", middlewares_1.authenticate, middlewares_1.institutionScope, (req, res, next) => question_pool_controller_1.questionPoolController.getByDepartment(req, res, next));
router.get("/:institutionId/question-pools/:id", middlewares_1.authenticate, middlewares_1.institutionScope, (req, res, next) => question_pool_controller_1.questionPoolController.getById(req, res, next));
router.put("/:institutionId/question-pools/:id", middlewares_1.authenticate, middlewares_1.institutionScope, (0, middlewares_1.requireInstitutionRole)("ADMIN", "EXAMINER"), (req, res, next) => question_pool_controller_1.questionPoolController.update(req, res, next));
router.delete("/:institutionId/question-pools/:id", middlewares_1.authenticate, middlewares_1.institutionScope, (0, middlewares_1.requireInstitutionRole)("ADMIN"), (req, res, next) => question_pool_controller_1.questionPoolController.delete(req, res, next));
exports.default = router;
//# sourceMappingURL=question-pool.routes.js.map