import { useState } from "react";
import { useGetIntegrityReportQuery } from "@/services/analyticsApi";
import { Button } from "@/components/common/Button";

interface IntegrityTabProps {
  examId: string;
}

export default function IntegrityTab({ examId }: IntegrityTabProps) {
  const { data, isLoading, isError } = useGetIntegrityReportQuery({ examId });
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(
    null,
  );

  const reports = data?.data || [];
  const selectedReport = reports.find(
    (r) => r.candidateId === selectedCandidate,
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
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
            ️
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Exam Integrity Summary</h3>
            <p className="text-xs text-slate-500">
              Detection of collusion, timing anomalies, and proctoring
              violations.
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
              {reports.filter((r) => r.integrityScore < 60).length}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-border rounded-xl">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 border-b border-border">
            <tr>
              <th className="px-4 py-4 font-bold text-slate-600 text-[11px] uppercase tracking-wider">
                Candidate
              </th>
              <th className="px-4 py-4 font-bold text-slate-600 text-[11px] uppercase tracking-wider text-center">
                Integrity Score
              </th>
              <th className="px-4 py-4 font-bold text-slate-600 text-[11px] uppercase tracking-wider text-center">
                Proctor Flags
              </th>
              <th className="px-4 py-4 font-bold text-slate-600 text-[11px] uppercase tracking-wider text-center">
                Timing Anom.
              </th>
              <th className="px-4 py-4 font-bold text-slate-600 text-[11px] uppercase tracking-wider text-center">
                Collusion Risk
              </th>
              <th className="px-4 py-4 font-bold text-slate-600 text-[11px] uppercase tracking-wider text-right">
                Evidence
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {reports.map((report) => (
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
                        style={{ width: `${report.collusionScore * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold mt-1 text-slate-500">
                      {(report.collusionScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-[10px] h-8"
                    onClick={() => setSelectedCandidate(report.candidateId)}
                  >
                    Evidence &rarr;
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Integrity Evidence
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedReport.candidateName}
                </p>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                    Timing Anomalies
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {selectedReport.timingAnomalies} instances detected
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                    Tab Switches
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {selectedReport.tabSwitches} switches recorded
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase text-primary-600 tracking-widest mb-4">
                  Proctoring Flags
                </h4>
                {selectedReport.proctorFlags > 0 ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 italic">
                      Visual evidence and detailed violation logs can be viewed
                      in the proctoring dashboard.
                    </div>
                    {}
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <p className="text-sm text-slate-700">
                        Detailed violation records are available in the session
                        proctoring console.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">
                    No proctoring violations flagged.
                  </p>
                )}
              </div>
            </div>
            <div className="p-6 border-t bg-slate-50 flex justify-end">
              <Button onClick={() => setSelectedCandidate(null)}>
                Close Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
