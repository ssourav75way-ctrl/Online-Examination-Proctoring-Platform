import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import {
  useStartSessionMutation,
  useSubmitAnswerMutation,
  useFinishSessionMutation,
  useReportViolationMutation,
  useLazyGetSessionStatusQuery,
} from "@/services/sessionApi";

export function ExamSessionPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const [startSession] = useStartSessionMutation();
  const [submitAnswer] = useSubmitAnswerMutation();
  const [finishSession, { isLoading: isSubmitting }] =
    useFinishSessionMutation();
  const [reportViolation] = useReportViolationMutation();
  const [getSessionStatus] = useLazyGetSessionStatusQuery();

  const [sessionId, _setSessionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(3600);
  const cameraActive = true;

  // Tick countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll session status for server-authoritative time
  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(async () => {
      try {
        const result = await getSessionStatus({ sessionId }).unwrap();
        if (result?.data?.remainingSeconds !== undefined) {
          setTimeLeft(result.data.remainingSeconds);
        }
      } catch {
        // Silently handle sync failures
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [sessionId, getSessionStatus]);

  // Report tab switch violations
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && sessionId) {
      reportViolation({ sessionId, type: "TAB_SWITCH" });
    }
  }, [sessionId, reportViolation]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [handleVisibilityChange]);

  const handleManualSubmit = async () => {
    if (!sessionId) {
      navigate("/dashboard");
      return;
    }
    try {
      await finishSession({ sessionId }).unwrap();
      navigate("/dashboard");
    } catch {
      // Error handled by RTK Query
    }
  };

  const currentQuestionType = "multiple_choice";

  const questionRenderer: Record<string, () => JSX.Element> = {
    multiple_choice: () => (
      <div className="space-y-4">
        <label className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-surface cursor-pointer">
          <input
            type="radio"
            name="answer"
            value="a"
            className="w-5 h-5 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-text-main">Option A: Detailed explanation</span>
        </label>
        <label className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-surface cursor-pointer">
          <input
            type="radio"
            name="answer"
            value="b"
            className="w-5 h-5 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-text-main">Option B: Detailed explanation</span>
        </label>
        <label className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-surface cursor-pointer">
          <input
            type="radio"
            name="answer"
            value="c"
            className="w-5 h-5 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-text-main">Option C: Detailed explanation</span>
        </label>
        <label className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-surface cursor-pointer">
          <input
            type="radio"
            name="answer"
            value="d"
            className="w-5 h-5 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-text-main">Option D: Detailed explanation</span>
        </label>
      </div>
    ),
    coding: () => (
      <div className="space-y-4">
        <p className="text-sm text-text-muted">
          Write your code solution below:
        </p>
        <textarea
          className="w-full h-64 p-4 font-mono text-sm bg-gray-900 text-gray-100 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="function solve() { ... }"
        ></textarea>
      </div>
    ),
    descriptive: () => (
      <div className="space-y-4">
        <textarea
          className="w-full h-48 p-4 text-text-main bg-surface border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Type your answer here..."
        ></textarea>
      </div>
    ),
  };

  const renderCurrentQuestion =
    questionRenderer[currentQuestionType] || questionRenderer["descriptive"];

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      {cameraActive && (
        <div className="w-full bg-red-600 text-white text-xs font-bold text-center py-1.5 uppercase tracking-widest fixed top-0 z-50">
          Proctoring Active - You are being recorded
        </div>
      )}

      <header className="w-full h-16 bg-surface border-b border-border shadow-soft flex items-center justify-between px-8 mt-6">
        <div className="flex items-center gap-4">
          <div className="text-lg font-black text-text-main">
            Exam ID: {examId || "EXM-100"}
          </div>
          <div className="flex gap-2">
            <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800 font-bold border border-green-200">
              {sessionId ? "Connected" : "Initializing"}
            </span>
          </div>
        </div>

        <div
          className={`text-2xl font-mono font-bold px-4 py-1 rounded shadow-inner ${timeLeft < 300 ? "bg-red-100 text-red-700 blink-animation" : "bg-primary-100 text-primary-800"}`}
        >
          {formatTime(timeLeft)}
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={handleManualSubmit}
          isLoading={isSubmitting}
        >
          Submit Exam
        </Button>
      </header>

      <main className="w-full max-w-5xl flex gap-8 p-8 flex-1">
        <div className="flex-1 card p-8 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
            <h2 className="text-xl font-bold text-text-main">
              Question 1 of 50
            </h2>
            <span className="text-sm font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
              +4 Marks
            </span>
          </div>

          <div className="prose max-w-none text-text-main mb-8">
            <p className="text-lg font-medium">
              What is the capital of France, and explain its historical
              significance?
            </p>
          </div>

          <div className="flex-1">{renderCurrentQuestion()}</div>

          <div className="flex justify-between items-center pt-8 border-t border-border mt-8">
            <Button variant="secondary" disabled>
              Previous Question
            </Button>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
              >
                Mark for Review
              </Button>
              <Button>Save &amp; Next</Button>
            </div>
          </div>
        </div>

        <aside className="w-72 flex flex-col gap-6">
          <div className="card p-2 bg-gray-900 rounded-xl overflow-hidden aspect-video border-4 border-gray-800 shadow-xl relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-white/50 font-mono text-sm">
                (Camera Feed)
              </span>
            </div>
            <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-red-800 z-10"></div>
          </div>

          <div className="card p-6 flex-1 text-center flex flex-col items-center">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 w-full text-left">
              Navigation Map
            </h3>
            <div className="grid grid-cols-5 gap-2 w-full">
              {Array.from({ length: 20 }, (_, i) => (
                <button
                  key={i}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors 
                    ${i === 0 ? "bg-primary-600 text-white border-primary-700" : "bg-surface text-text-main hover:bg-primary-50 border-border"}
                  `}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default ExamSessionPage;
