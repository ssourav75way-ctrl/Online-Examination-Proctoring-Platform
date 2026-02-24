import { Suspense, lazy } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { ROLES } from "@/constants";

const AuthLayout = lazy(() => import("@/components/layouts/AuthLayout"));
const AppLayout = lazy(() => import("@/components/layouts/AppLayout"));

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));

const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));
const InstitutionListPage = lazy(
  () => import("@/pages/institutions/InstitutionListPage"),
);
const InstitutionDetailPage = lazy(
  () => import("@/pages/institutions/InstitutionDetailPage"),
);
const DepartmentListPage = lazy(
  () => import("@/pages/institutions/DepartmentListPage"),
);
const UserManagementPage = lazy(
  () => import("@/pages/users/UserManagementPage"),
);
const QuestionPoolListPage = lazy(
  () => import("@/pages/questions/QuestionPoolListPage"),
);
const QuestionListPage = lazy(
  () => import("@/pages/questions/QuestionListPage"),
);
const ExamListPage = lazy(() => import("@/pages/exams/ExamListPage"));
const ExamDetailPage = lazy(() => import("@/pages/exams/ExamDetailPage"));
const ExamResultsPage = lazy(() => import("@/pages/exams/ExamResultsPage"));
const ExaminerResultsDashboard = lazy(
  () => import("@/pages/exams/ExaminerResultsDashboard"),
);
const ProctorQueuePage = lazy(() => import("@/pages/proctor/ProctorQueuePage"));
const ProctorSessionDetailPage = lazy(
  () => import("@/pages/proctor/ProctorSessionDetailPage"),
);
const ExamSessionPage = lazy(
  () => import("@/pages/exam-taking/ExamSessionPage"),
);
const ResultsHistoryPage = lazy(
  () => import("@/pages/dashboard/ResultsHistoryPage"),
);
const NotificationCenterPage = lazy(
  () => import("@/pages/dashboard/NotificationCenterPage"),
);
const UnauthorizedPage = lazy(() => import("@/pages/auth/UnauthorizedPage"));
const AccommodationManagementPage = lazy(
  () => import("@/pages/accommodations/AccommodationManagementPage"),
);

const Loader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
  </div>
);

import { ErrorBoundary } from "@/components/common/ErrorBoundary";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/auth",
    errorElement: <ErrorBoundary />,
    element: (
      <Suspense fallback={<Loader />}>
        <AuthLayout />
      </Suspense>
    ),
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
    ],
  },
  {
    path: "/dashboard",
    errorElement: <ErrorBoundary />,
    element: (
      <ProtectedRoute
        allowedRoles={[
          ROLES.SUPER_ADMIN,
          ROLES.ADMIN,
          ROLES.EXAMINER,
          ROLES.PROCTOR,
          ROLES.CANDIDATE,
        ]}
      />
    ),
    children: [
      {
        element: (
          <Suspense fallback={<Loader />}>
            <AppLayout />
          </Suspense>
        ),
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "institutions", element: <InstitutionListPage /> },
          { path: "institutions/:id", element: <InstitutionDetailPage /> },
          { path: "departments", element: <DepartmentListPage /> },
          { path: "users", element: <UserManagementPage /> },
          { path: "questions", element: <QuestionPoolListPage /> },
          { path: "questions/:poolId", element: <QuestionListPage /> },
          { path: "exams", element: <ExamListPage /> },
          { path: "exams/:id", element: <ExamDetailPage /> },
          { path: "exams/:id/results", element: <ExamResultsPage /> },
          { path: "results-management", element: <ExaminerResultsDashboard /> },
          { path: "sessions", element: <ProctorQueuePage /> },
          {
            path: "sessions/:sessionId",
            element: <ProctorSessionDetailPage />,
          },
          { path: "history", element: <ResultsHistoryPage /> },
          { path: "notifications", element: <NotificationCenterPage /> },
          {
            path: "accommodations",
            element: <AccommodationManagementPage />,
          },
        ],
      },
      {
        path: "live/:examId",
        element: (
          <Suspense fallback={<Loader />}>
            <ExamSessionPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "/unauthorized",
    element: (
      <Suspense fallback={<Loader />}>
        <UnauthorizedPage />
      </Suspense>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);

export const AppProvider = () => {
  return <RouterProvider router={router} />;
};
