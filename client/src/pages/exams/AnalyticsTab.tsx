import { useGetExamAnalyticsQuery } from "@/services/analyticsApi";

interface AnalyticsTabProps {
  examId: string;
}

export default function AnalyticsTab({ examId }: AnalyticsTabProps) {
  const { data, isLoading, isError } = useGetExamAnalyticsQuery({ examId });

  const analytics = data?.data || [];

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

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6">
        {analytics.map((item, index) => (
          <div
            key={item.questionId}
            className="border border-border rounded-xl overflow-hidden bg-white shadow-sm"
          >
            <div
              className={`p-4 border-b flex items-center justify-between ${item.flaggedForReview ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100"}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center font-bold text-slate-600 text-sm">
                  {index + 1}
                </span>
                <h4 className="font-bold text-slate-800">
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
                    Difficulty Index
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
                    {item.discriminationIndex.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {item.flaggedForReview && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-medium">
                  <strong>Risk:</strong> {item.flagReason}
                </div>
              )}

              {item.distractorAnalysis && item.distractorAnalysis.length > 0 ? (
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
                          <span className="text-slate-900 font-bold">
                            {dist.selectionPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${dist.selectionPercentage > 50 ? "bg-primary-500" : "bg-slate-400"}`}
                            style={{ width: `${dist.selectionPercentage}%` }}
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
          </div>
        ))}
      </div>
    </div>
  );
}
