import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  useGetMembersQuery,
  useRemoveMemberMutation,
} from "@/services/institutionApi";
import { Button } from "@/components/common/Button";
import { MemberAddModal } from "../institutions/MemberAddModal";
import { useInstitution } from "@/contexts/InstitutionContext";

export default function UserManagementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<
    "EXAMINER" | "PROCTOR" | "CANDIDATE" | undefined
  >();
  const user = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin = user?.globalRole === "SUPER_ADMIN";
  const { institutionId } = useInstitution();

  const {
    data: memberData,
    isLoading,
    refetch,
  } = useGetMembersQuery(
    { institutionId: institutionId || "", limit: 100 },
    { skip: !institutionId },
  );

  const [removeMember] = useRemoveMemberMutation();

  const handleRemove = async (userId: string) => {
    if (
      confirm("Are you sure you want to remove this user from the institution?")
    ) {
      await removeMember({ institutionId: institutionId!, userId }).unwrap();
      refetch();
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "EXAMINER":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "PROCTOR":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "CANDIDATE":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (isLoading)
    return (
      <div className="text-center p-12 text-text-muted">Loading users...</div>
    );

  const members = memberData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">User Management</h1>
          <p className="text-text-muted mt-1">
            Manage examiners, proctors, and candidates for your institution.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedRole("EXAMINER");
              setIsModalOpen(true);
            }}
          >
            Add Examiner
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedRole("PROCTOR");
              setIsModalOpen(true);
            }}
          >
            Add Proctor
          </Button>
          <Button
            onClick={() => {
              setSelectedRole("CANDIDATE");
              setIsModalOpen(true);
            }}
          >
            Add Candidate
          </Button>
        </div>
      </div>

      <div className="card overflow-hidden border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-muted">
                  User
                </th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-muted">
                  Role
                </th>
                {!isSuperAdmin && (
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-muted">
                    Departments
                  </th>
                )}
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-muted">
                  Joined
                </th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-muted text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.length > 0 ? (
                members.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-background/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-text-main">
                          {member.user.firstName} {member.user.lastName}
                        </span>
                        <span className="text-xs text-text-muted">
                          {member.user.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${getRoleBadgeColor(member.role)}`}
                      >
                        {member.role}
                      </span>
                    </td>
                    {!isSuperAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {member.departmentAccess.length > 0 ? (
                            member.departmentAccess.map((da) => (
                              <span
                                key={da.department.id}
                                className="text-[11px] bg-background px-1.5 py-0.5 rounded border border-border text-text-muted"
                              >
                                {da.department.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-text-muted italic">
                              All Departments / None
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-text-muted">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {member.role !== "ADMIN" && (
                        <button
                          onClick={() => handleRemove(member.user.id)}
                          className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-text-muted font-medium"
                  >
                    No members found in this institution.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <MemberAddModal
          institutionId={institutionId || ""}
          defaultRole={selectedRole}
          onClose={() => {
            setIsModalOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
