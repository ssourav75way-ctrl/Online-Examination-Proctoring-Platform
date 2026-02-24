import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "@/store";
import { Button } from "@/components/common/Button";
import {
  useGetInstitutionsQuery,
  useGetDepartmentsQuery,
} from "@/services/institutionApi";
import { useGetExamsByInstitutionQuery } from "@/services/examApi";
import { useGetQuestionPoolsQuery } from "@/services/questionApi";
import { useGetPendingFlagsQuery } from "@/services/proctorApi";
import { QuestionPoolFormModal } from "../questions/QuestionPoolFormModal";
import { QuestionFormModal } from "../questions/QuestionFormModal";
import { ExamFormModal } from "../exams/ExamFormModal";
import { useInstitution } from "@/contexts/InstitutionContext";
import { MemberAddModal } from "../institutions/MemberAddModal";
import { DepartmentFormModal } from "../institutions/DepartmentFormModal";
import { cn } from "@/utils/cn";
import { ClockIcon } from "@/components/common/Icons";

interface StatCard {
  title: string;
  value: string | number;
  description?: string;
  isLoading?: boolean;
  onClick?: () => void;
}

const StatWidget = ({
  title,
  value,
  description,
  isLoading,
  onClick,
}: StatCard) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "card p-6 flex flex-col justify-between hover:shadow-md transition-all duration-200",
        onClick &&
          "cursor-pointer hover:border-primary-300 ring-1 ring-transparent hover:ring-primary-100",
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
          {title}
        </h3>
        {isLoading && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600"></div>
        )}
      </div>
      <div className="text-3xl font-black text-slate-900 mb-1">{value}</div>
      {description && (
        <p className="text-sm font-medium text-slate-500 flex items-center gap-1">
          {description}
          {onClick && (
            <svg
              className="w-3 h-3 text-primary-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
        </p>
      )}
    </div>
  );
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [memberModalRole, setMemberModalRole] = useState<
    "EXAMINER" | "PROCTOR"
  >("EXAMINER");
  const user = useSelector((state: RootState) => state.auth.user);
  const effectiveRole = useSelector(
    (state: RootState) => state.auth.effectiveRole,
  );
  const { institutionId: selectedInstId, activeMembership } = useInstitution();
  const userRole =
    activeMembership?.role || effectiveRole || String(user?.globalRole || "");
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  const { data: instData, isLoading: instLoading } = useGetInstitutionsQuery(
    { page: 1, limit: 1 },
    { skip: userRole === "PROCTOR" },
  );

  const institutionId = selectedInstId || instData?.data?.[0]?.id || "";

  const { data: examData, isLoading: examLoading } =
    useGetExamsByInstitutionQuery(
      { institutionId, page: 1, limit: 1 },
      { skip: !institutionId || userRole === "SUPER_ADMIN" },
    );

  const { data: poolData, isLoading: poolLoading } = useGetQuestionPoolsQuery(
    { institutionId, page: 1, limit: 5 },
    {
      skip: !institutionId || (userRole !== "EXAMINER" && userRole !== "ADMIN"),
    },
  );

  const { data: flagData, isLoading: flagLoading } = useGetPendingFlagsQuery(
    {},
    { skip: userRole !== "PROCTOR" },
  );

  const { data: deptData, isLoading: deptLoading } = useGetDepartmentsQuery(
    institutionId,
    { skip: !institutionId || userRole !== "ADMIN" },
  );

  const dashboards: Record<string, () => JSX.Element> = {
    SUPER_ADMIN: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatWidget
          title="Total Institutions"
          value={instData?.meta?.total || 0}
          description="System-wide management"
          isLoading={instLoading}
          onClick={() => navigate("/dashboard/institutions")}
        />
        <StatWidget
          title="System Audit"
          value="View"
          description="Security & results"
          onClick={() => navigate("/dashboard/results")}
        />
      </div>
    ),
    ADMIN: () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatWidget
          title="Department List"
          value={deptData?.data?.length || 0}
          description="Institutional units"
          isLoading={deptLoading}
        />
        <StatWidget
          title="Staff Count"
          value={instData?.data?.[0]?._count?.members || 0}
          description="Examiners & Proctors"
          isLoading={instLoading}
        />
        <StatWidget
          title="Exam Schedule"
          value={examData?.meta?.total || 0}
          description="Next 30 days"
          isLoading={examLoading}
          onClick={() => navigate("/dashboard/exams")}
        />
      </div>
    ),
    EXAMINER: () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatWidget
          title="Question Bank"
          value={poolData?.meta?.total || 0}
          description="Across departments"
          isLoading={poolLoading}
          onClick={() => navigate("/dashboard/questions")}
        />
        <StatWidget
          title="Active Exams"
          value={examData?.meta?.total || 0}
          description="In your scope"
          isLoading={examLoading}
          onClick={() => navigate("/dashboard/exams")}
        />
        <StatWidget
          title="Published Results"
          value="View"
          description="Latest analytics"
          onClick={() => navigate("/dashboard/results")}
        />
      </div>
    ),
    PROCTOR: () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatWidget
          title="Pending Alerts"
          value={flagData?.data?.length || 0}
          description="Review anomalous behavior"
          isLoading={flagLoading}
        />
        <StatWidget
          title="Active Sessions"
          value="Live Monitor"
          description="In progress sessions"
        />
        <StatWidget
          title="Flag Rate"
          value="Normal"
          description="System stability ok"
        />
      </div>
    ),
    CANDIDATE: () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatWidget
          title="Available Exams"
          value={examData?.meta?.total || 0}
          description="Register now"
          isLoading={examLoading}
          onClick={() => navigate("/dashboard/exams")}
        />
        <StatWidget
          title="My Enrollments"
          value="View List"
          description="Check schedule"
          onClick={() => navigate("/dashboard/exams")}
        />
        <StatWidget
          title="Results History"
          value="View"
          description="Check past performance"
          onClick={() => navigate("/dashboard/results")}
        />
      </div>
    ),
  };

  const RenderDashboard = dashboards[userRole] || dashboards["CANDIDATE"];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-text-main tracking-tight">
            Welcome back, {user?.firstName}
          </h1>
          <p className="text-text-muted mt-1 text-lg">
            Role:{" "}
            <span className="text-primary-600 font-bold">
              {userRole.replace("_", " ")}
            </span>
          </p>
        </div>

        <div className="flex gap-4">
          {userRole === "CANDIDATE" && (
            <Button
              size="lg"
              className="shadow-soft"
              onClick={() => navigate("/dashboard/exams")}
            >
              View Available Exams
            </Button>
          )}
          {userRole === "EXAMINER" && (
            <>
              <Button
                size="lg"
                className="shadow-soft"
                onClick={() => setIsPoolModalOpen(true)}
              >
                Create Question Pool
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="shadow-soft"
                onClick={() => navigate("/dashboard/questions")}
              >
                Manage Question Bank
              </Button>
              <Button
                size="lg"
                className="shadow-soft"
                onClick={() => setIsQuestionModalOpen(true)}
              >
                + Add Question
              </Button>
            </>
          )}
          {userRole === "ADMIN" && (
            <>
              <Button
                size="lg"
                className="shadow-soft"
                onClick={() => {
                  setMemberModalRole("EXAMINER");
                  setIsMemberModalOpen(true);
                }}
              >
                Add Examiner
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="shadow-soft"
                onClick={() => {
                  setMemberModalRole("PROCTOR");
                  setIsMemberModalOpen(true);
                }}
              >
                Add Proctor
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="shadow-soft"
                onClick={() => setIsDeptModalOpen(true)}
              >
                Add Department
              </Button>
            </>
          )}

          {(userRole === "ADMIN" || userRole === "EXAMINER") && (
            <Button
              size="lg"
              variant="secondary"
              className="shadow-soft"
              onClick={() => setIsExamModalOpen(true)}
            >
              Schedule New Exam
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8">
        <RenderDashboard />
      </div>

      {!isSuperAdmin && (
        <div className="mt-12 card p-8 border border-border/60 shadow-sm bg-white">
          <h3 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-primary-600" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="secondary"
              onClick={() => navigate("/dashboard/exams")}
            >
              View Exam Schedule
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate("/dashboard/questions")}
            >
              Access Question PooL
            </Button>
            {userRole === "PROCTOR" && (
              <Button
                variant="secondary"
                onClick={() => navigate("/dashboard/sessions")}
              >
                Monitor Live Sessions
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              Refresh Dashboard
            </Button>
          </div>
        </div>
      )}

      {}
      {isPoolModalOpen && (
        <QuestionPoolFormModal
          institutionId={institutionId}
          onClose={() => setIsPoolModalOpen(false)}
        />
      )}
      {isExamModalOpen && (
        <ExamFormModal
          institutionId={institutionId}
          onClose={() => setIsExamModalOpen(false)}
        />
      )}

      {isQuestionModalOpen &&
        institutionId &&
        poolData?.data &&
        poolData.data.length > 0 && (
          <QuestionFormModal
            institutionId={institutionId}
            poolId={poolData.data[0].id}
            onClose={() => setIsQuestionModalOpen(false)}
          />
        )}
      {isQuestionModalOpen && institutionId && poolData?.data?.length === 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold text-text-main mb-2">
              No Question Pools
            </h2>
            <p className="text-sm text-text-muted mb-4">
              Please create a Question Pool before adding questions.
            </p>
            <Button
              onClick={() => {
                setIsQuestionModalOpen(false);
                setIsPoolModalOpen(true);
              }}
              className="w-full text-center"
            >
              + Create Pool First
            </Button>
          </div>
        </div>
      )}

      {isMemberModalOpen && institutionId && (
        <MemberAddModal
          institutionId={institutionId}
          defaultRole={memberModalRole}
          title={`Add ${memberModalRole === "EXAMINER" ? "Examiner" : "Proctor"}`}
          onClose={() => setIsMemberModalOpen(false)}
        />
      )}

      {isDeptModalOpen && institutionId && (
        <DepartmentFormModal
          institutionId={institutionId}
          onClose={() => setIsDeptModalOpen(false)}
        />
      )}
    </div>
  );
}

export default DashboardPage;
