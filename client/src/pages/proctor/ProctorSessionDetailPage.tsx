import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetSessionSnapshotsQuery,
  useGetSessionFlagsQuery,
  ProctorFlag,
  ProctorSnapshot,
} from "@/services/proctorApi";
import {
  useProctorUnlockMutation,
  useExtendTimeMutation,
  useLazyGetSessionStatusQuery,
} from "@/services/sessionApi";
import { Button } from "@/components/common/Button";
import { formatDateIST as formatDate } from "@/utils/dateFormat";

const flagTypeLabels: Record<string, string> = {
  NO_FACE: "No Face Detected",
  MULTIPLE_FACES: "Multiple Faces",
  ABSENT_60S: "Absent 60s+",
  TAB_SWITCH: "Tab Switch",
  TIMING_ANOMALY: "Timing Anomaly",
  FOCUS_LOSS: "Focus Loss",
};

const severityConfig: Record<
  number,
  { label: string; bg: string; text: string; border: string }
> = {
  1: {
    label: "Low",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  2: {
    label: "Medium",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  3: {
    label: "High",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  4: {
    label: "Critical",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  5: {
    label: "Severe",
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-300",
  },
};

export function ProctorSessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [snapshotPage, setSnapshotPage] = useState(1);
  const [extendMinutes, setExtendMinutes] = useState(15);
  const [activeTab, setActiveTab] = useState<"snapshots" | "flags" | "actions">(
    "snapshots",
  );
  const [selectedSnapshot, setSelectedSnapshot] =
    useState<ProctorSnapshot | null>(null);

  const {
    data: snapshotsData,
    isLoading: snapshotsLoading,
    isError: snapshotsError,
  } = useGetSessionSnapshotsQuery(
    { sessionId: sessionId as string, page: snapshotPage, limit: 12 },
    { skip: !sessionId },
  );

  const {
    data: flagsData,
    isLoading: flagsLoading,
    isError: flagsError,
  } = useGetSessionFlagsQuery(
    { sessionId: sessionId as string },
    { skip: !sessionId },
  );

  const [getSessionStatus] = useLazyGetSessionStatusQuery();
  const [proctorUnlock, { isLoading: unlocking }] = useProctorUnlockMutation();
  const [extendTime, { isLoading: extending }] = useExtendTimeMutation();

  const [sessionInfo, setSessionInfo] = useState<{
    isLocked: boolean;
    lockReason: string | null;
    remainingSeconds: number;
  } | null>(null);
  const [actionResult, setActionResult] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    getSessionStatus({ sessionId })
      .unwrap()
      .then((result: any) => {
        setSessionInfo({
          isLocked: result.data.session.isLocked,
          lockReason: result.data.session.lockReason,
          remainingSeconds: result.data.timerState.remainingSeconds,
        });
      })
      .catch((err) => {
        console.error("Failed to fetch session status", err);
      });
  }, [sessionId]);

  const snapshots = snapshotsData?.data || [];
  const totalSnapshotPages = snapshotsData?.meta?.totalPages || 1;
  const flags = flagsData?.data || [];

  const handleUnlock = async () => {
    if (!sessionId) return;
    try {
      const result = await proctorUnlock({ sessionId }).unwrap();
      setSessionInfo((prev) =>
        prev ? { ...prev, isLocked: false, lockReason: null } : prev,
      );
      setActionResult(result.data.message || "Session unlocked successfully");
    } catch {
      setActionResult("Failed to unlock session");
    }
  };

  const handleExtend = async () => {
    if (!sessionId || extendMinutes <= 0) return;
    try {
      const result = await extendTime({
        sessionId,
        additionalMinutes: extendMinutes,
      }).unwrap();
      setSessionInfo((prev) =>
        prev
          ? { ...prev, remainingSeconds: result.data.remainingSeconds }
          : prev,
      );
      setActionResult(`Time extended by ${extendMinutes} minutes successfully`);
    } catch {
      setActionResult("Failed to extend time");
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const tabClasses = (tab: string) =>
    `px-6 py-3 text-sm font-bold transition-all border-b-2 ${
      activeTab === tab
        ? "border-primary-600 text-primary-600"
        : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
    }`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate("/dashboard/sessions")}
        >
          &larr; Back to Sessions
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-text-main">Session Detail</h1>
          <p className="text-text-muted text-sm font-mono">
            ID: {sessionId?.slice(0, 12)}...
          </p>
        </div>
      </div>

      {sessionInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`card p-5 border-2 ${sessionInfo.isLocked ? "border-rose-300 bg-rose-50" : "border-emerald-200 bg-emerald-50"}`}
          >
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
              Session Status
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${sessionInfo.isLocked ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`}
              />
              <span
                className={`text-lg font-bold ${sessionInfo.isLocked ? "text-rose-700" : "text-emerald-700"}`}
              >
                {sessionInfo.isLocked ? "LOCKED" : "ACTIVE"}
              </span>
            </div>
            {sessionInfo.lockReason && (
              <p className="text-xs text-rose-600 mt-1 font-medium">
                {sessionInfo.lockReason}
              </p>
            )}
          </div>

          <div className="card p-5 border border-border/60">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
              Time Remaining
            </p>
            <p className="text-lg font-mono font-bold text-primary-700">
              {formatTime(sessionInfo.remainingSeconds)}
            </p>
          </div>

          <div className="card p-5 border border-border/60">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
              Flags / Snapshots
            </p>
            <p className="text-lg font-bold text-slate-800">
              <span className="text-rose-600">{flags.length}</span> flags
              &middot;{" "}
              <span className="text-blue-600">
                {snapshotsData?.meta?.total || snapshots.length}
              </span>{" "}
              snapshots
            </p>
          </div>
        </div>
      )}

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("snapshots")}
          className={tabClasses("snapshots")}
        >
          Snapshots ({snapshotsData?.meta?.total || 0})
        </button>
        <button
          onClick={() => setActiveTab("flags")}
          className={tabClasses("flags")}
        >
          Flags ({flags.length})
        </button>
        <button
          onClick={() => setActiveTab("actions")}
          className={tabClasses("actions")}
        >
          Actions
        </button>
      </div>

      {activeTab === "snapshots" && (
        <div className="space-y-6">
          {snapshotsLoading && (
            <div className="card p-8 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
          )}
          {snapshotsError && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              Failed to load snapshots.
            </div>
          )}
          {!snapshotsLoading && !snapshotsError && (
            <>
              {snapshots.length === 0 ? (
                <div className="card p-12 text-center text-slate-500">
                  No snapshots captured yet for this session.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {snapshots.map((snap: ProctorSnapshot) => (
                    <div
                      key={snap.id}
                      className={`group relative bg-white rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:shadow-lg ${
                        snap.multipleFaces ||
                        !snap.faceDetected ||
                        snap.candidateAbsent
                          ? "border-rose-300 shadow-rose-100"
                          : "border-slate-200 hover:border-primary-300"
                      }`}
                      onClick={() => setSelectedSnapshot(snap)}
                    >
                      <div className="aspect-video bg-slate-900 relative overflow-hidden">
                        <img
                          src={snap.imageUrl}
                          alt={`Snapshot at ${formatDate(snap.capturedAt)}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {(snap.multipleFaces ||
                          !snap.faceDetected ||
                          snap.candidateAbsent) && (
                          <div className="absolute top-2 right-2 flex gap-1">
                            {!snap.faceDetected && (
                              <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[9px] font-black rounded">
                                NO FACE
                              </span>
                            )}
                            {snap.multipleFaces && (
                              <span className="px-1.5 py-0.5 bg-amber-600 text-white text-[9px] font-black rounded">
                                MULTI
                              </span>
                            )}
                            {snap.candidateAbsent && (
                              <span className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-black rounded">
                                ABSENT
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-[10px] font-mono text-slate-400">
                          {formatDate(snap.capturedAt)}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${snap.faceDetected && !snap.multipleFaces && !snap.candidateAbsent ? "bg-emerald-500" : "bg-rose-500"}`}
                          />
                          <span className="text-[10px] font-bold text-slate-500">
                            {snap.faceDetected &&
                            !snap.multipleFaces &&
                            !snap.candidateAbsent
                              ? "Normal"
                              : "Anomaly"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalSnapshotPages > 1 && (
                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
                  <span className="text-sm font-medium text-slate-500">
                    Page {snapshotPage} of {totalSnapshotPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={snapshotPage === 1}
                      onClick={() => setSnapshotPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={snapshotPage >= totalSnapshotPages}
                      onClick={() => setSnapshotPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {selectedSnapshot && (
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedSnapshot(null)}
            >
              <div
                className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <img
                    src={selectedSnapshot.imageUrl}
                    alt="Snapshot detail"
                    className="w-full aspect-video object-cover"
                  />
                  <button
                    onClick={() => setSelectedSnapshot(null)}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full text-white flex items-center justify-center font-bold hover:bg-black/70 transition-colors"
                  >
                    &times;
                  </button>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-slate-900">
                      Captured: {formatDate(selectedSnapshot.capturedAt)}
                    </p>
                    <div className="flex gap-2">
                      {selectedSnapshot.faceDetected ? (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">
                          Face Detected
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded">
                          No Face
                        </span>
                      )}
                      {selectedSnapshot.multipleFaces && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded">
                          Multiple Faces
                        </span>
                      )}
                      {selectedSnapshot.candidateAbsent && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                          Candidate Absent
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "flags" && (
        <div className="space-y-4">
          {flagsLoading && (
            <div className="card p-8 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
          )}
          {flagsError && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              Failed to load flags.
            </div>
          )}
          {!flagsLoading && !flagsError && (
            <>
              {flags.length === 0 ? (
                <div className="card p-12 text-center text-slate-500">
                  No flags have been raised for this session.
                </div>
              ) : (
                <div className="space-y-3">
                  {flags.map((flag: ProctorFlag) => {
                    const sev =
                      severityConfig[flag.severity] || severityConfig[1];
                    return (
                      <div
                        key={flag.id}
                        className={`card p-5 border-l-4 ${sev.border} hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-900">
                                {flagTypeLabels[flag.flagType] || flag.flagType}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black border ${sev.bg} ${sev.text} ${sev.border}`}
                              >
                                {sev.label}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  flag.reviewStatus === "PENDING"
                                    ? "bg-amber-100 text-amber-700"
                                    : flag.reviewStatus === "APPROVED"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {flag.reviewStatus}
                              </span>
                            </div>
                            {flag.description && (
                              <p className="text-sm text-slate-600">
                                {flag.description}
                              </p>
                            )}
                            <p className="text-xs text-slate-400 font-mono">
                              {formatDate(flag.createdAt)}
                            </p>
                          </div>
                        </div>
                        {flag.reviewNotes && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
                              Review Notes
                            </p>
                            <p className="text-sm text-slate-700">
                              {flag.reviewNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "actions" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 border border-border/60 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Unlock Session</h3>
                <p className="text-xs text-slate-500">
                  Resume a locked candidate session
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              If a candidate&apos;s session was locked due to violations, you
              can unlock it to allow them to continue. The timer will be
              adjusted to account for time spent locked.
            </p>
            <Button
              onClick={handleUnlock}
              isLoading={unlocking}
              disabled={!sessionInfo?.isLocked}
              className="w-full"
            >
              {sessionInfo?.isLocked ? "Unlock Session" : "Session Not Locked"}
            </Button>
          </div>

          <div className="card p-6 border border-border/60 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Extend Time</h3>
                <p className="text-xs text-slate-500">
                  Grant additional minutes
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Add extra time for technical issues, accommodations, or other
              valid reasons.
            </p>
            <div className="flex gap-2">
              {[5, 10, 15, 30].map((m) => (
                <button
                  key={m}
                  onClick={() => setExtendMinutes(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    extendMinutes === m
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  +{m}m
                </button>
              ))}
            </div>
            <Button
              variant="secondary"
              onClick={handleExtend}
              isLoading={extending}
              className="w-full"
            >
              Extend by {extendMinutes} Minutes
            </Button>
          </div>

          {actionResult && (
            <div className="col-span-full p-4 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 font-medium text-sm flex items-center justify-between">
              <span>{actionResult}</span>
              <button
                onClick={() => setActionResult(null)}
                className="text-blue-400 hover:text-blue-600 font-bold"
              >
                &times;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProctorSessionDetailPage;
