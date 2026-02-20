import { useGetMyResultsQuery } from "@/services/resultApi";
import { Button } from "@/components/common/Button";

export function ResultsHistoryPage() {
  const { data, isLoading, isError } = useGetMyResultsQuery();

  const results = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Results History</h1>
          <p className="text-text-muted mt-1">
            Review your past examination performance.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="card p-8 flex justify-center items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
        </div>
      )}

      {isError && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          Failed to load results history.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.length === 0 ? (
            <div className="col-span-full card p-12 text-center text-slate-500">
              No results found. Complete an exam to see your scores here.
            </div>
          ) : (
            results.map((result: any) => (
              <div
                key={result.id}
                className="card p-6 border border-border/60 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-text-main">
                    {result.enrollment?.exam?.title || "Exam Result"}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${result.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {result.percentage}%
                  </span>
                </div>
                <div className="space-y-2 text-sm text-text-muted">
                  <p>
                    Score: {result.totalScore} / {result.maxScore}
                  </p>
                  <p>
                    Completed: {new Date(result.createdAt).toLocaleDateString()}
                  </p>
                  <p>
                    Status:{" "}
                    <span className="capitalize">
                      {result.status?.replace("_", " ").toLowerCase()}
                    </span>
                  </p>
                </div>
                <div className="mt-6">
                  <Button variant="secondary" size="sm" className="w-full">
                    View Detailed Report
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default ResultsHistoryPage;
