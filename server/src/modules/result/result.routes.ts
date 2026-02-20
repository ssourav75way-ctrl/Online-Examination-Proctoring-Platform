import { Router } from "express";
import { resultController } from "./result.controller";
import { authenticate } from "../../middlewares";

const router = Router();

// Examiner endpoints
router.post("/exams/:examId/generate", authenticate, (req, res, next) =>
  resultController.generateResults(req, res, next),
);
router.patch("/exams/:examId/publish", authenticate, (req, res, next) =>
  resultController.publishResults(req, res, next),
);
router.get("/exams/:examId", authenticate, (req, res, next) =>
  resultController.getExamResults(req, res, next),
);
router.get("/exams/:examId/re-evaluations", authenticate, (req, res, next) =>
  resultController.getReEvaluationRequests(req, res, next),
);
router.patch("/re-evaluations/:requestId", authenticate, (req, res, next) =>
  resultController.processReEvaluation(req, res, next),
);

// Candidate endpoints
router.get("/my-results", authenticate, (req, res, next) =>
  resultController.getMyResults(req, res, next),
);
router.get("/enrollments/:enrollmentId", authenticate, (req, res, next) =>
  resultController.getCandidateResult(req, res, next),
);
router.post("/:resultId/re-evaluate", authenticate, (req, res, next) =>
  resultController.fileReEvaluation(req, res, next),
);

export default router;
