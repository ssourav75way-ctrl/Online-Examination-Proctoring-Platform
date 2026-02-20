import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetQuestionsByPoolQuery,
  useGetQuestionPoolByIdQuery,
} from "@/services/questionApi";
import { Button } from "@/components/common/Button";
import { useSelector } from "react-redux";
import { QuestionFormModal } from "./QuestionFormModal";
import { VersionHistoryModal } from "./VersionHistoryModal";

const typeBadgeMap: Record<string, { label: string; classes: string }> = {
  MCQ: {
    label: "MCQ",
    classes: "bg-blue-50 text-blue-700 border-blue-200",
  },
  MULTI_SELECT: {
    label: "Multi-Select",
    classes: "bg-violet-50 text-violet-700 border-violet-200",
  },
  FILL_BLANK: {
    label: "Fill Blank",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
  SHORT_ANSWER: {
    label: "Short Answer",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  CODE: {
    label: "Code",
    classes: "bg-gray-800 text-gray-100 border-gray-700",
  },
};

const difficultyColor = (d: number) => {
  if (d <= 3) return "bg-green-100 text-green-800";
  if (d <= 6) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
};

import { RootState } from "@/store";
import { Question } from "@/types/exam";

export function QuestionListPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const [topicFilter, setTopicFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const user = useSelector((state: RootState) => state.auth.user);
  const institutionId = user?.institutionMembers?.[0]?.institution?.id || "";

  const { data: poolData } = useGetQuestionPoolByIdQuery(
    { institutionId, poolId: poolId as string },
    { skip: !poolId || !institutionId },
  );

  const { data, isLoading, isError, refetch } = useGetQuestionsByPoolQuery(
    {
      institutionId,
      poolId: poolId as string,
      page,
      limit: 15,
      ...(topicFilter ? { topic: topicFilter } : {}),
      ...(typeFilter ? { type: typeFilter } : {}),
    },
    { skip: !poolId || !institutionId },
  );

  const questions: Question[] = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;
  const total = data?.meta?.total || 0;
  const pool = poolData?.data;

  const allTopics = [
    ...new Set(questions.map((q: Question) => q.topic)),
  ].filter(Boolean);

  const handleModalClose = () => {
    setIsModalOpen(false);
    refetch();
  };

  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/dashboard/questions")}
          >
            &larr; Pools
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-main">
              {pool?.name || "Question Bank"}
            </h1>
            <p className="text-text-muted text-sm mt-0.5">
              {pool?.description || "Manage questions in this pool"} &middot;{" "}
              <strong>{total}</strong> question{total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Add Question</Button>
      </div>

      {}
      <div className="flex gap-3 flex-wrap items-center">
        <select
          className="h-9 px-3 rounded-lg bg-white border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Types</option>
          <option value="MCQ">MCQ</option>
          <option value="MULTI_SELECT">Multi-Select</option>
          <option value="FILL_BLANK">Fill Blank</option>
          <option value="SHORT_ANSWER">Short Answer</option>
          <option value="CODE">Code</option>
        </select>

        <input
          type="text"
          placeholder="Filter by topic..."
          className="h-9 px-3 rounded-lg bg-white border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 w-48"
          value={topicFilter}
          onChange={(e) => {
            setTopicFilter(e.target.value);
            setPage(1);
          }}
        />

        {(topicFilter || typeFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTopicFilter("");
              setTypeFilter("");
              setPage(1);
            }}
          >
            Clear Filters
          </Button>
        )}

        {}
        {!topicFilter && allTopics.length > 0 && (
          <div className="flex gap-1.5 ml-2">
            {allTopics.slice(0, 6).map((t) => (
              <button
                key={t as string}
                className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-bold border border-primary-100 hover:bg-primary-100 transition-colors"
                onClick={() => {
                  setTopicFilter(t as string);
                  setPage(1);
                }}
              >
                {t as string}
              </button>
            ))}
          </div>
        )}
      </div>

      {}
      {isLoading && (
        <div className="card p-8 flex justify-center items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
        </div>
      )}

      {}
      {isError && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          Failed to load questions. Ensure you have access to this pool.
        </div>
      )}

      {}
      {!isLoading && !isError && (
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 font-semibold w-[40%]">
                  Question Content
                </th>
                <th className="px-4 py-3.5 font-semibold">Topic</th>
                <th className="px-4 py-3.5 font-semibold">Type</th>
                <th className="px-4 py-3.5 font-semibold text-center">
                  Difficulty
                </th>
                <th className="px-4 py-3.5 font-semibold text-center">Marks</th>
                <th className="px-4 py-3.5 font-semibold text-center">
                  Version
                </th>
                <th className="px-4 py-3.5 font-semibold text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {questions.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-16 text-center text-slate-400"
                  >
                    <div className="space-y-3">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                        <svg
                          className="w-7 h-7 text-slate-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <p className="font-bold text-slate-600">
                        No questions yet
                      </p>
                      <p className="text-sm">
                        Click <strong>"+ Add Question"</strong> to create your
                        first question in this pool.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                questions.map((q: any) => {
                  const v =
                    q.versions?.[0] || q.latestVersion || q.currentVersion;
                  const badge = typeBadgeMap[q.type] || typeBadgeMap["MCQ"];
                  const difficulty = v?.difficulty || 1;
                  const versionNumber = v?.versionNumber || 1;

                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900 line-clamp-2 leading-snug">
                          {v?.content || ""}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-50 text-primary-700 border border-primary-100">
                          {q.topic}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold border ${badge.classes}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black ${difficultyColor(difficulty)}`}
                        >
                          {difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-slate-700">
                        {v?.marks || ""}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          v{versionNumber}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary-600 h-8 text-[10px]"
                            onClick={() => {
                              setSelectedQuestionId(q.id);
                              setIsHistoryOpen(true);
                            }}
                          >
                            History
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-600 h-8 text-[10px]"
                          >
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-500">
              Showing{" "}
              <strong>
                {questions.length === 0 ? 0 : (page - 1) * 15 + 1}
                {Math.min(page * 15, total)}
              </strong>{" "}
              of <strong>{total}</strong> questions
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="bg-white border-slate-200"
              >
                Prev
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="bg-white border-slate-200"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {}
      {isModalOpen && poolId && (
        <QuestionFormModal
          institutionId={institutionId}
          poolId={poolId}
          onClose={handleModalClose}
        />
      )}

      {isHistoryOpen && selectedQuestionId && (
        <VersionHistoryModal
          institutionId={institutionId}
          questionId={selectedQuestionId}
          onClose={() => {
            setIsHistoryOpen(false);
            setSelectedQuestionId(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

export default QuestionListPage;
