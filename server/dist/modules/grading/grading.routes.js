"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const grading_controller_1 = require("./grading.controller");
const middlewares_1 = require("../../middlewares");
const router = (0, express_1.Router)();
router.post("/sessions/:sessionId/auto-grade", middlewares_1.authenticate, (req, res, next) => grading_controller_1.gradingController.autoGradeSession(req, res, next));
router.patch("/answers/:answerId/override", middlewares_1.authenticate, (req, res, next) => grading_controller_1.gradingController.overrideScore(req, res, next));
exports.default = router;
//# sourceMappingURL=grading.routes.js.map