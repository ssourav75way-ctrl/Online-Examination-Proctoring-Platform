"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const accommodation_controller_1 = require("./accommodation.controller");
const middlewares_1 = require("../../middlewares");
const router = (0, express_1.Router)();
router.post("/", middlewares_1.authenticate, (req, res, next) => accommodation_controller_1.accommodationController.grant(req, res, next));
router.patch("/:id/revoke", middlewares_1.authenticate, (req, res, next) => accommodation_controller_1.accommodationController.revoke(req, res, next));
router.patch("/:id", middlewares_1.authenticate, (req, res, next) => accommodation_controller_1.accommodationController.modify(req, res, next));
router.get("/candidate/:candidateId", middlewares_1.authenticate, (req, res, next) => accommodation_controller_1.accommodationController.getCandidateAccommodations(req, res, next));
router.get("/audit", middlewares_1.authenticate, (req, res, next) => accommodation_controller_1.accommodationController.getAuditTrail(req, res, next));
exports.default = router;
//# sourceMappingURL=accommodation.routes.js.map