"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const proctoring_controller_1 = require("./proctoring.controller");
const middlewares_1 = require("../../middlewares");
const router = (0, express_1.Router)();
router.post("/snapshots", middlewares_1.authenticate, middlewares_1.snapshotLimiter, (req, res, next) => proctoring_controller_1.proctoringController.uploadSnapshot(req, res, next));
router.get("/flags/pending", middlewares_1.authenticate, (req, res, next) => proctoring_controller_1.proctoringController.getPendingFlags(req, res, next));
router.patch("/flags/:flagId/review", middlewares_1.authenticate, (req, res, next) => proctoring_controller_1.proctoringController.reviewFlag(req, res, next));
router.get("/sessions/:sessionId/snapshots", middlewares_1.authenticate, (req, res, next) => proctoring_controller_1.proctoringController.getSessionSnapshots(req, res, next));
router.get("/sessions/:sessionId/flags", middlewares_1.authenticate, (req, res, next) => proctoring_controller_1.proctoringController.getSessionFlags(req, res, next));
router.get("/active-sessions", middlewares_1.authenticate, (req, res, next) => proctoring_controller_1.proctoringController.getActiveSessions(req, res, next));
exports.default = router;
//# sourceMappingURL=proctoring.routes.js.map