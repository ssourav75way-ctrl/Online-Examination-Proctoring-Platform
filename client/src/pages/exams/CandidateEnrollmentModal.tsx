import { useState } from "react";
import { useLazySearchCandidateQuery } from "@/services/userApi";
import { useEnrollCandidateMutation } from "@/services/examApi";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";

interface CandidateEnrollmentModalProps {
  institutionId: string;
  examId: string;
  onClose: () => void;
}

export function CandidateEnrollmentModal({
  institutionId,
  examId,
  onClose,
}: CandidateEnrollmentModalProps) {
  const [email, setEmail] = useState("");
  const [searchUser, { data: searchData, isFetching: searchLoading }] =
    useLazySearchCandidateQuery();
  const [enrollCandidate, { isLoading: enrollLoading }] =
    useEnrollCandidateMutation();
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    try {
      const result = await searchUser(email).unwrap();
      if (!result.data) {
        setError("No user found with this email.");
      } else if (result.data.globalRole !== "CANDIDATE") {
        setError("This user is not registered as a candidate.");
      }
    } catch (err) {
      setError("Failed to search for user.");
    }
  };

  const handleEnroll = async () => {
    if (!searchData?.data) return;
    setError(null);
    try {
      await enrollCandidate({
        institutionId,
        examId,
        candidateId: searchData.data.id,
      }).unwrap();
      onClose();
    } catch (err: any) {
      setError(err?.data?.message || "Failed to enroll candidate.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
          <h2 className="text-xl font-bold text-text-main">Enroll Candidate</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main focus:outline-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                label="Candidate Email"
                id="candidateEmail"
                type="email"
                placeholder="candidate@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              isLoading={searchLoading}
              disabled={!email}
            >
              Search
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          {searchData?.data && !error && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">
                    {searchData.data.firstName} {searchData.data.lastName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {searchData.data.email}
                  </p>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgb(16,185,129,0.4)]"></div>
              </div>

              <Button
                type="button"
                className="w-full"
                isLoading={enrollLoading}
                onClick={handleEnroll}
              >
                Confirm Enrollment
              </Button>
            </div>
          )}
        </form>

        <div className="flex justify-end pt-4 border-t border-border mt-6">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
