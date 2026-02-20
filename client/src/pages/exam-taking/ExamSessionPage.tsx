import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button } from "@/components/common/Button";
import {
  useStartSessionMutation,
  useSubmitAnswerMutation,
  useFinishSessionMutation,
  useReportViolationMutation,
  useLazyGetSessionStatusQuery,
} from "@/services/sessionApi";
import { useGetMyEnrollmentQuery } from "@/services/examApi";
import { RootState } from "@/store";

interface QuestionItem {
  examQuestionId: string;
  questionVersionId: string;
  type: string;
  content: string;
  options: { id: string; text: string; isCorrect?: boolean }[] | null;
  codeTemplate: string | null;
  codeLanguage: string | null;
  marks: number;
  orderIndex: number;
  screenReaderHint?: string;
}

type ExamPhase = "loading" | "pre-exam" | "in-progress" | "finished" | "error";

export function ExamSessionPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const institutionId = user?.institutionMembers?.[0]?.institution?.id || "";

  const [startSession] = useStartSessionMutation();
  const [submitAnswer] = useSubmitAnswerMutation();
  const [finishSession, { isLoading: isSubmitting }] =
    useFinishSessionMutation();
  const [reportViolation] = useReportViolationMutation();
  const [getSessionStatus] = useLazyGetSessionStatusQuery();

  const { data: enrollmentData, isLoading: enrollmentLoading } =
    useGetMyEnrollmentQuery(
      { institutionId, examId: examId as string },
      { skip: !examId || !institutionId },
    );

  const [phase, setPhase] = useState<ExamPhase>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionItem | null>(
    null,
  );
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [codeAnswer, setCodeAnswer] = useState("");
  const [isAnswerSubmitting, setIsAnswerSubmitting] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [examNotYetStarted, setExamNotYetStarted] = useState(false);
  const [startsIn, setStartsIn] = useState("");

  const tabSwitchCountRef = useRef(0);
  const pageVisibleRef = useRef(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Determine phase from enrollment data
  useEffect(() => {
    if (enrollmentLoading) return;

    if (!enrollmentData?.data) {
      setPhase("error");
      setErrorMsg(
        "You are not enrolled in this exam. Please contact your institution administrator.",
      );
      return;
    }

    const enrollment: any = enrollmentData.data;

    if (enrollment.status === "COMPLETED") {
      setPhase("finished");
      return;
    }

    if (enrollment.session && !enrollment.session.finishedAt) {
      setSessionId(enrollment.session.id);
      setPhase("in-progress");
      return;
    }

    // Check if exam start time hasn't arrived yet
    if (enrollment.exam?.scheduledStartTime) {
      const startTime = new Date(enrollment.exam.scheduledStartTime);
      const now = new Date();
      if (now < startTime) {
        setExamNotYetStarted(true);
      } else {
        setExamNotYetStarted(false);
      }
    }

    setPhase("pre-exam");
  }, [enrollmentData, enrollmentLoading]);

  // Timer countdown
  useEffect(() => {
    if (phase !== "in-progress") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // Sync timer from server every 30s
  useEffect(() => {
    if (!sessionId || phase !== "in-progress") return;
    const interval = setInterval(async () => {
      try {
        const result = await getSessionStatus({ sessionId }).unwrap();
        if (result?.data?.timerState?.remainingSeconds !== undefined) {
          setTimeLeft(result.data.timerState.remainingSeconds);
        }
        if (result?.data?.timerState?.isExpired) {
          setPhase("finished");
        }
      } catch {
        // Silently handle sync failures
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [sessionId, phase, getSessionStatus]);

  // Report tab switch violations
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && sessionId && phase === "in-progress") {
      tabSwitchCountRef.current++;
      reportViolation({ sessionId, type: "TAB_SWITCH" });
      pageVisibleRef.current = false;
    } else {
      pageVisibleRef.current = true;
    }
  }, [sessionId, phase, reportViolation]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [handleVisibilityChange]);

  // Auto-finish when time runs out
  useEffect(() => {
    if (timeLeft === 0 && phase === "in-progress" && sessionId) {
      handleFinish();
    }
  }, [timeLeft, phase]);

  // Countdown until exam starts
  useEffect(() => {
    if (!examNotYetStarted || phase !== "pre-exam") return;
    const enr: any = enrollmentData?.data;
    if (!enr?.exam?.scheduledStartTime) return;
    const startTime = new Date(enr.exam.scheduledStartTime).getTime();
    const interval = setInterval(() => {
      const diff = startTime - Date.now();
      if (diff <= 0) {
        setExamNotYetStarted(false);
        setStartsIn("");
        clearInterval(interval);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setStartsIn(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [examNotYetStarted, phase, enrollmentData]);

  // Start webcam
  const startWebcam = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setWebcamError("Browser does not support webcam access.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 320 },
          height: { ideal: 240 },
        },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setWebcamActive(true);
      setWebcamError(null);
    } catch (err: any) {
      const name = err?.name || "";
      if (name === "NotAllowedError")
        setWebcamError("Camera permission denied.");
      else if (name === "NotFoundError") setWebcamError("No webcam found.");
      else setWebcamError("Unable to access webcam.");
      setWebcamActive(false);
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setWebcamActive(false);
  }, []);

  // Start webcam when entering in-progress
  useEffect(() => {
    if (phase === "in-progress" && !mediaStreamRef.current) {
      startWebcam();
    }
    return () => {
      if (phase !== "in-progress") stopWebcam();
    };
  }, [phase, startWebcam, stopWebcam]);

  const handleStartExam = async () => {
    if (!enrollmentData?.data) return;
    if (examNotYetStarted) return;
    try {
      const result = await startSession({
        enrollmentId: enrollmentData.data.id,
      }).unwrap();

      const data: any = result.data;
      setSessionId(data.session.id);
      setCurrentQuestion(data.currentQuestion as QuestionItem | null);
      setTimeLeft(data.timerState?.remainingSeconds || 3600);
      setPhase("in-progress");
    } catch (err: any) {
      setErrorMsg(
        err?.data?.message || "Failed to start exam session. Please try again.",
      );
      setPhase("error");
    }
  };

  const handleSubmitAnswer = async () => {
    if (!sessionId || !currentQuestion) return;
    setIsAnswerSubmitting(true);

    let answerContent = "";
    if (
      currentQuestion.type === "MCQ" ||
      currentQuestion.type === "FILL_BLANK" ||
      currentQuestion.type === "SHORT_ANSWER"
    ) {
      answerContent = selectedAnswer;
    } else if (currentQuestion.type === "MULTI_SELECT") {
      answerContent = JSON.stringify(selectedOptions);
    }

    try {
      const result = await submitAnswer({
        sessionId,
        body: {
          examQuestionId: currentQuestion.examQuestionId,
          answerContent: answerContent || undefined,
          codeSubmission:
            currentQuestion.type === "CODE" ? codeAnswer : undefined,
        },
      }).unwrap();

      const data = result.data as any;
      setQuestionsAnswered((prev) => prev + 1);
      setSelectedAnswer("");
      setSelectedOptions([]);
      setCodeAnswer("");

      if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion);
      } else {
        // No more questions
        handleFinish();
      }
    } catch (err: any) {
      if (err?.data?.message?.includes("Time has expired")) {
        setPhase("finished");
      }
    } finally {
      setIsAnswerSubmitting(false);
    }
  };

  const handleFinish = async () => {
    if (!sessionId) {
      navigate("/dashboard");
      return;
    }
    try {
      await finishSession({ sessionId }).unwrap();
    } catch {
      // Already finished or error
    }
    setPhase("finished");
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const toggleOption = (optId: string) => {
    setSelectedOptions((prev) =>
      prev.includes(optId) ? prev.filter((o) => o !== optId) : [...prev, optId],
    );
  };

  // ────── RENDER: Loading ──────
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
          <p className="text-text-muted font-medium">Loading exam details...</p>
        </div>
      </div>
    );
  }

  // ────── RENDER: Error ──────
  if (phase === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="card max-w-md w-full p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text-main">Cannot Join Exam</h2>
          <p className="text-text-muted">{errorMsg}</p>
          <Button onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // ────── RENDER: Pre-Exam ──────
  if (phase === "pre-exam") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="card max-w-lg w-full p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-main">
              {(enrollmentData?.data as any)?.exam?.title || "Exam Session"}
            </h1>
            <p className="text-text-muted">
              You are about to begin your exam. Please read the instructions
              below carefully.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 space-y-3 border border-border">
            <h3 className="font-bold text-text-main text-sm uppercase tracking-wider">
              Rules & Information
            </h3>
            <ul className="space-y-2 text-sm text-text-muted">
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">•</span>
                Duration:{" "}
                <strong className="text-text-main">
                  {(enrollmentData?.data as any)?.adjustedDurationMinutes ||
                    (enrollmentData?.data as any)?.exam?.durationMinutes}{" "}
                  minutes
                </strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                Tab switching or leaving this window will be recorded as a
                violation. After 3 violations, the exam will be locked.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                The timer is server-authoritative. Disconnections will not grant
                extra time.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                Webcam proctoring may be active. Snapshots are taken at random
                intervals.
              </li>
            </ul>
          </div>

          {examNotYetStarted && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
              <p className="text-sm font-bold text-blue-800">
                Exam has not started yet
              </p>
              <p className="text-2xl font-mono font-black text-blue-700 mt-1">
                {startsIn}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                The button will enable automatically when the exam window opens.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => navigate("/dashboard")}
            >
              Go Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleStartExam}
              disabled={examNotYetStarted}
            >
              {examNotYetStarted ? "⏳ Waiting..." : "🚀 Start Exam"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ────── RENDER: Finished ──────
  if (phase === "finished") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="card max-w-md w-full p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-main">
            Exam Submitted Successfully
          </h2>
          <p className="text-text-muted">
            Your answers have been recorded. You answered{" "}
            <strong>{questionsAnswered}</strong> question(s). Results will be
            available after the examiner publishes them.
          </p>
          <Button onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // ────── RENDER: In Progress ──────
  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case "MCQ":
        return (
          <div
            className="space-y-3"
            role="radiogroup"
            aria-label="Answer options"
          >
            {currentQuestion.options?.map((opt, idx) => (
              <label
                key={opt.id || idx}
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedAnswer === (opt.id || opt.text)
                    ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200"
                    : "border-border hover:bg-surface"
                }`}
                aria-label={`Option ${String.fromCharCode(65 + idx)}: ${opt.text}`}
              >
                <input
                  type="radio"
                  name="mcq-answer"
                  value={opt.id || opt.text}
                  checked={selectedAnswer === (opt.id || opt.text)}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-text-main font-medium">{opt.text}</span>
              </label>
            )) || <p className="text-text-muted">No options available.</p>}
          </div>
        );

      case "MULTI_SELECT":
        return (
          <div
            className="space-y-3"
            role="group"
            aria-label="Select all correct answers"
          >
            {currentQuestion.options?.map((opt, idx) => (
              <label
                key={opt.id || idx}
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedOptions.includes(opt.id || opt.text)
                    ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200"
                    : "border-border hover:bg-surface"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(opt.id || opt.text)}
                  onChange={() => toggleOption(opt.id || opt.text)}
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500 rounded"
                />
                <span className="text-text-main font-medium">{opt.text}</span>
              </label>
            ))}
          </div>
        );

      case "FILL_BLANK":
        return (
          <div className="space-y-2">
            <label
              className="text-sm font-bold text-text-main"
              htmlFor="fill-blank-answer"
            >
              Your Answer
            </label>
            <input
              id="fill-blank-answer"
              type="text"
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              className="w-full h-12 px-4 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg font-medium"
              placeholder="Type your answer here..."
              autoComplete="off"
            />
          </div>
        );

      case "SHORT_ANSWER":
        return (
          <div className="space-y-2">
            <label
              className="text-sm font-bold text-text-main"
              htmlFor="short-answer"
            >
              Your Response
            </label>
            <textarea
              id="short-answer"
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              className="w-full h-40 p-4 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Write your answer..."
            />
          </div>
        );

      case "CODE":
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                className="text-sm font-bold text-text-main"
                htmlFor="code-answer"
              >
                Code ({currentQuestion.codeLanguage || "any language"})
              </label>
            </div>
            <textarea
              id="code-answer"
              value={codeAnswer || currentQuestion.codeTemplate || ""}
              onChange={(e) => setCodeAnswer(e.target.value)}
              className="w-full h-64 p-4 font-mono text-sm bg-gray-900 text-gray-100 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="// Write your code here..."
              spellCheck={false}
            />
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <textarea
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              className="w-full h-48 p-4 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Type your answer here..."
            />
          </div>
        );
    }
  };

  const hasAnswer = () => {
    if (!currentQuestion) return false;
    if (currentQuestion.type === "CODE") return codeAnswer.trim().length > 0;
    if (currentQuestion.type === "MULTI_SELECT")
      return selectedOptions.length > 0;
    return selectedAnswer.trim().length > 0;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Proctoring Banner */}
      {webcamActive && (
        <div className="w-full bg-red-600 text-white text-xs font-bold text-center py-1.5 uppercase tracking-widest fixed top-0 z-50">
          Proctoring Active — You are being recorded
        </div>
      )}

      {/* Top Bar */}
      <header
        className={`w-full h-16 bg-surface border-b border-border shadow-soft flex items-center justify-between px-8 sticky ${webcamActive ? "top-7" : "top-0"} z-40`}
      >
        <div className="flex items-center gap-4">
          <div className="text-lg font-black text-text-main">
            {(enrollmentData?.data as any)?.exam?.title || `Exam`}
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800 font-bold border border-green-200">
            Connected
          </span>
        </div>

        <div
          className={`text-2xl font-mono font-bold px-4 py-1 rounded shadow-inner ${
            timeLeft < 300
              ? "bg-red-100 text-red-700"
              : "bg-primary-100 text-primary-800"
          }`}
          role="timer"
          aria-label={`Time remaining: ${formatTime(timeLeft)}`}
        >
          {formatTime(timeLeft)}
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={handleFinish}
          isLoading={isSubmitting}
        >
          Submit Exam
        </Button>
      </header>

      {/* Webcam Floating Widget */}
      <div className="fixed top-20 right-4 z-50 w-48">
        <div className="bg-gray-900 rounded-xl overflow-hidden border-2 border-gray-700 shadow-xl aspect-video relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {webcamActive && (
            <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-red-800" />
          )}
          {webcamError && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center px-2">
              <p className="text-[10px] text-red-200 text-center font-medium">
                {webcamError}
              </p>
            </div>
          )}
          {!webcamActive && !webcamError && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <p className="text-[10px] text-gray-400 text-center">
                Camera loading...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-4xl mx-auto p-8 flex-1 pr-56">
        {currentQuestion ? (
          <div className="card p-8 space-y-8">
            {/* Question Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-xl font-bold text-text-main">
                Question {questionsAnswered + 1}
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                  +{currentQuestion.marks} Marks
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                  {currentQuestion.type.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Question Content */}
            <div
              className="prose max-w-none text-text-main"
              role="article"
              aria-label={currentQuestion.screenReaderHint || "Question"}
            >
              <p className="text-lg font-medium whitespace-pre-wrap">
                {currentQuestion.content}
              </p>
            </div>

            {/* Answer Input */}
            <div>{renderQuestionInput()}</div>

            {/* Actions */}
            <div className="flex justify-end pt-4 border-t border-border">
              <Button
                onClick={handleSubmitAnswer}
                isLoading={isAnswerSubmitting}
                disabled={!hasAnswer()}
                className="px-8"
              >
                Save &amp; Next →
              </Button>
            </div>
          </div>
        ) : (
          <div className="card p-12 text-center space-y-4">
            <p className="text-lg text-text-muted font-medium">
              No more questions available. Click "Submit Exam" to finish.
            </p>
            <Button onClick={handleFinish} isLoading={isSubmitting}>
              Submit Exam
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default ExamSessionPage;
