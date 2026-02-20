import { useState } from "react";
import { Button } from "@/components/common/Button";
import {
  useGetQuestionPoolsQuery,
  useGetQuestionsByPoolQuery,
} from "@/services/questionApi";
import { useAddQuestionsToExamMutation } from "@/services/examApi";

interface ExamQuestionPickerProps {
  institutionId: string;
  examId: string;
  onClose: () => void;
}

const typeBadge: Record<string, { label: string; cls: string }> = {
  MCQ: { label: "MCQ", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  MULTI_SELECT: {
    label: "Multi",
    cls: "bg-violet-50 text-violet-700 border-violet-200",
  },
  FILL_BLANK: {
    label: "Fill",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  SHORT_ANSWER: {
    label: "Short",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  CODE: { label: "Code", cls: "bg-gray-800 text-gray-100 border-gray-700" },
};

const diffColor = (d: number) => {
  if (d <= 3) return "bg-green-100 text-green-800";
  if (d <= 6) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
};

export function ExamQuestionPicker({
  institutionId,
  examId,
  onClose,
}: ExamQuestionPickerProps) {
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [apiError, setApiError] = useState("");

  const { data: poolData, isLoading: poolsLoading } = useGetQuestionPoolsQuery(
    { institutionId, page: 1, limit: 50 },
    { skip: !institutionId },
  );

  const { data: questionsData, isLoading: questionsLoading } =
    useGetQuestionsByPoolQuery(
      { institutionId, poolId: selectedPoolId as string, page: 1, limit: 100 },
      { skip: !selectedPoolId || !institutionId },
    );

  const [addQuestions, { isLoading: isAdding }] =
    useAddQuestionsToExamMutation();

  const pools = poolData?.data || [];
  const questions = questionsData?.data || [];

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const ids = questions.map((q: any) => q.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id: string) => next.add(id));
      return next;
    });
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;
    setApiError("");
    try {
      await addQuestions({
        institutionId,
        examId,
        questionIds: [...selectedIds],
      }).unwrap();
      onClose();
    } catch (err: any) {
      setApiError(
        err?.data?.message || "Failed to add questions. Please try again.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-text-main">
              Add Questions to Exam
            </h2>
            <p className="text-sm text-text-muted mt-0.5">
              Select a pool, then pick individual questions. Questions are
              pinned to their current version.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main text-xl"
          >
            
          </button>
        </div>

        {}
        <div className="flex flex-1 overflow-hidden">
          {}
          <div className="w-56 border-r border-border overflow-y-auto bg-slate-50 shrink-0">
            <div className="p-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Question Pools
              </p>
              {poolsLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
                </div>
              ) : pools.length === 0 ? (
                <p className="text-xs text-slate-400 p-2">
                  No pools found. Create a pool first.
                </p>
              ) : (
                pools.map((pool: any) => (
                  <button
                    key={pool.id}
                    onClick={() => setSelectedPoolId(pool.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${
                      selectedPoolId === pool.id
                        ? "bg-primary-100 text-primary-800 border border-primary-200"
                        : "hover:bg-white text-slate-700"
                    }`}
                  >
                    <div className="font-bold truncate">{pool.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {pool._count?.questions ?? "?"} questions
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {}
          <div className="flex-1 overflow-y-auto p-4">
            {!selectedPoolId ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                 Select a pool to browse questions
              </div>
            ) : questionsLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center text-slate-400 py-12 text-sm">
                No questions in this pool. Add some from the Question Bank
                first.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-500">
                    {questions.length} question(s) found
                  </span>
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                </div>
                <div className="space-y-2">
                  {questions.map((q: any) => {
                    const v =
                      q.versions?.[0] || q.latestVersion || q.currentVersion;
                    const badge = typeBadge[q.type] || typeBadge["MCQ"];
                    const isSelected = selectedIds.has(q.id);
                    return (
                      <label
                        key={q.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary-400 bg-primary-50 ring-2 ring-primary-200"
                            : "border-border hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggle(q.id)}
                          className="mt-1 w-4 h-4 text-primary-600 focus:ring-primary-500 rounded border-slate-300"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 line-clamp-2">
                            {v?.content || "No content"}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-xs font-bold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-100">
                              {q.topic}
                            </span>
                            <span
                              className={`text-xs font-bold px-1.5 py-0.5 rounded border ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                            <span
                              className={`text-xs font-bold px-1.5 py-0.5 rounded ${diffColor(v?.difficulty || 1)}`}
                            >
                              D:{v?.difficulty || "?"}
                            </span>
                            <span className="text-xs text-slate-400">
                              {v?.marks || 0} marks
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              v{v?.versionNumber || 1}
                            </span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {}
        <div className="px-6 py-4 border-t border-border bg-slate-50 rounded-b-2xl flex items-center justify-between">
          <div className="text-sm text-slate-500">
            <strong>{selectedIds.size}</strong> question(s) selected
          </div>
          {apiError && (
            <p className="text-sm text-red-600 font-medium">{apiError}</p>
          )}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isAdding}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              isLoading={isAdding}
              disabled={selectedIds.size === 0}
              className="px-6"
            >
              Add {selectedIds.size} Question(s) to Exam
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
