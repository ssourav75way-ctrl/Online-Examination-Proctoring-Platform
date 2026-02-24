import { useState } from "react";
import {
  useGetAccommodationAuditTrailQuery,
  useGetCandidateAccommodationsQuery,
  useGrantAccommodationMutation,
  useRevokeAccommodationMutation,
  useModifyAccommodationMutation,
  Accommodation,
  AccommodationAudit,
} from "@/services/accommodationApi";
import { useLazySearchCandidateQuery } from "@/services/userApi";
import { useInstitution } from "@/contexts/InstitutionContext";
import { Button } from "@/components/common/Button";
import { formatDateIST as formatDate } from "@/utils/dateFormat";

const typeLabels: Record<string, { label: string; badge: string }> = {
  NONE: { label: "None", badge: "bg-slate-100 text-slate-600" },
  TIME_1_5X: {
    label: "1.5× Time",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  TIME_2X: {
    label: "2× Time",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
  },
};

const actionLabels: Record<string, { label: string; color: string }> = {
  GRANTED: { label: "Granted", color: "text-emerald-600" },
  REVOKED: { label: "Revoked", color: "text-rose-600" },
  MODIFIED: { label: "Modified", color: "text-blue-600" },
};

export function AccommodationManagementPage() {
  const { institutionId } = useInstitution();

  const [searchEmail, setSearchEmail] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    null,
  );
  const [selectedCandidateName, setSelectedCandidateName] = useState("");

  const [showGrantForm, setShowGrantForm] = useState(false);
  const [grantType, setGrantType] = useState("TIME_1_5X");
  const [grantReason, setGrantReason] = useState("");
  const [grantValidFrom, setGrantValidFrom] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [grantValidUntil, setGrantValidUntil] = useState("");

  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [modifyAccom, setModifyAccom] = useState<Accommodation | null>(null);
  const [modifyType, setModifyType] = useState("TIME_1_5X");

  const [auditPage, setAuditPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"manage" | "audit">("manage");

  const [searchCandidate, { data: searchResult, isFetching: searching }] =
    useLazySearchCandidateQuery();
  const { data: accommodationsData, isLoading: loadingAccommodations } =
    useGetCandidateAccommodationsQuery(
      { candidateId: selectedCandidateId as string },
      { skip: !selectedCandidateId },
    );
  const { data: auditData, isLoading: loadingAudit } =
    useGetAccommodationAuditTrailQuery({
      page: auditPage,
      limit: 15,
      candidateId: selectedCandidateId || undefined,
    });
  const [grantAccommodation, { isLoading: granting }] =
    useGrantAccommodationMutation();
  const [revokeAccommodation, { isLoading: revoking }] =
    useRevokeAccommodationMutation();
  const [modifyAccommodation, { isLoading: modifying }] =
    useModifyAccommodationMutation();

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    const result = await searchCandidate(searchEmail).unwrap();
    if (result?.data) {
      setSelectedCandidateId(result.data.id);
      setSelectedCandidateName(
        `${result.data.firstName} ${result.data.lastName}`,
      );
    } else {
      setFeedback({ type: "error", msg: "No candidate found with that email" });
    }
  };

  const handleGrant = async () => {
    if (!selectedCandidateId || !grantReason.trim()) return;
    try {
      await grantAccommodation({
        candidateId: selectedCandidateId,
        type: grantType,
        reason: grantReason,
        validFrom: new Date(grantValidFrom).toISOString(),
        validUntil: grantValidUntil
          ? new Date(grantValidUntil).toISOString()
          : undefined,
      }).unwrap();
      setFeedback({
        type: "success",
        msg: "Accommodation granted successfully",
      });
      setShowGrantForm(false);
      setGrantReason("");
    } catch {
      setFeedback({
        type: "error",
        msg: "Failed to grant accommodation",
      });
    }
  };

  const handleRevoke = async () => {
    if (!revokeId || !revokeReason.trim()) return;
    try {
      await revokeAccommodation({
        id: revokeId,
        reason: revokeReason,
      }).unwrap();
      setFeedback({ type: "success", msg: "Accommodation revoked" });
      setRevokeId(null);
      setRevokeReason("");
    } catch {
      setFeedback({ type: "error", msg: "Failed to revoke accommodation" });
    }
  };

  const handleModify = async () => {
    if (!modifyAccom) return;
    try {
      await modifyAccommodation({
        id: modifyAccom.id,
        body: { type: modifyType as Accommodation["type"] },
      }).unwrap();
      setFeedback({ type: "success", msg: "Accommodation updated" });
      setModifyAccom(null);
    } catch {
      setFeedback({ type: "error", msg: "Failed to modify accommodation" });
    }
  };

  const accommodations = accommodationsData?.data || [];
  const auditEntries = auditData?.data || [];
  const auditTotalPages = auditData?.meta?.totalPages || 1;

  const tabClasses = (tab: string) =>
    `px-6 py-3 text-sm font-bold transition-all border-b-2 ${
      activeTab === tab
        ? "border-primary-600 text-primary-600"
        : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
    }`;

  void institutionId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">
          Accommodation Management
        </h1>
        <p className="text-text-muted mt-1">
          Grant, modify, or revoke exam accommodations for candidates with
          documented needs.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-sm font-medium flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          <span>{feedback.msg}</span>
          <button
            onClick={() => setFeedback(null)}
            className="font-bold hover:opacity-70"
          >
            &times;
          </button>
        </div>
      )}

      <div className="card p-6 border border-border/60">
        <h3 className="font-bold text-text-main mb-4 text-sm uppercase tracking-wider">
          Find Candidate
        </h3>
        <div className="flex gap-3">
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by candidate email..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
          <Button onClick={handleSearch} isLoading={searching} size="sm">
            Search
          </Button>
        </div>
        {searchResult?.data && selectedCandidateId && (
          <div className="mt-4 p-4 bg-primary-50 border border-primary-100 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-bold text-primary-800">
                {selectedCandidateName}
              </p>
              <p className="text-xs text-primary-600 font-medium">
                {searchResult.data.email} &middot; ID:{" "}
                {selectedCandidateId.slice(0, 8)}...
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setShowGrantForm(true);
                setFeedback(null);
              }}
            >
              + Grant Accommodation
            </Button>
          </div>
        )}
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("manage")}
          className={tabClasses("manage")}
        >
          Active Accommodations (
          {accommodations.filter((a) => a.isActive).length})
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={tabClasses("audit")}
        >
          Audit Trail
        </button>
      </div>

      {activeTab === "manage" && (
        <div className="space-y-4">
          {!selectedCandidateId && (
            <div className="card p-12 text-center text-slate-500">
              Search for a candidate above to view their accommodations.
            </div>
          )}

          {selectedCandidateId && loadingAccommodations && (
            <div className="card p-8 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
          )}

          {selectedCandidateId && !loadingAccommodations && (
            <>
              {accommodations.length === 0 ? (
                <div className="card p-12 text-center text-slate-500">
                  No accommodations found for this candidate.
                </div>
              ) : (
                <div className="space-y-3">
                  {accommodations.map((accom: Accommodation) => {
                    const typeInfo = typeLabels[accom.type] || typeLabels.NONE;
                    return (
                      <div
                        key={accom.id}
                        className={`card p-5 border-l-4 ${accom.isActive ? "border-l-emerald-500" : "border-l-slate-300"} hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${typeInfo.badge}`}
                              >
                                {typeInfo.label}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                  accom.isActive
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {accom.isActive ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700">
                              <strong>Reason:</strong> {accom.reason}
                            </p>
                            <div className="flex gap-4 text-xs text-slate-500">
                              <span>
                                Valid from: {formatDate(accom.validFrom)}
                              </span>
                              {accom.validUntil && (
                                <span>
                                  Valid until: {formatDate(accom.validUntil)}
                                </span>
                              )}
                              <span>
                                Granted: {formatDate(accom.createdAt)}
                              </span>
                            </div>
                            {accom.approvedBy && (
                              <p className="text-xs text-slate-400">
                                Approved by: {accom.approvedBy.firstName}{" "}
                                {accom.approvedBy.lastName}
                              </p>
                            )}
                          </div>
                          {accom.isActive && (
                            <div className="flex gap-2 shrink-0">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setModifyAccom(accom);
                                  setModifyType(accom.type);
                                }}
                              >
                                Modify
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setRevokeId(accom.id)}
                              >
                                Revoke
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "audit" && (
        <div className="space-y-4">
          {loadingAudit && (
            <div className="card p-8 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
          )}
          {!loadingAudit && (
            <>
              {auditEntries.length === 0 ? (
                <div className="card p-12 text-center text-slate-500">
                  No audit trail entries found.
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Action</th>
                        <th className="px-6 py-4 font-semibold">
                          Performed By
                        </th>
                        <th className="px-6 py-4 font-semibold">Details</th>
                        <th className="px-6 py-4 font-semibold">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditEntries.map((entry: AccommodationAudit) => {
                        const actionInfo =
                          actionLabels[entry.action] || actionLabels.MODIFIED;
                        return (
                          <tr
                            key={entry.id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <span className={`font-bold ${actionInfo.color}`}>
                                {actionInfo.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-medium">
                              {entry.performedBy
                                ? `${entry.performedBy.firstName} ${entry.performedBy.lastName}`
                                : "System"}
                            </td>
                            <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                              {entry.details || "—"}
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                              {formatDate(entry.timestamp)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {auditTotalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-500">
                        Page {auditPage} of {auditTotalPages}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={auditPage === 1}
                          onClick={() => setAuditPage((p) => p - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={auditPage >= auditTotalPages}
                          onClick={() => setAuditPage((p) => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showGrantForm && selectedCandidateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
              <h2 className="text-xl font-bold text-text-main">
                Grant Accommodation
              </h2>
              <button
                onClick={() => setShowGrantForm(false)}
                className="text-text-muted hover:text-text-main focus:outline-none text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-text-muted">
                Granting to:{" "}
                <strong className="text-text-main">
                  {selectedCandidateName}
                </strong>
              </p>

              <div>
                <label className="block text-sm font-bold text-text-main mb-1">
                  Accommodation Type
                </label>
                <select
                  value={grantType}
                  onChange={(e) => setGrantType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                >
                  <option value="TIME_1_5X">1.5× Extended Time</option>
                  <option value="TIME_2X">2× Extended Time</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-text-main mb-1">
                  Justification / Reason
                </label>
                <textarea
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="Medical certificate, documented learning disability, etc."
                  className="w-full h-24 px-4 py-2.5 rounded-lg border border-border bg-background text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-text-main mb-1">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={grantValidFrom}
                    onChange={(e) => setGrantValidFrom(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-main mb-1">
                    Valid Until (optional)
                  </label>
                  <input
                    type="date"
                    value={grantValidUntil}
                    onChange={(e) => setGrantValidUntil(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowGrantForm(false)}
                  disabled={granting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGrant}
                  isLoading={granting}
                  disabled={!grantReason.trim()}
                >
                  Grant Accommodation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {revokeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
              <h2 className="text-xl font-bold text-rose-700">
                Revoke Accommodation
              </h2>
              <button
                onClick={() => {
                  setRevokeId(null);
                  setRevokeReason("");
                }}
                className="text-text-muted hover:text-text-main focus:outline-none text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-text-muted">
                This action will immediately deactivate the accommodation. The
                candidate will no longer receive the time adjustment on future
                exams.
              </p>
              <div>
                <label className="block text-sm font-bold text-text-main mb-1">
                  Reason for Revocation
                </label>
                <textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Explain why this accommodation is being revoked..."
                  className="w-full h-24 px-4 py-2.5 rounded-lg border border-border bg-background text-text-main focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setRevokeId(null);
                    setRevokeReason("");
                  }}
                  disabled={revoking}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleRevoke}
                  isLoading={revoking}
                  disabled={!revokeReason.trim()}
                >
                  Confirm Revoke
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modifyAccom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
              <h2 className="text-xl font-bold text-text-main">
                Modify Accommodation
              </h2>
              <button
                onClick={() => setModifyAccom(null)}
                className="text-text-muted hover:text-text-main focus:outline-none text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-text-muted">
                Current type:{" "}
                <strong className="text-text-main">
                  {typeLabels[modifyAccom.type]?.label || modifyAccom.type}
                </strong>
              </p>
              <div>
                <label className="block text-sm font-bold text-text-main mb-1">
                  New Accommodation Type
                </label>
                <select
                  value={modifyType}
                  onChange={(e) => setModifyType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                >
                  <option value="TIME_1_5X">1.5× Extended Time</option>
                  <option value="TIME_2X">2× Extended Time</option>
                  <option value="NONE">None</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
                <Button
                  variant="ghost"
                  onClick={() => setModifyAccom(null)}
                  disabled={modifying}
                >
                  Cancel
                </Button>
                <Button onClick={handleModify} isLoading={modifying}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccommodationManagementPage;
