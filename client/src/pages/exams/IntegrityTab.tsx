import { useState, useMemo } from "react";
import { useGetIntegrityReportQuery } from "@/services/analyticsApi";
import { Button } from "@/components/common/Button";

interface IntegrityTabProps {
  examId: string;
}

type SortKey =
  | "candidateName"
  | "integrityScore"
  | "proctorFlags"
  | "timingAnomalies"
  | "collusionScore"
  | "tabSwitches";
type SortDir = "asc" | "desc";

function EvidenceDrillDown({
  evidenceIds,
  candidateName,
  report,
  onClose,
}: {
  evidenceIds: string[];
  candidateName: string;
  report: {
    integrityScore: number;
    proctorFlags: number;
    timingAnomalies: number;
    collusionScore: number;
    tabSwitches: number;
  };
  onClose: () => void;
}) {
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<
    "summary" | "flags" | "timeline"
  >("summary");

  const scoreColor =
    report.integrityScore >= 85
      ? "text-emerald-600"
      : report.integrityScore >= 60
        ? "text-amber-600"
        : "text-rose-600";
  const scoreBg =
    report.integrityScore >= 85
      ? "bg-emerald-50 border-emerald-200"
      : report.integrityScore >= 60
        ? "bg-amber-50 border-amber-200"
        : "bg-rose-50 border-rose-200";

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        {}
        <div className="p-6 border-b flex justify-between items-start bg-slate-50">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Integrity Evidence Report
            </h3>
            <p className="text-sm text-slate-500 mt-1">{candidateName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {}
        <div className="flex border-b border-slate-200 px-6">
          {(["summary", "flags", "timeline"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveEvidenceTab(tab)}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeEvidenceTab === tab
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab === "summary"
                ? "Risk Summary"
                : tab === "flags"
                  ? `Evidence (${evidenceIds.length})`
                  : "Breakdown"}
            </button>
          ))}
        </div>

        {}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeEvidenceTab === "summary" && (
            <>
              {}
              <div
                className={`p-6 rounded-2xl border-2 ${scoreBg} flex items-center gap-6`}
              >
                <div
                  className={`w-20 h-20 rounded-full border-4 ${scoreBg} flex items-center justify-center`}
                >
                  <span className={`text-3xl font-black ${scoreColor}`}>
                    {report.integrityScore}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-lg text-slate-900">
                    Integrity Score
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {report.integrityScore >= 85
                      ? "Low risk — no significant anomalies detected."
                      : report.integrityScore >= 60
                        ? "Moderate risk — some anomalies require attention."
                        : "High risk — multiple indicators of potential dishonesty."}
                  </p>
                </div>
              </div>

              {}
              <div className="grid grid-cols-2 gap-4">
                <FactorCard
                  label="Proctor Flags"
                  value={report.proctorFlags}
                  severity={
                    report.proctorFlags > 5
                      ? "high"
                      : report.proctorFlags > 2
                        ? "medium"
                        : "low"
                  }
                  detail={`${report.proctorFlags} proctoring flag(s) raised during the session. Each flag deducts from the integrity score based on severity.`}
                />
                <FactorCard
                  label="Timing Anomalies"
                  value={report.timingAnomalies}
                  severity={
                    report.timingAnomalies > 3
                      ? "high"
                      : report.timingAnomalies > 0
                        ? "medium"
                        : "low"
                  }
                  detail="Questions with difficulty ≥ 7 answered in under 5 seconds. Suggests possible prior knowledge or external assistance."
                />
                <FactorCard
                  label="Tab Switches"
                  value={report.tabSwitches}
                  severity={
                    report.tabSwitches > 3
                      ? "high"
                      : report.tabSwitches > 1
                        ? "medium"
                        : "low"
                  }
                  detail="Number of times the candidate switched away from the exam tab. Could indicate consulting external resources."
                />
                <FactorCard
                  label="Collusion Risk"
                  value={`${(report.collusionScore * 100).toFixed(0)}%`}
                  severity={
                    report.collusionScore > 0.7
                      ? "high"
                      : report.collusionScore > 0.3
                        ? "medium"
                        : "low"
                  }
                  detail="Cosine similarity of answer patterns compared with nearby candidates. High similarity may indicate answer sharing."
                />
              </div>
            </>
          )}

          {activeEvidenceTab === "flags" && (
            <>
              {evidenceIds.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  No proctor flag evidence recorded for this candidate.
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 font-medium">
                    {evidenceIds.length} proctor flag(s) associated with this
                    candidate&apos;s session. Each flag ID below links to a
                    specific event.
                  </p>
                  {evidenceIds.map((flagId, idx) => (
                    <div
                      key={flagId}
                      className="flex items-center gap-4 p-4 border border-border rounded-xl hover:shadow-sm transition-shadow"
                    >
                      <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-mono text-xs text-slate-600">
                          Flag ID: {flagId}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          View in Proctor Session Detail for full snapshot and
                          review notes
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                        EVIDENCE
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeEvidenceTab === "timeline" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-medium">
                Score deduction breakdown showing how each factor contributed to
                the final integrity score.
              </p>
              <div className="relative">
                {}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />

                <div className="space-y-6">
                  <TimelineItem
                    label="Base Score"
                    value="100"
                    deduction=""
                    color="bg-emerald-500"
                  />
                  {report.proctorFlags > 0 && (
                    <TimelineItem
                      label={`${report.proctorFlags} Proctor Flag(s)`}
                      value={`-${report.proctorFlags * 5}`}
                      deduction="5 pts per severity unit"
                      color="bg-amber-500"
                    />
                  )}
                  {report.timingAnomalies > 0 && (
                    <TimelineItem
                      label={`${report.timingAnomalies} Timing Anomaly(ies)`}
                      value={`-${report.timingAnomalies * 8}`}
                      deduction="8 pts each"
                      color="bg-orange-500"
                    />
                  )}
                  {report.tabSwitches > 0 && (
                    <TimelineItem
                      label={`${report.tabSwitches} Tab Switch(es)`}
                      value={`-${report.tabSwitches * 6}`}
                      deduction="6 pts each"
                      color="bg-blue-500"
                    />
                  )}
                  {report.collusionScore > 0 && (
                    <TimelineItem
                      label={`Collusion Score: ${(report.collusionScore * 100).toFixed(0)}%`}
                      value={`-${Math.round(report.collusionScore * 30)}`}
                      deduction="Up to 30 pts"
                      color="bg-rose-500"
                    />
                  )}
                  <TimelineItem
                    label="Final Integrity Score"
                    value={String(report.integrityScore)}
                    deduction=""
                    color={
                      report.integrityScore >= 85
                        ? "bg-emerald-500"
                        : report.integrityScore >= 60
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    }
                    isFinal
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {}
        <div className="p-6 border-t bg-slate-50 flex justify-end">
          <Button onClick={onClose}>Close Report</Button>
        </div>
      </div>
    </div>
  );
}

function FactorCard({
  label,
  value,
  severity,
  detail,
}: {
  label: string;
  value: string | number;
  severity: "low" | "medium" | "high";
  detail: string;
}) {
  const colors = {
    low: "border-emerald-200 bg-emerald-50",
    medium: "border-amber-200 bg-amber-50",
    high: "border-rose-200 bg-rose-50",
  };
  const textColors = {
    low: "text-emerald-700",
    medium: "text-amber-700",
    high: "text-rose-700",
  };
  const badges = {
    low: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-rose-100 text-rose-700",
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[severity]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <span
          className={`px-1.5 py-0.5 rounded text-[9px] font-black ${badges[severity]}`}
        >
          {severity.toUpperCase()}
        </span>
      </div>
      <p className={`text-2xl font-black ${textColors[severity]}`}>{value}</p>
      <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
        {detail}
      </p>
    </div>
  );
}

function TimelineItem({
  label,
  value,
  deduction,
  color,
  isFinal,
}: {
  label: string;
  value: string;
  deduction: string;
  color: string;
  isFinal?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 relative">
      <div
        className={`w-10 h-10 rounded-full ${color} flex items-center justify-center z-10 ${isFinal ? "ring-4 ring-white shadow-md" : ""}`}
      >
        <span
          className={`text-white font-black text-xs ${isFinal ? "text-sm" : ""}`}
        >
          {value}
        </span>
      </div>
      <div>
        <p
          className={`font-bold text-slate-900 ${isFinal ? "text-lg" : "text-sm"}`}
        >
          {label}
        </p>
        {deduction && <p className="text-[10px] text-slate-400">{deduction}</p>}
      </div>
    </div>
  );
}

export default function IntegrityTab({ examId }: IntegrityTabProps) {
  const { data, isLoading, isError } = useGetIntegrityReportQuery({ examId });
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(
    null,
  );
  const [sortKey, setSortKey] = useState<SortKey>("integrityScore");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const reports = data?.data || [];
  const selectedReport = reports.find(
    (r: any) => r.candidateId === selectedCandidate,
  );

  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => {
      let comparison = 0;
      if (sortKey === "candidateName") {
        comparison = a.candidateName.localeCompare(b.candidateName);
      } else {
        comparison = (a[sortKey] as number) - (b[sortKey] as number);
      }
      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [reports, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "integrityScore" ? "asc" : "desc");
    }
  };

  const SortHeader = ({
    label,
    columnKey,
    center,
  }: {
    label: string;
    columnKey: SortKey;
    center?: boolean;
  }) => (
    <th
      onClick={() => handleSort(columnKey)}
      className={`px-4 py-4 font-bold text-slate-600 text-[11px] uppercase tracking-wider cursor-pointer hover:text-primary-600 transition-colors select-none ${center ? "text-center" : ""}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === columnKey && (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 12">
            {sortDir === "asc" ? (
              <path d="M6 2l4 5H2z" />
            ) : (
              <path d="M6 10l4-5H2z" />
            )}
          </svg>
        )}
      </span>
    </th>
  );

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
        Failed to load integrity report. Generate results first to enable
        analysis.
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        No completed enrollments found to analyze.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-primary-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Exam Integrity Report</h3>
            <p className="text-xs text-slate-500">
              Sortable table with drill-down to evidence for each candidate.
              Click column headers to sort.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase text-slate-400">
              Total Analyzed
            </p>
            <p className="text-lg font-black text-slate-700">
              {reports.length}
            </p>
          </div>
          <div className="text-center border-l pl-4 border-slate-200">
            <p className="text-[10px] font-black uppercase text-slate-400">
              High Risk
            </p>
            <p className="text-lg font-black text-rose-600">
              {reports.filter((r: any) => r.integrityScore < 60).length}
            </p>
          </div>
          <div className="text-center border-l pl-4 border-slate-200">
            <p className="text-[10px] font-black uppercase text-slate-400">
              Avg Score
            </p>
            <p className="text-lg font-black text-primary-600">
              {reports.length > 0
                ? Math.round(
                    reports.reduce(
                      (s: number, r: any) => s + r.integrityScore,
                      0,
                    ) / reports.length,
                  )
                : 0}
            </p>
          </div>
        </div>
      </div>

      {}
      <div className="overflow-x-auto border border-border rounded-xl">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 border-b border-border">
            <tr>
              <SortHeader label="Candidate" columnKey="candidateName" />
              <SortHeader
                label="Integrity Score"
                columnKey="integrityScore"
                center
              />
              <SortHeader
                label="Proctor Flags"
                columnKey="proctorFlags"
                center
              />
              <SortHeader
                label="Timing Anom."
                columnKey="timingAnomalies"
                center
              />
              <SortHeader
                label="Collusion Risk"
                columnKey="collusionScore"
                center
              />
              <SortHeader label="Tab Switches" columnKey="tabSwitches" center />
              <th className="px-4 py-4 font-bold text-slate-600 text-[11px] uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {sortedReports.map((report) => (
              <tr
                key={report.candidateId}
                className={`hover:bg-slate-50 transition-colors ${report.integrityScore < 60 ? "bg-rose-50/30" : ""}`}
              >
                <td className="px-4 py-4">
                  <div className="font-bold text-slate-900">
                    {report.candidateName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">
                    ID: {report.candidateId.split("-")[0]}
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-full font-black border-2 ${
                      report.integrityScore >= 85
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : report.integrityScore >= 60
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {report.integrityScore}
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${report.proctorFlags > 3 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {report.proctorFlags}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${report.timingAnomalies > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {report.timingAnomalies}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${report.collusionScore > 0.7 ? "bg-rose-500" : report.collusionScore > 0.3 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{
                          width: `${report.collusionScore * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold mt-1 text-slate-500">
                      {(report.collusionScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${report.tabSwitches > 3 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {report.tabSwitches}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-[10px] h-8"
                    onClick={() => setSelectedCandidate(report.candidateId)}
                  >
                    Drill Down &rarr;
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {}
      {selectedReport && (
        <EvidenceDrillDown
          evidenceIds={selectedReport.evidenceIds}
          candidateName={selectedReport.candidateName}
          report={selectedReport}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
}
