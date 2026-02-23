import { useState } from "react";
import {
  useGetCandidateResultQuery,
  useFileReEvaluationMutation,
  ReEvaluationRequest,
} from "@/services/resultApi";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";

interface CandidateResultDetailProps {
  enrollmentId: string;
  onBack: () => void;
}

export function CandidateResultDetail({
  enrollmentId,
  onBack,
}: CandidateResultDetailProps) {
  const { data, isLoading, isError } = useGetCandidateResultQuery({
    enrollmentId,
  });
  const [fileReEvaluation, { isLoading: isFiling }] =
    useFileReEvaluationMutation();
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [justification, setJustification] = useState("");

  if (isLoading) {
    return (
      <div className="card p-8 flex justify-center items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
        <p>Failed to load detailed report.</p>
        <Button onClick={onBack} variant="secondary" className="mt-4">
          Back to Results
        </Button>
      </div>
    );
  }

  const result = data.data;

  const handleFileReEvaluation = async () => {
    if (!selectedAnswerId || !justification.trim() || !result.id) return;
    try {
      await fileReEvaluation({
        resultId: result.id,
        candidateAnswerId: selectedAnswerId,
        justification,
      }).unwrap();
      setSelectedAnswerId(null);
      setJustification("");
      alert("Re-evaluation request submitted successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to string re-evaluation request.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="secondary" size="sm">
          &larr; Back
        </Button>
        <h2 className="text-xl font-bold">
          Detailed Report: {result.enrollment?.exam?.title}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 border border-border/60">
          <p className="text-sm text-text-muted">Total Score</p>
          <p className="text-2xl font-bold">
            {result.totalScore} / {result.maxScore}
          </p>
        </div>
        <div className="card p-6 border border-border/60">
          <p className="text-sm text-text-muted">Percentage</p>
          <p className="text-2xl font-bold">{result.percentage}%</p>
        </div>
        <div className="card p-6 border border-border/60">
          <p className="text-sm text-text-muted">Status</p>
          <p
            className={`text-xl font-bold ${result.passed ? "text-green-600" : "text-red-600"}`}
          >
            {result.passed ? "PASSED" : "FAILED"}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold">Question Breakdown</h3>
        {result.answers?.map((answer, index) => {
          const qv = answer.examQuestion.questionVersion;
          const pendingRequest = answer.reEvaluationRequests?.find(
            (r: ReEvaluationRequest) => r.status === "PENDING",
          );

          return (
            <div key={answer.id} className="card p-6 border border-border/60">
              <div className="flex justify-between items-start mb-4">
                <span className="font-bold">Question {index + 1}</span>
                <span className="font-bold text-primary-700">
                  {answer.finalScore ?? answer.autoScore ?? 0} / {qv.marks}{" "}
                  marks
                </span>
              </div>
              <p
                className="mb-4"
                dangerouslySetInnerHTML={{ __html: qv.content }}
              ></p>

              <div className="bg-slate-50 p-4 rounded-md mb-4 border border-slate-200">
                <p className="text-sm text-slate-500 mb-1">Your Answer:</p>
                {answer.answerContent ? (
                  <p>{answer.answerContent}</p>
                ) : answer.codeSubmission ? (
                  <pre className="text-xs bg-slate-800 text-slate-100 p-2 rounded">
                    {answer.codeSubmission}
                  </pre>
                ) : (
                  <p className="italic text-slate-400">No answer provided</p>
                )}
              </div>

              {result.canChallenge && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  {pendingRequest ? (
                    <span className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded">
                      Re-evaluation Pending
                    </span>
                  ) : selectedAnswerId === answer.id ? (
                    <div className="space-y-4">
                      <Input
                        label="Justification for Re-evaluation"
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        placeholder="Explain why you think your score should be different..."
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleFileReEvaluation}
                          disabled={isFiling || !justification.trim()}
                        >
                          {isFiling ? "Submitting..." : "Submit Request"}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedAnswerId(null);
                            setJustification("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedAnswerId(answer.id)}
                    >
                      Request Re-evaluation
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {result.answers?.length === 0 && (
          <p className="text-text-muted italic">
            No answers recorded for this exam.
          </p>
        )}
      </div>
    </div>
  );
}
