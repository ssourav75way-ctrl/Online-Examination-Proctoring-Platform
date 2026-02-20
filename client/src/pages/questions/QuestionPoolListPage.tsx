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
  const [poolToEdit, setPoolToEdit] = useState<QuestionPool | undefined>(
    undefined,
  );

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Question Banks</h1>
          <p className="text-text-muted mt-1">
            Manage pools of questions organized by department and topic.
          </p>
        </div>
        <div className="flex gap-2">
          {departmentId && (
            <Button variant="ghost" onClick={() => setSearchParams({})}>
              Clear Filter
            </Button>
          )}
          <Button
            onClick={() => {
              setPoolToEdit(undefined);
              setIsModalOpen(true);
            }}
          >
            + Create Pool
          </Button>
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
        <>
          {pools.length === 0 ? (
            <div className="card p-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <p className="font-bold text-slate-600 text-lg mb-1">
                No question pools yet
              </p>
              <p className="text-sm text-slate-500 mb-6">
                Create your first pool to start building a question bank.
              </p>
              <Button
                onClick={() => {
                  setPoolToEdit(undefined);
                  setIsModalOpen(true);
                }}
              >
                + Create First Pool
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pools.map((pool: QuestionPool) => (
                <div
                  key={pool.id}
                  onClick={() => navigate(`/dashboard/questions/${pool.id}`)}
                  className="card p-6 hover:shadow-md hover:border-primary-300 transition-all duration-200 cursor-pointer group relative overflow-hidden"
                >
                  {}
                  <div
                    className={`absolute top-0 left-0 w-1 h-full ${pool.isActive ? "bg-emerald-500" : "bg-slate-300"}`}
                  />

                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-700 transition-colors">
                      {pool.name}
                    </h3>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPoolToEdit(pool);
                          setIsModalOpen(true);
                        }}
                        className="text-slate-400 hover:text-primary-600 transition-colors"
                        title="Edit Pool"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${pool.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}
                      >
                        {pool.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-10">
                    {pool.description || "No description provided."}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="w-4 h-4 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm font-bold text-slate-600">
                        {pool._count?.questions ?? ""} questions
                      </span>
                    </div>
                    {pool.isShared && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                        Shared
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {pools.length > 0 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <QuestionPoolFormModal
          institutionId={institutionId}
          onClose={() => setIsModalOpen(false)}
          poolToEdit={poolToEdit}
        />
      )}
    </div>
  );
}

export default QuestionPoolListPage;
