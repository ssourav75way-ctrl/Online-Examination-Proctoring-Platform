import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useGetExamsByInstitutionQuery } from "@/services/examApi";
import { Exam } from "@/types/exam";
import { Button } from "@/components/common/Button";
import { CONSTANTS } from "@/constants";
import { ExamFormModal } from "./ExamFormModal";

import { RootState } from "@/store";

import { formatDateIST } from "@/utils/dateFormat";

const statusBadgeMap: Record<string, { label: string; classes: string }> = {
  DRAFT: {
    label: "Draft",
    classes: "bg-slate-100 text-slate-800 border-slate-200",
  },
  SCHEDULED: {
    label: "Scheduled",
    classes: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  IN_PROGRESS: {
    label: "In Progress",
    classes: "bg-blue-100 text-blue-800 border-blue-200",
  },
  COMPLETED: {
    label: "Completed",
    classes: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  CANCELLED: {
    label: "Cancelled",
    classes: "bg-rose-100 text-rose-800 border-rose-200",
  },
};

export function ExamListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const user = useSelector((state: RootState) => state.auth.user);
  const effectiveRole = useSelector(
    (state: RootState) => state.auth.effectiveRole,
  );
  const institutionId = user?.institutionMembers?.[0]?.institution?.id || "";

  const userRole = effectiveRole || String(user?.globalRole || "");
  const isCandidate = userRole === "CANDIDATE";

  const { data, isLoading, isError, error } = useGetExamsByInstitutionQuery(
    { institutionId, page, limit: CONSTANTS.PAGINATION.DEFAULT_LIMIT },
    { skip: !institutionId },
  );

  const getErrorMessage = () => {
    if (!institutionId)
      return "No institution context found. Please ensure you are assigned to an institution.";
    if (!isError) return null;
    if (typeof error === "object" && error && "data" in error) {
      return (
        (error as { data?: { message?: string } }).data?.message ||
        "Failed to load exams"
      );
    }
    return "An unexpected error occurred while loading exams.";
  };

  const errorMessage = getErrorMessage();

  const exams = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  const renderStatusBadge = (status: string) => {
    const badge = statusBadgeMap[status] || statusBadgeMap["DRAFT"];
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.classes}`}
      >
        {badge.label}
      </span>
    );
  };

  const renderTableRow = (exam: Exam) => (
    <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors group">
      <td className="px-6 py-4 font-bold text-slate-900">{exam.title}</td>
      <td className="px-6 py-4 font-medium text-slate-600">
        {formatDateIST(exam.scheduledStartTime)}
      </td>
      <td className="px-6 py-4 font-mono text-xs text-slate-500">
        {exam.durationMinutes} min
      </td>
      <td className="px-6 py-4">{renderStatusBadge(exam.status)}</td>
      <td className="px-6 py-4 text-right">
        {isCandidate ? (
          <Button
            size="sm"
            disabled={
              exam.status !== "SCHEDULED" && exam.status !== "IN_PROGRESS"
            }
            onClick={() => navigate(`/dashboard/live/${exam.id}`)}
          >
            {exam.status === "IN_PROGRESS"
              ? "Resume Exam"
              : exam.status === "SCHEDULED"
                ? "Start Exam"
                : "Unavailable"}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-600 hover:text-primary-700 tracking-wide"
            onClick={() => navigate(`/dashboard/exams/${exam.id}`)}
          >
            Manage Event
          </Button>
        )}
      </td>
    </tr>
  );

  const renderTableRows = () => {
    if (exams.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
            {isCandidate
              ? "No exams available for enrollment at this time."
              : 'No exams scheduled. Click "Schedule Exam" to setup a new session.'}
          </td>
        </tr>
      );
    }
    return exams.map(renderTableRow);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">
            {isCandidate ? "Exams Explorer" : "Exam Management"}
          </h1>
          <p className="text-text-muted mt-1">
            {isCandidate
              ? "Browse and join scheduled examination events."
              : "Schedule and monitor platform examination events."}
          </p>
        </div>
        {!isCandidate && (
          <Button onClick={() => setIsModalOpen(true)}>Schedule Exam</Button>
        )}
      </div>

      {isLoading && (
        <div className="card p-8 flex justify-center items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {errorMessage}
        </div>
      )}

      {!isLoading && !isError && data && (
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Title
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Start Time
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Duration
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {renderTableRows()}
            </tbody>
          </table>

          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <ExamFormModal
          institutionId={institutionId}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

export default ExamListPage;
