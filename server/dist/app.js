"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const middlewares_1 = require("./middlewares");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const user_routes_1 = __importDefault(require("./modules/user/user.routes"));
const institution_routes_1 = __importDefault(require("./modules/institution/institution.routes"));
const department_routes_1 = __importDefault(require("./modules/department/department.routes"));
const question_pool_routes_1 = __importDefault(require("./modules/question-pool/question-pool.routes"));
const question_routes_1 = __importDefault(require("./modules/question/question.routes"));
const exam_routes_1 = __importDefault(require("./modules/exam/exam.routes"));
const exam_session_routes_1 = __importDefault(require("./modules/exam-session/exam-session.routes"));
const proctoring_routes_1 = __importDefault(require("./modules/proctoring/proctoring.routes"));
const grading_routes_1 = __importDefault(require("./modules/grading/grading.routes"));
const result_routes_1 = __importDefault(require("./modules/result/result.routes"));
const accommodation_routes_1 = __importDefault(require("./modules/accommodation/accommodation.routes"));
const analytics_routes_1 = __importDefault(require("./modules/analytics/analytics.routes"));
const notification_routes_1 = __importDefault(require("./modules/notification/notification.routes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(middlewares_1.generalLimiter);
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.use("/api/auth", auth_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use("/api/institutions", institution_routes_1.default);
app.use("/api/institutions", department_routes_1.default);
app.use("/api/institutions", question_pool_routes_1.default);
app.use("/api/institutions", question_routes_1.default);
app.use("/api/institutions", exam_routes_1.default);
app.use("/api/exam-sessions", exam_session_routes_1.default);
app.use("/api/proctoring", proctoring_routes_1.default);
app.use("/api/grading", grading_routes_1.default);
app.use("/api/results", result_routes_1.default);
app.use("/api/accommodations", accommodation_routes_1.default);
app.use("/api/analytics", analytics_routes_1.default);
app.use("/api/notifications", notification_routes_1.default);
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});
app.use(middlewares_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map