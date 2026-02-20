import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetQuestionsByPoolQuery } from "@/services/questionApi";
import { Button } from "@/components/common/Button";

export function QuestionListPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const user = useSelector((state: any) => state.auth.user);
  const institutionId = user?.institutionMembers?.[0]?.institution?.id || "";

  const { data, isLoading, isError } = useGetQuestionsByPoolQuery(
    { institutionId, poolId: poolId as string, page, limit: 10 },
    { skip: !poolId || !institutionId },
  );

  const questions = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/dashboard/questions")}
          >
            &larr; Back to Pools
          </Button>
          <h1 className="text-2xl font-bold text-text-main">Questions</h1>
        </div>
        <Button>Add Question</Button>
      </div>

      {isLoading && (
        <div className="card p-8 flex justify-center items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
        </div>
      )}

      {isError && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          Failed to load questions.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Content</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {questions.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No questions in this pool.
                  </td>
                </tr>
              ) : (
                questions.map((q: any) => (
                  <tr
                    key={q.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900 line-clamp-1">
                        {q.content}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                        {q.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary-600"
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-border flex justify-between items-center">
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
                  Prev
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
        </div>
      )}
    </div>
  );
}

import { useSelector } from "react-redux";
export default QuestionListPage;
