import { useState } from "react";
import {
  useGetPendingFlagsQuery,
  useReviewFlagMutation,
  ProctorFlag,
} from "@/services/proctorApi";
import { Button } from "@/components/common/Button";
import { CONSTANTS } from "@/constants";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const flagTypeLabels: Record<string, string> = {
  NO_FACE: "No Face Detected",
  MULTIPLE_FACES: "Multiple Faces",
  ABSENT_60S: "Absent 60s+",
  TAB_SWITCH: "Tab Switch",
  TIMING_ANOMALY: "Timing Anomaly",
  FOCUS_LOSS: "Focus Loss",
};

const severityBadgeMap: Record<number, { label: string; classes: string }> = {
  1: {
    label: "Low",
    classes: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  2: {
    label: "Medium",
    classes: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  3: {
    label: "High",
    classes: "bg-orange-100 text-orange-800 border-orange-200",
  },
  4: {
    label: "Critical",
    classes: "bg-rose-100 text-rose-800 border-rose-200",
  },
  5: { label: "Severe", classes: "bg-red-100 text-red-800 border-red-200" },
};

export function ProctorQueuePage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useGetPendingFlagsQuery({
    page,
    limit: CONSTANTS.PAGINATION.DEFAULT_LIMIT,
  });
  const [reviewFlag] = useReviewFlagMutation();

  const getErrorMessage = () => {
    if (!isError) return null;
    if (typeof error === "object" && error && "data" in error) {
      return (
        (error as { data?: { message?: string } }).data?.message ||
        "Failed to load review queue"
      );
    }
    return "An unexpected error occurred while loading the queue.";
  };

  const errorMessage = getErrorMessage();
  const flags = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  const handleApprove = (flagId: string) => {
    reviewFlag({ flagId, status: "APPROVED" });
  };

  const handleDismiss = (flagId: string) => {
    reviewFlag({ flagId, status: "DISMISSED" });
  };

  const renderSeverityBadge = (severity: number) => {
    const badge = severityBadgeMap[severity] || severityBadgeMap[1];
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${badge.classes}`}
      >
        {badge.label}
      </span>
    );
  };

  const renderTableRow = (flag: ProctorFlag) => {
    const candidateName = flag.session?.enrollment?.candidate
      ? `${flag.session.enrollment.candidate.firstName} ${flag.session.enrollment.candidate.lastName}`
      : "Unknown";
    const examTitle = flag.session?.enrollment?.exam?.title || "Unknown Exam";

    return (
      <tr
        key={flag.id}
        className="hover:bg-slate-50/80 transition-colors group"
      >
        <td className="px-6 py-4">
          <div className="font-bold text-slate-900">{candidateName}</div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">
            {flag.sessionId.slice(0, 8)}...
          </div>
        </td>
        <td className="px-6 py-4 font-medium text-slate-700">{examTitle}</td>
        <td className="px-6 py-4 text-slate-600">
          {flagTypeLabels[flag.flagType] || flag.flagType}
        </td>
        <td className="px-6 py-4">{renderSeverityBadge(flag.severity)}</td>
        <td className="px-6 py-4 text-slate-500 font-medium">
          {formatDate(flag.createdAt)}
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-600 hover:text-emerald-700"
              onClick={() => handleApprove(flag.id)}
            >
              Approve
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:text-rose-700"
              onClick={() => handleDismiss(flag.id)}
            >
              Dismiss
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  const renderTableRows = () => {
    if (flags.length === 0) {
      return (
        <tr>
          <td
            colSpan={6}
            className="px-6 py-12 text-center text-slate-500 font-medium"
          >
            The queue is empty. No flags require review at this time.
          </td>
        </tr>
      );
    }
    return flags.map(renderTableRow);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">
            Proctor Review Queue
          </h1>
          <p className="text-text-muted mt-1">
            Review flagged exam sessions and candidate anomalies.
          </p>
        </div>
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
                  Candidate
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Exam
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Flag Type
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Severity
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Flagged At
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
    </div>
  );
}

export default ProctorQueuePage;
