import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInstitution } from "@/contexts/InstitutionContext";
import { Button } from "@/components/common/Button";
import {
  useGetExamResultsQuery,
  useGenerateResultsMutation,
  usePublishResultsMutation,
  useGetReEvaluationRequestsQuery,
  useProcessReEvaluationMutation,
} from "@/services/resultApi";
import { useGetExamByIdQuery } from "@/services/examApi";
import { formatDateIST } from "@/utils/dateFormat";
import AnalyticsTab from "./AnalyticsTab";
import IntegrityTab from "./IntegrityTab";

export default function ExamResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { institutionId } = useInstitution();

  const [activeTab, setActiveTab] = useState<
    "results" | "requests" | "analytics" | "integrity"
  >("results");
  const [page] = useState(1);
  const [reqPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const { data: examData } = useGetExamByIdQuery(
    { institutionId, examId: id as string },
    { skip: !id || !institutionId },
  );

  const {
    data: resultsData,
    isLoading: resLoading,
    refetch: refetchResults,
  } = useGetExamResultsQuery(
    { examId: id as string, page, limit: 10 },
    { skip: !id },
  );

  const {
    data: requestsData,
    isLoading: reqLoading,
    refetch: refetchRequests,
  } = useGetReEvaluationRequestsQuery(
    { examId: id as string, page: reqPage, limit: 10 },
    { skip: !id },
  );

  const [generateResults, { isLoading: isGenerating }] =
    useGenerateResultsMutation();
  const [publishResults, { isLoading: isPublishing }] =
    usePublishResultsMutation();
  const [processRequest] = useProcessReEvaluationMutation();

  const exam = examData?.data;
  const results = resultsData?.data || [];
  const requests = requestsData?.data || [];

  const handleGenerate = async () => {
    if (!id) return;
    try {
      await generateResults({ examId: id }).unwrap();
      refetchResults();
    } catch (err) {
      console.error("Failed to generate results:", err);
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    try {
      await publishResults({ examId: id }).unwrap();
      refetchResults();
    } catch (err) {
      console.error("Failed to publish results:", err);
    }
  };

  const handleProcessRequest = async (
    requestId: string,
    status: "APPROVED" | "REJECTED",
  ) => {
    setIsProcessing(requestId);
    try {
      let newScore;
      let reviewNotes = "";
      if (status === "APPROVED") {
        const scoreInput = prompt("Enter new score for this question:");
        if (scoreInput === null) return;
        newScore = Number(scoreInput);
        if (isNaN(newScore)) return alert("Invalid score");
        reviewNotes = prompt("Enter review notes (optional):") || "";
      } else {
        reviewNotes = prompt("Enter reason for rejection:") || "";
      }

      await processRequest({
        requestId,
        status,
        newScore,
        reviewNotes,
      }).unwrap();
      refetchRequests();
    } catch (err) {
      console.error("Failed to process request:", err);
    } finally {
      setIsProcessing(null);
    }
  };

  const hasPendingResults = results.some((r) => r.status === "PENDING_REVIEW");
  const allResultsPublished =
    results.length > 0 && results.every((r) => r.status === "PUBLISHED");

  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/dashboard/exams/${id}`)}
          >
            &larr; Back to Exam
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-main">
              Results: {exam?.title || "Loading..."}
            </h1>
            <p className="text-text-muted mt-1 text-sm">
              Manage exam results and candidate re-evaluation requests
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {exam?.status === "COMPLETED" && (
            <Button onClick={handleGenerate} isLoading={isGenerating}>
              Generate / Refresh Results
            </Button>
          )}
          {hasPendingResults && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handlePublish}
              isLoading={isPublishing}
            >
              Publish Results
            </Button>
          )}
        </div>
      </div>

      {allResultsPublished && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"></div>
          <div>
            <p className="text-sm font-bold text-emerald-800">
              Results Published
            </p>
            <p className="text-sm text-emerald-700">
              Candidates can now view their scores and submit re-evaluation
              requests.
            </p>
          </div>
        </div>
      )}

      {}
      <div className="flex gap-4 border-b border-border">
        <button
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "results"
              ? "border-primary-600 text-primary-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setActiveTab("results")}
        >
          Exam Results ({resultsData?.meta?.total || 0})
        </button>
        <button
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "requests"
              ? "border-primary-600 text-primary-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setActiveTab("requests")}
        >
          Re-evaluation Requests ({requestsData?.meta?.total || 0})
        </button>
        <button
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "analytics"
              ? "border-primary-600 text-primary-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setActiveTab("analytics")}
        >
          Psychometric Analytics
        </button>
        <button
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "integrity"
              ? "border-primary-600 text-primary-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setActiveTab("integrity")}
        >
          ️ Integrity Report
        </button>
      </div>

      {}
      <div className="card p-6 border border-border/60 shadow-sm bg-white">
        {activeTab === "results" ? (
          <div>
            {}
            {resLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                No results generated yet. Click "Generate" to calculate scores.
              </div>
            ) : (
              <div className="overflow-x-auto">
                {}
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Candidate</th>
                      <th className="px-4 py-3 font-semibold text-center">
                        Score
                      </th>
                      <th className="px-4 py-3 font-semibold text-center">%</th>
                      <th className="px-4 py-3 font-semibold text-center">
                        Integrity
                      </th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Published</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {results.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">
                            {r.enrollment?.candidate?.firstName}{" "}
                            {r.enrollment?.candidate?.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {r.enrollment?.candidate?.email}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center font-mono">
                          {r.totalScore}/{r.maxScore}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`font-bold ${r.passed ? "text-emerald-600" : "text-rose-600"}`}
                          >
                            {r.percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.integrityScore != null ? (
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${r.integrityScore >= 90 ? "bg-emerald-100 text-emerald-700" : r.integrityScore >= 70 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}
                            >
                              {r.integrityScore}%
                            </span>
                          ) : (
                            ""
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.status === "PUBLISHED" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"}`}
                          >
                            {r.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {r.publishedAt ? formatDateIST(r.publishedAt) : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === "requests" ? (
          <div>
            {reqLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                No re-evaluation requests found.
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="border border-border rounded-xl p-4 bg-slate-50/50"
                  >
                    {}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${req.status === "PENDING" ? "bg-amber-100 text-amber-700" : req.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                        >
                          {req.status}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">
                          Requested at: {formatDateIST(req.createdAt)}
                        </p>
                      </div>
                      {req.status === "PENDING" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="danger"
                            isLoading={isProcessing === req.id}
                            onClick={() =>
                              handleProcessRequest(req.id, "REJECTED")
                            }
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            isLoading={isProcessing === req.id}
                            onClick={() =>
                              handleProcessRequest(req.id, "APPROVED")
                            }
                          >
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm">
                      <strong>Justification:</strong> {req.justification}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "analytics" ? (
          <AnalyticsTab examId={id as string} />
        ) : (
          <IntegrityTab examId={id as string} />
        )}
      </div>
    </div>
  );
}
