import { useState, useMemo } from "react";
import { useGetExamAnalyticsQuery } from "@/services/analyticsApi";

interface AnalyticsTabProps {
  examId: string;
}

type FilterMode = "all" | "flagged" | "good";

export default function AnalyticsTab({ examId }: AnalyticsTabProps) {
  const { data, isLoading, isError } = useGetExamAnalyticsQuery({ examId });
  const [filter, setFilter] = useState<FilterMode>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const analytics = data?.data || [];

  const filtered = useMemo(() => {
    switch (filter) {
      case "flagged":
        return analytics.filter((a) => a.flaggedForReview);
      case "good":
        return analytics.filter((a) => !a.flaggedForReview);
      default:
        return analytics;
    }
  }, [analytics, filter]);

  const stats = useMemo(() => {
    if (analytics.length === 0)
      return {
        avgDifficulty: 0,
        avgDiscrimination: 0,
        flaggedCount: 0,
        goodCount: 0,
      };
    const avgDifficulty =
      analytics.reduce((s, a) => s + a.difficultyIndex, 0) / analytics.length;
    const avgDiscrimination =
      analytics.reduce((s, a) => s + a.discriminationIndex, 0) /
      analytics.length;
    const flaggedCount = analytics.filter((a) => a.flaggedForReview).length;
    return {
      avgDifficulty,
      avgDiscrimination,
      flaggedCount,
      goodCount: analytics.length - flaggedCount,
    };
  }, [analytics]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-rose-600 font-medium">
        Failed to load psychometric analytics. Ensure results have been
        generated.
      </div>
    );
  }

  if (analytics.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        No analytics data available yet.
      </div>
    );
  }

  const filterBtn = (mode: FilterMode, label: string, count?: number) => (
    <button
      onClick={() => setFilter(mode)}
      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
        filter === mode
          ? "bg-primary-600 text-white shadow-sm"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
      {count !== undefined && (
        <span
          className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${
            filter === mode
              ? "bg-white/20 text-white"
              : "bg-slate-200 text-slate-500"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Total Questions
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {analytics.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Avg. Difficulty
          </p>
          <p className="text-2xl font-black text-primary-600 mt-1">
            {(stats.avgDifficulty * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {stats.avgDifficulty < 0.4
              ? "Hard overall"
              : stats.avgDifficulty > 0.7
                ? "Easy overall"
                : "Balanced"}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Avg. Discrimination
          </p>
          <p
            className={`text-2xl font-black mt-1 ${stats.avgDiscrimination >= 0.3 ? "text-emerald-600" : stats.avgDiscrimination >= 0.2 ? "text-amber-600" : "text-rose-600"}`}
          >
            {stats.avgDiscrimination.toFixed(3)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {stats.avgDiscrimination >= 0.3
              ? "Good discrimination"
              : "Needs attention"}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Flagged for Review
          </p>
          <p
            className={`text-2xl font-black mt-1 ${stats.flaggedCount > 0 ? "text-amber-600" : "text-emerald-600"}`}
          >
            {stats.flaggedCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {stats.goodCount} performing well
          </p>
        </div>
      </div>

      {/* Difficulty Distribution Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
          Difficulty Distribution
        </p>
        <div className="flex gap-1 h-8">
          {[...analytics]
            .sort((a, b) => a.difficultyIndex - b.difficultyIndex)
            .map((item) => (
              <div
                key={item.questionId}
                className={`flex-1 rounded transition-all cursor-pointer hover:opacity-80 ${
                  item.difficultyIndex < 0.3
                    ? "bg-rose-400"
                    : item.difficultyIndex < 0.5
                      ? "bg-amber-400"
                      : item.difficultyIndex < 0.7
                        ? "bg-emerald-400"
                        : "bg-blue-400"
                }`}
                title={`Q: ${item.questionId.slice(0, 8)}… — ${(item.difficultyIndex * 100).toFixed(1)}% correct`}
              />
            ))}
        </div>
        <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-semibold">
          <span>Hardest</span>
          <span className="flex gap-4">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-rose-400" /> &lt;30%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-amber-400" /> 30-50%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-emerald-400" /> 50-70%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-blue-400" /> &gt;70%
            </span>
          </span>
          <span>Easiest</span>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {filterBtn("all", "All Questions", analytics.length)}
        {filterBtn("flagged", "⚠ Flagged", stats.flaggedCount)}
        {filterBtn("good", "✓ Good", stats.goodCount)}
      </div>

      {/* Question Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.map((item, index) => {
          const isExpanded = expandedId === item.questionId;
          return (
            <div
              key={item.questionId}
              className={`border rounded-xl overflow-hidden bg-white shadow-sm transition-shadow hover:shadow-md ${
                item.flaggedForReview ? "border-amber-200" : "border-border"
              }`}
            >
              {/* Header */}
              <button
                onClick={() =>
                  setExpandedId(isExpanded ? null : item.questionId)
                }
                className={`w-full p-4 border-b flex items-center justify-between ${item.flaggedForReview ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100"}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center font-bold text-slate-600 text-sm">
                    {index + 1}
                  </span>
                  <h4 className="font-bold text-slate-800 text-left">
                    Question ID: {item.questionId.split("-")[0]}...
                  </h4>
                  {item.flaggedForReview && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-black uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                      Review Flagged
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      Difficulty
                    </p>
                    <p
                      className={`text-lg font-black ${item.difficultyIndex < 0.3 ? "text-rose-600" : item.difficultyIndex > 0.8 ? "text-emerald-600" : "text-slate-900"}`}
                    >
                      {(item.difficultyIndex * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right border-l border-slate-200 pl-6">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      Discrimination
                    </p>
                    <p
                      className={`text-lg font-black ${item.discriminationIndex < 0.2 ? "text-amber-600" : "text-primary-600"}`}
                    >
                      {item.discriminationIndex.toFixed(3)}
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-6 space-y-4">
                  {item.flaggedForReview && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-medium">
                      <strong>Risk:</strong> {item.flagReason}
                    </div>
                  )}

                  {/* Interpretation Guidance */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="font-bold text-slate-700 mb-1">
                        Difficulty Index Interpretation
                      </p>
                      <p className="text-slate-500">
                        {item.difficultyIndex < 0.2
                          ? "Very hard — less than 20% got it right. Consider simplifying."
                          : item.difficultyIndex < 0.4
                            ? "Challenging — only strong candidates succeed."
                            : item.difficultyIndex < 0.6
                              ? "Moderate — ideal range for most assessments."
                              : item.difficultyIndex < 0.8
                                ? "Easy — most candidates answer correctly."
                                : "Very easy — over 80% correct. Consider removing or raising difficulty."}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="font-bold text-slate-700 mb-1">
                        Discrimination Index Interpretation
                      </p>
                      <p className="text-slate-500">
                        {item.discriminationIndex >= 0.4
                          ? "Excellent — strongly differentiates high vs. low performers."
                          : item.discriminationIndex >= 0.3
                            ? "Good — effectively distinguishes between candidates."
                            : item.discriminationIndex >= 0.2
                              ? "Fair — some differentiation but could improve."
                              : item.discriminationIndex >= 0
                                ? "Poor — does not distinguish between ability levels. Review needed."
                                : "Negative — high performers get this wrong more often. Possible ambiguity."}
                      </p>
                    </div>
                  </div>

                  {item.distractorAnalysis &&
                  item.distractorAnalysis.length > 0 ? (
                    <div>
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                        Distractor Analysis (MCQ)
                      </h5>
                      <div className="space-y-3">
                        {item.distractorAnalysis.map((dist) => (
                          <div key={dist.optionId} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-slate-600 truncate max-w-[80%]">
                                {dist.optionText}
                              </span>
                              <span className="text-slate-900 font-bold flex items-center gap-2">
                                {dist.selectionCount} sel.
                                <span className="text-slate-500">
                                  ({dist.selectionPercentage.toFixed(1)}%)
                                </span>
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${dist.selectionPercentage > 50 ? "bg-primary-500" : dist.selectionPercentage > 25 ? "bg-slate-400" : "bg-slate-300"}`}
                                style={{
                                  width: `${dist.selectionPercentage}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-slate-400 text-xs italic">
                      Distractor analysis not applicable for this question type.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
