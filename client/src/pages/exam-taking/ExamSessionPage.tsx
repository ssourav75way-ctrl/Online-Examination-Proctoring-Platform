import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import {
  useStartSessionMutation,
  useSubmitAnswerMutation,
  useFinishSessionMutation,
  useReportViolationMutation,
  useLazyGetSessionStatusQuery,
  useLazyGetQuestionQuery,
  useGetMarkersQuery,
} from "@/services/sessionApi";
import { useGetMyEnrollmentQuery } from "@/services/examApi";
import { useUploadSnapshotMutation } from "@/services/proctorApi";
import { ApiError } from "@/types/common";
import { useInstitution } from "@/contexts/InstitutionContext";

import { Enrollment, QuestionItem } from "@/types/modules/exam.types";

type ExamPhase =
  | "loading"
  | "pre-exam"
  | "in-progress"
  | "finished"
  | "error"
  | "locked";

export function ExamSessionPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { institutionId } = useInstitution();

  const [startSession] = useStartSessionMutation();
  const [submitAnswer] = useSubmitAnswerMutation();
  const [finishSession, { isLoading: isSubmitting }] =
    useFinishSessionMutation();
  const [reportViolation] = useReportViolationMutation();
  const [getSessionStatus] = useLazyGetSessionStatusQuery();
  const [getQuestion] = useLazyGetQuestionQuery();
  const [uploadSnapshot] = useUploadSnapshotMutation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { data: markersData } = useGetMarkersQuery(
    { sessionId: sessionId as string },
    { skip: !sessionId },
  );

  const { data: enrollmentData, isLoading: enrollmentLoading } =
    useGetMyEnrollmentQuery(
      { institutionId, examId: examId as string },
      { skip: !examId || !institutionId },
    );

  const [phase, setPhase] = useState<ExamPhase>("loading");
  const [errorMsg, setErrorMsg] = useState("");
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
  const [lockReason, setLockReason] = useState<string | null>(null);

  const tabSwitchCountRef = useRef(0);
  const pageVisibleRef = useRef(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const snapshotCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (enrollmentLoading) return;

    if (!enrollmentData?.data) {
      setPhase("error");
      setErrorMsg(
        "You are not enrolled in this exam. Please contact your institution administrator.",
      );
      return;
    }

    const enrollment = enrollmentData.data as Enrollment;

    if (enrollment.status === "COMPLETED") {
      setPhase("finished");
      return;
    }

    if (enrollment.session && !enrollment.session.finishedAt) {
      setSessionId(enrollment.session.id);
      if (enrollment.session.isLocked) {
        setLockReason(
          enrollment.session.lockReason || "Session locked due to violations",
        );
        setPhase("locked");
      } else {
        setPhase("in-progress");
      }
      return;
    }

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

  useEffect(() => {
    if (!sessionId || (phase !== "in-progress" && phase !== "locked")) return;
    const interval = setInterval(
      async () => {
        try {
          const result = await getSessionStatus({ sessionId }).unwrap();
          if (result?.data?.timerState?.remainingSeconds !== undefined) {
            setTimeLeft(result.data.timerState.remainingSeconds);
          }
          if (result?.data?.timerState?.isExpired) {
            setPhase("finished");
          }
          // Check if session was unlocked by proctor
          if (
            phase === "locked" &&
            result?.data?.session &&
            !result.data.session.isLocked
          ) {
            setLockReason(null);
            setPhase("in-progress");
          }
          // Check if session was locked
          if (phase === "in-progress" && result?.data?.session?.isLocked) {
            setLockReason(
              result.data.session.lockReason ||
                "Session locked due to violations",
            );
            setPhase("locked");
          }
        } catch {}
      },
      phase === "locked" ? 10000 : 30000,
    );
    return () => clearInterval(interval);
  }, [sessionId, phase, getSessionStatus]);

  const handleVisibilityChange = useCallback(async () => {
    if (document.hidden && sessionId && phase === "in-progress") {
      tabSwitchCountRef.current++;
      pageVisibleRef.current = false;
      try {
        const result = await reportViolation({
          sessionId,
          type: "TAB_SWITCH",
        }).unwrap();
        if (result?.data?.isLocked) {
          setLockReason(
            `Session locked after ${tabSwitchCountRef.current} tab switch violations`,
          );
          setPhase("locked");
        }
      } catch {}
    } else {
      pageVisibleRef.current = true;
    }
  }, [sessionId, phase, reportViolation]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [handleVisibilityChange]);

  useEffect(() => {
    if (timeLeft === 0 && phase === "in-progress" && sessionId) {
      handleFinish();
    }
  }, [timeLeft, phase]);

  useEffect(() => {
    if (!examNotYetStarted || phase !== "pre-exam") return;
    const enr = enrollmentData?.data as Enrollment;
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

  const handleNavigateToQuestion = async (index: number) => {
    if (!sessionId) return;
    try {
      const result = await getQuestion({ sessionId, index }).unwrap();
      const { question, answer } = result.data;
      setCurrentQuestion(question);
      setQuestionsAnswered(index);

      if (answer) {
        if (
          question.type === "MCQ" ||
          question.type === "FILL_BLANK" ||
          question.type === "SHORT_ANSWER"
        ) {
          setSelectedAnswer(answer.answerContent || "");
        } else if (question.type === "MULTI_SELECT") {
          setSelectedOptions(JSON.parse(answer.answerContent || "[]"));
        } else if (question.type === "CODE") {
          setCodeAnswer(answer.codeSubmission || "");
        }
      } else {
        setSelectedAnswer("");
        setSelectedOptions([]);
        setCodeAnswer("");
      }
    } catch (err) {
      console.error("Failed to navigate to question:", err);
    }
  };

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
    } catch (err) {
      const error = err as { name?: string };
      const name = error?.name || "";
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

  useEffect(() => {
    if (phase === "in-progress" && !mediaStreamRef.current) {
      startWebcam();
    }
    return () => {
      if (phase !== "in-progress") stopWebcam();
    };
  }, [phase, startWebcam, stopWebcam]);

  // Periodic webcam snapshot capture at random intervals (15-45s)
  useEffect(() => {
    if (phase !== "in-progress" || !sessionId || !webcamActive) return;

    const captureSnapshot = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return; // not ready

      // Create or reuse a hidden canvas
      if (!snapshotCanvasRef.current) {
        snapshotCanvasRef.current = document.createElement("canvas");
      }
      const canvas = snapshotCanvasRef.current;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageUrl = canvas.toDataURL("image/jpeg", 0.6);

      // Upload snapshot — server handles absence detection
      uploadSnapshot({
        sessionId: sessionId!,
        imageUrl,
        faceDetected: true, // basic: assume face detected since webcam is on
        multipleFaces: false,
        candidateAbsent: false,
      }).catch(() => {
        // Silently fail — don't disrupt the exam
      });
    };

    const scheduleNextCapture = () => {
      // Random interval between 15-45 seconds
      const delayMs = (15 + Math.random() * 30) * 1000;
      snapshotTimerRef.current = setTimeout(() => {
        captureSnapshot();
        scheduleNextCapture();
      }, delayMs);
    };

    // Initial capture after a short delay
    snapshotTimerRef.current = setTimeout(() => {
      captureSnapshot();
      scheduleNextCapture();
    }, 5000);

    return () => {
      if (snapshotTimerRef.current) {
        clearTimeout(snapshotTimerRef.current);
        snapshotTimerRef.current = null;
      }
    };
  }, [phase, sessionId, webcamActive, uploadSnapshot]);

  const handleStartExam = async () => {
    if (!enrollmentData?.data) return;
    if (examNotYetStarted) return;

    if (!webcamActive) {
      alert(
        "A working webcam is STRICTLY REQUIRED for this exam. Please ensure your camera is connected and you have granted permission.",
      );
      startWebcam();
      return;
    }

    try {
      const result = await startSession({
        enrollmentId: enrollmentData.data.id,
      }).unwrap();

      const { session, currentQuestion: q, timerState } = result.data;
      setSessionId(session.id);
      setCurrentQuestion(q);
      setTimeLeft(timerState?.remainingSeconds || 3600);
      setPhase("in-progress");
    } catch (err) {
      const error = err as ApiError;
      setErrorMsg(
        error?.data?.message ||
          "Failed to start exam session. Please try again.",
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

      const { nextQuestion } = result.data;

      if (nextQuestion) {
        setCurrentQuestion(nextQuestion);
        setQuestionsAnswered((prev) => prev + 1);
        setSelectedAnswer("");
        setSelectedOptions([]);
        setCodeAnswer("");
      } else {
        const nextUnanswered = markersData?.data.find(
          (m) => !m.isAnswered && m.index > currentQuestion.orderIndex,
        );
        if (nextUnanswered) {
          handleNavigateToQuestion(nextUnanswered.index);
        } else {
          alert(
            "Question saved! This was the last question in sequence. You can review your answers or click Submit Exam to finish.",
          );
        }
      }
    } catch (err) {
      const error = err as ApiError;
      if (error?.data?.message?.includes("Time has expired")) {
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
    } catch {}
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
              {enrollmentData?.data?.exam?.title || "Exam Session"}
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
                <span className="text-primary-600 mt-0.5"></span>
                Duration:{" "}
                <strong className="text-text-main">
                  {enrollmentData?.data?.adjustedDurationMinutes ||
                    enrollmentData?.data?.exam?.durationMinutes}{" "}
                  minutes
                </strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5"></span>
                Tab switching or leaving this window will be recorded as a
                violation. After 3 violations, the exam will be locked.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5"></span>
                The timer is server-authoritative. Disconnections will not grant
                extra time.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5"></span>
                Webcam proctoring may be active. Snapshots are taken at random
                intervals.
              </li>
            </ul>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 space-y-3 border border-border">
            <h3 className="font-bold text-text-main text-sm uppercase tracking-wider">
              Webcam Verification
            </h3>
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative border-2 border-slate-200">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!webcamActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-900/80 text-white text-center">
                  <svg
                    className="w-12 h-12 text-slate-400 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-1">
                    Camera Required
                  </p>
                  <p className="text-[10px] text-slate-300">
                    Grant permission to continue
                  </p>
                  <Button
                    size="sm"
                    onClick={startWebcam}
                    className="mt-3 scale-90"
                  >
                    Retry Access
                  </Button>
                </div>
              )}
              {webcamActive && (
                <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />{" "}
                  Live Preview
                </div>
              )}
            </div>
            {webcamError && (
              <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded border border-rose-100 italic">
                &times; {webcamError}
              </p>
            )}
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
              className="flex-1 h-12 text-base font-black uppercase tracking-widest bg-primary-600 hover:bg-primary-700 shadow-xl shadow-primary-200"
              onClick={handleStartExam}
              disabled={examNotYetStarted || !webcamActive}
            >
              {examNotYetStarted
                ? " Waiting..."
                : !webcamActive
                  ? " Camera Required"
                  : " Start Exam"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "locked") {
    return (
      <div className="min-h-screen bg-linear-to-br from-rose-950 via-slate-900 to-slate-950 flex items-center justify-center p-8">
        <div className="max-w-lg w-full text-center space-y-8">
          {/* Pulsing lock icon */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-ping" />
            <div className="relative w-24 h-24 bg-rose-600/30 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-rose-500/50">
              <svg
                className="w-12 h-12 text-rose-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-black text-white tracking-tight">
              Exam Session Locked
            </h1>
            <p className="text-rose-200 text-lg font-medium">
              Your session has been temporarily suspended.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-rose-400 text-xs font-black">!</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Reason</p>
                <p className="text-slate-300 text-sm mt-0.5">
                  {lockReason || "Multiple integrity violations detected"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">
                  What happens now?
                </p>
                <p className="text-slate-300 text-sm mt-0.5">
                  A proctor has been notified and will review your session. If
                  approved, your exam will resume automatically. Your timer has
                  been paused.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-medium">Waiting for proctor approval...</span>
          </div>
        </div>
      </div>
    );
  }

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
              <span className="text-[10px] text-text-muted font-medium bg-slate-100 px-2 py-1 rounded">
                Press <strong>Esc</strong> then <strong>Tab</strong> to move
                focus out
              </span>
            </div>
            <textarea
              id="code-answer"
              value={codeAnswer || currentQuestion.codeTemplate || ""}
              onChange={(e) => setCodeAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  const start = e.currentTarget.selectionStart;
                  const end = e.currentTarget.selectionEnd;
                  const value = e.currentTarget.value;
                  e.currentTarget.value =
                    value.substring(0, start) + "    " + value.substring(end);
                  e.currentTarget.selectionStart =
                    e.currentTarget.selectionEnd = start + 4;
                  setCodeAnswer(e.currentTarget.value);
                }
              }}
              className="w-full h-64 p-4 font-mono text-sm bg-gray-900 text-gray-100 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="// Write your code here..."
              spellCheck={false}
              aria-multiline="true"
              aria-label={`Code editor for ${currentQuestion.codeLanguage || "programming"} question. Press Escape then Tab to exit the editor.`}
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
      {}
      {webcamActive && (
        <div className="w-full bg-red-600 text-white text-xs font-bold text-center py-1.5 uppercase tracking-widest fixed top-0 z-50">
          Proctoring Active You are being recorded
        </div>
      )}

      {}
      <header
        className={`w-full h-16 bg-surface border-b border-border shadow-soft flex items-center justify-between px-8 sticky ${webcamActive ? "top-7" : "top-0"} z-40`}
      >
        <div className="flex items-center gap-4">
          <div className="text-lg font-black text-text-main">
            {enrollmentData?.data?.exam?.title || `Exam`}
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

      {}
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

      {}
      <div className="flex-1 flex overflow-hidden">
        {}
        <aside className="w-64 bg-surface border-r border-border overflow-y-auto p-4 hidden md:block">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">
            Question Palette
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {markersData?.data.map((m) => (
              <button
                key={m.id}
                onClick={() => handleNavigateToQuestion(m.index)}
                className={`h-10 rounded-lg font-bold text-sm transition-all border-2 ${
                  currentQuestion?.orderIndex === m.index
                    ? "border-primary-600 bg-primary-50 text-primary-700"
                    : m.isAnswered
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                }`}
              >
                {m.index + 1}
              </button>
            ))}
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
              <div className="w-3 h-3 rounded bg-emerald-500" /> Answered
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
              <div className="w-3 h-3 rounded border-2 border-slate-200" />{" "}
              Unanswered
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
              <div className="w-3 h-3 rounded border-2 border-primary-600 bg-primary-50" />{" "}
              Current
            </div>
          </div>

          <div className="mt-12">
            <Button
              variant="danger"
              className="w-full py-4 text-sm font-black uppercase tracking-widest shadow-lg shadow-rose-200"
              onClick={handleFinish}
              isLoading={isSubmitting}
            >
              Submit Exam
            </Button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8 relative">
          {currentQuestion ? (
            <div className="mx-auto max-w-3xl space-y-8">
              <div className="card p-8 space-y-8 border-t-4 border-t-primary-600">
                {}
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <h2 className="text-xl font-bold text-text-main">
                    Question {currentQuestion.orderIndex + 1}
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

                {}
                <div
                  className="prose max-w-none text-text-main"
                  role="article"
                  aria-label={currentQuestion.screenReaderHint || "Question"}
                >
                  <p className="text-lg font-medium whitespace-pre-wrap leading-relaxed">
                    {currentQuestion.content}
                  </p>
                </div>

                {}
                <div className="py-4">{renderQuestionInput()}</div>

                {}
                <div className="flex justify-between items-center pt-6 border-t border-border">
                  <Button
                    variant="secondary"
                    disabled={currentQuestion.orderIndex === 0}
                    onClick={() =>
                      handleNavigateToQuestion(currentQuestion.orderIndex - 1)
                    }
                  >
                    &larr; Previous
                  </Button>
                  <Button
                    onClick={handleSubmitAnswer}
                    isLoading={isAnswerSubmitting}
                    disabled={!hasAnswer()}
                    className="px-8 shadow-lg shadow-primary-200"
                  >
                    {markersData?.data.find(
                      (m) => m.index === currentQuestion.orderIndex,
                    )?.isAnswered
                      ? "Update Answer"
                      : "Save & Next"}{" "}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-md card p-12 text-center space-y-4">
              <p className="text-lg text-text-muted font-medium">
                No more questions available. Click "Submit Exam" to finish.
              </p>
              <Button
                onClick={handleFinish}
                isLoading={isSubmitting}
                className="w-full py-4"
              >
                Final Submit Exam
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default ExamSessionPage;
