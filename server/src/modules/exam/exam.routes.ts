import { Router } from "express";
import { examController } from "./exam.controller";
import {
  authenticate,
  institutionScope,
  requireInstitutionRole,
} from "../../middlewares";

const router = Router();

router.post(
  "/:institutionId/exams",
  authenticate,
  institutionScope,
  requireInstitutionRole("ADMIN", "EXAMINER"),
  (req, res, next) => examController.create(req, res, next),
);
router.get(
  "/:institutionId/exams",
  authenticate,
  institutionScope,
  (req, res, next) => examController.getByInstitution(req, res, next),
);
router.get(
  "/:institutionId/exams/:id",
  authenticate,
  institutionScope,
  (req, res, next) => examController.getById(req, res, next),
);
router.patch(
  "/:institutionId/exams/:id/schedule",
  authenticate,
  institutionScope,
  requireInstitutionRole("ADMIN", "EXAMINER"),
  (req, res, next) => examController.schedule(req, res, next),
);
router.patch(
  "/:institutionId/exams/:id/reschedule",
  authenticate,
  institutionScope,
  requireInstitutionRole("ADMIN", "EXAMINER"),
  (req, res, next) => examController.reschedule(req, res, next),
);
router.patch(
  "/:institutionId/exams/:id/cancel",
  authenticate,
  institutionScope,
  requireInstitutionRole("ADMIN", "EXAMINER"),
  (req, res, next) => examController.cancel(req, res, next),
);
router.post(
  "/:institutionId/exams/:id/enroll",
  authenticate,
  institutionScope,
  requireInstitutionRole("ADMIN", "EXAMINER"),
  (req, res, next) => examController.enrollCandidate(req, res, next),
);
router.get(
  "/:institutionId/exams/:id/enrollments",
  authenticate,
  institutionScope,
  (req, res, next) => examController.getEnrollments(req, res, next),
);
router.get(
  "/:institutionId/exams/:id/retake-questions/:candidateId",
  authenticate,
  institutionScope,
  requireInstitutionRole("ADMIN", "EXAMINER"),
  (req, res, next) => examController.getRetakeQuestions(req, res, next),
);
router.put("/:id", authenticate, (req, res, next) =>
  examController.update(req, res, next),
);

export default router;
