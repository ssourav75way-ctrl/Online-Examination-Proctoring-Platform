import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetQuestionPoolsQuery, QuestionPool } from "@/services/questionApi";
import { Button } from "@/components/common/Button";
import { CONSTANTS } from "@/constants";
import { QuestionPoolFormModal } from "./QuestionPoolFormModal";
import { useState } from "react";

type RootState = {
  auth: {
    user: { institutionMembers?: { institution: { id: string } }[] } | null;
  };
};

export function QuestionPoolListPage() {
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const departmentId = searchParams.get("departmentId") || undefined;
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const user = useSelector((state: RootState) => state.auth.user);
  const institutionId = user?.institutionMembers?.[0]?.institution?.id || "";

  const { data, isLoading, isError, error } = useGetQuestionPoolsQuery(
    {
      institutionId,
      page,
      limit: CONSTANTS.PAGINATION.DEFAULT_LIMIT,
      departmentId,
    },
    { skip: !institutionId },
  );

  const getErrorMessage = () => {
    if (!institutionId)
      return "No institution context found. Please ensure you are assigned to an institution.";
    if (!isError) return null;
    if (typeof error === "object" && error && "data" in error) {
      return (
        (error as { data?: { message?: string } }).data?.message ||
        "Failed to load question pools"
      );
    }
    return "An unexpected error occurred while loading question pools.";
  };

  const errorMessage = getErrorMessage();
  const pools = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  const renderStatusBadge = (isActive: boolean) => {
    const activeClasses = isActive
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : "bg-rose-100 text-rose-800 border-rose-200";
    const label = isActive ? "Active" : "Inactive";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${activeClasses}`}
      >
        {label}
      </span>
    );
  };

  const renderTableRow = (pool: QuestionPool) => (
    <tr key={pool.id} className="hover:bg-slate-50/80 transition-colors group">
      <td className="px-6 py-4 font-medium text-slate-900">{pool.name}</td>
      <td className="px-6 py-4 text-slate-500">{pool.description || "—"}</td>
      <td className="px-6 py-4">{renderStatusBadge(pool.isActive)}</td>
      <td className="px-6 py-4 text-right">
        <Button
          variant="ghost"
          size="sm"
          className="text-primary-600 hover:text-primary-700 opacity-0 group-hover:opacity-100 tracking-wide transition-opacity"
          onClick={() => navigate(`/dashboard/questions/${pool.id}`)}
        >
          View Questions
        </Button>
      </td>
    </tr>
  );

  const renderTableRows = () => {
    if (pools.length === 0) {
      return (
        <tr>
          <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
            No question pools found. Click &quot;Create Pool&quot; to add one.
          </td>
        </tr>
      );
    }
    return pools.map(renderTableRow);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Question Pools</h1>
          <p className="text-text-muted mt-1">
            Manage banks of questions categorized by topic and department.
          </p>
        </div>
        <div className="flex gap-2">
          {departmentId && (
            <Button variant="ghost" onClick={() => setSearchParams({})}>
              Clear Filter
            </Button>
          )}
          <Button onClick={() => setIsModalOpen(true)}>Create Pool</Button>
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
                  Name
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Description
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
        <QuestionPoolFormModal
          institutionId={institutionId}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

export default QuestionPoolListPage;
