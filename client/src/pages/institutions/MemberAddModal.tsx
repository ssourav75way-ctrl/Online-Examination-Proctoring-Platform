import { useState } from "react";
import { useSelector } from "react-redux";
import { useLazySearchCandidateQuery } from "@/services/userApi";
import {
  useAddMemberMutation,
  useGetDepartmentsQuery,
} from "@/services/institutionApi";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ApiError } from "@/types/common";
import { RootState } from "@/store";
import { Role } from "@/types/auth";

interface MemberAddModalProps {
  institutionId: string;
  defaultRole?: "ADMIN" | "EXAMINER" | "PROCTOR" | "CANDIDATE";
  onClose: () => void;
  title?: string;
}

export function MemberAddModal({
  institutionId,
  defaultRole = "EXAMINER",
  onClose,
  title = "Add Institution Member",
}: MemberAddModalProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin = user?.globalRole === "SUPER_ADMIN";

  const [email, setEmail] = useState("");
  const [role, setRole] = useState(defaultRole);

  const availableRoles = isSuperAdmin
    ? ["ADMIN"]
    : ["EXAMINER", "PROCTOR", "CANDIDATE"];

  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [searchUser, { data: searchData, isFetching: searchLoading }] =
    useLazySearchCandidateQuery();
  const [addMember, { isLoading: addLoading }] = useAddMemberMutation();
  const { data: deptData } = useGetDepartmentsQuery(institutionId);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    try {
      const result = await searchUser(email).unwrap();
      if (!result.data) {
        setError("No user found with this email.");
      }
    } catch (err) {
      setError("Failed to search for user.");
    }
  };

  const handleAdd = async () => {
    if (!searchData?.data) return;
    setError(null);
    try {
      await addMember({
        institutionId,
        body: {
          userId: searchData.data.id,
          role,
          departmentIds:
            selectedDeptIds.length > 0 ? selectedDeptIds : undefined,
        },
      }).unwrap();
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to add member.";
      setError(errorMsg);
    }
  };

  const toggleDept = (id: string) => {
    setSelectedDeptIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
          <h2 className="text-xl font-bold text-text-main">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main focus:outline-none"
          ></button>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          {availableRoles.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-muted">
                Select Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableRoles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r as typeof role)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      role === r
                        ? "bg-primary-600 text-white shadow-md shadow-primary-200"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {availableRoles.length === 1 && (
            <div className="p-2 bg-primary-50 text-primary-700 text-[10px] font-bold uppercase rounded border border-primary-100 text-center">
              Target Role: {availableRoles[0]}
            </div>
          )}

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                label="User Email"
                id="searchEmail"
                type="email"
                placeholder="user@example.com"
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
                  <p className="text-[10px] font-bold text-primary-600 uppercase mt-1">
                    Global Role: {searchData.data.globalRole}
                  </p>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgb(16,185,129,0.4)]"></div>
              </div>

              {(role === "EXAMINER" || role === "PROCTOR") &&
                deptData?.data &&
                deptData.data.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Department Access (Optional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {deptData.data.map((dept) => (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => toggleDept(dept.id)}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                            selectedDeptIds.includes(dept.id)
                              ? "bg-slate-800 text-white"
                              : "bg-white text-slate-600 border border-slate-200"
                          }`}
                        >
                          {dept.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              <Button
                type="button"
                className="w-full"
                isLoading={addLoading}
                onClick={handleAdd}
              >
                Confirm & Add Member
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
