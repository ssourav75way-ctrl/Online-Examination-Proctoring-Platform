import express from "express";
import cors from "cors";
import helmet from "helmet";
import { generalLimiter, errorHandler } from "./middlewares";


import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import institutionRoutes from "./modules/institution/institution.routes";
import departmentRoutes from "./modules/department/department.routes";
import questionPoolRoutes from "./modules/question-pool/question-pool.routes";
import questionRoutes from "./modules/question/question.routes";
import examRoutes from "./modules/exam/exam.routes";
import examSessionRoutes from "./modules/exam-session/exam-session.routes";
import proctoringRoutes from "./modules/proctoring/proctoring.routes";
import gradingRoutes from "./modules/grading/grading.routes";
import resultRoutes from "./modules/result/result.routes";
import accommodationRoutes from "./modules/accommodation/accommodation.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import notificationRoutes from "./modules/notification/notification.routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/institutions", institutionRoutes);
app.use("/api/institutions", departmentRoutes);
app.use("/api/institutions", questionPoolRoutes);
app.use("/api/institutions", questionRoutes);
app.use("/api/institutions", examRoutes);
app.use("/api/exam-sessions", examSessionRoutes);
app.use("/api/proctoring", proctoringRoutes);
app.use("/api/grading", gradingRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/accommodations", accommodationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

export default app;

