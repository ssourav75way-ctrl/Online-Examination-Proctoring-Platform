import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetInstitutionByIdQuery,
  useGetDepartmentsQuery,
  useGetMembersQuery,
} from "@/services/institutionApi";
import { Button } from "@/components/common/Button";
import { DepartmentFormModal } from "./DepartmentFormModal";
import { MemberAddModal } from "./MemberAddModal";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

export function InstitutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  const user = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin = user?.globalRole === "SUPER_ADMIN";

  const {
    data: instData,
    isLoading: instLoading,
    isError: instError,
  } = useGetInstitutionByIdQuery(id as string, {
    skip: !id,
  });

  const { data: deptData, isLoading: deptLoading } = useGetDepartmentsQuery(
    id as string,
    {
      skip: !id,
    },
  );

  const { data: memberData, isLoading: memberLoading } = useGetMembersQuery(
    { institutionId: id as string, page: 1, limit: 100 },
    { skip: !id || !isSuperAdmin },
  );

  const isLoading =
    instLoading || deptLoading || (isSuperAdmin && memberLoading);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  if (instError || !instData?.data) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
        Failed to load institution details.
      </div>
    );
  }

  const institution = instData.data;
  const departments = deptData?.data || [];
  const members = memberData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/dashboard/institutions")}
          >
            &larr; Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-main">
              {institution.name}
            </h1>
            <p className="text-text-muted mt-1 font-mono text-sm">
              Code: {institution.code}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isSuperAdmin && (
            <Button
              variant="secondary"
              onClick={() => setIsMemberModalOpen(true)}
            >
              Add Admin
            </Button>
          )}
          {!isSuperAdmin && (
            <Button onClick={() => setIsDeptModalOpen(true)}>
              Add Department
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 p-8 flex flex-col h-full">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Contact Info
          </h2>
          <div className="space-y-4 text-sm flex-1">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 border-dashed">
              <span className="text-slate-500 font-medium tracking-wide uppercase text-xs">
                Code
              </span>
              <span className="font-semibold text-slate-900 font-mono">
                {institution.code}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 border-dashed">
              <span className="text-slate-500 font-medium tracking-wide uppercase text-xs">
                Created
              </span>
              <span className="font-semibold text-slate-900">
                {new Date(institution.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 border-dashed">
              <span className="text-slate-500 font-medium tracking-wide uppercase text-xs">
                Updated
              </span>
              <span className="font-semibold text-slate-900">
                {new Date(institution.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium tracking-wide uppercase text-xs">
                Status
              </span>
              <span className="font-medium">
                {institution.isActive ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                    Inactive
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 p-8 flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-primary-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              Departments
            </h2>
            <span className="bg-slate-100 text-slate-600 font-bold px-2.5 py-1.5 rounded-lg text-xs">
              {departments.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {departments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 border border-slate-100 border-dashed rounded-xl h-full">
                <svg
                  className="w-8 h-8 text-slate-300 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="text-slate-500 font-medium text-sm">
                  No departments found.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {departments.map((dept) => (
                  <li
                    key={dept.id}
                    className="group flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all duration-200"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block group-hover:text-primary-700 transition-colors">
                        {dept.name}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-500 mt-0.5 inline-block">
                        DEP-{dept.code}
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 tracking-wide transition-opacity"
                      onClick={() =>
                        navigate(`/dashboard/questions?departmentId=${dept.id}`)
                      }
                    >
                      View
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {isSuperAdmin && (
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 p-8 flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-primary-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Institution Members
              </h2>
              <span className="bg-primary-50 text-primary-600 font-bold px-2.5 py-1.5 rounded-lg text-xs">
                {members.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              {members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 border border-slate-100 border-dashed rounded-xl h-full">
                  <p className="text-slate-500 font-medium text-sm">
                    No members yet.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {members.map((m) => (
                    <li
                      key={m.id}
                      className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">
                          {m.user.firstName} {m.user.lastName}
                        </span>
                        <span className="text-xs font-bold text-primary-600 uppercase tracking-tight">
                          {m.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {m.user.email}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {isDeptModalOpen && id && (
        <DepartmentFormModal
          institutionId={id}
          onClose={() => setIsDeptModalOpen(false)}
        />
      )}

      {isMemberModalOpen && id && (
        <MemberAddModal
          institutionId={id}
          defaultRole="ADMIN"
          title="Assign Institution Admin"
          onClose={() => setIsMemberModalOpen(false)}
        />
      )}
    </div>
  );
}

export default InstitutionDetailPage;
