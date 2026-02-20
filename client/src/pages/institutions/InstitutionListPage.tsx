import { useState } from "react";
import { Link } from "react-router-dom";
import { useGetInstitutionsQuery } from "@/services/institutionApi";
import { Button } from "@/components/common/Button";
import { CONSTANTS } from "@/constants";
import { InstitutionFormModal } from "./InstitutionFormModal";

export function InstitutionListPage() {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, isError, error } = useGetInstitutionsQuery({
    page,
    limit: CONSTANTS.PAGINATION.DEFAULT_LIMIT,
  });

  const getErrorMessage = () => {
    if (!isError) return null;
    if (typeof error === "object" && error && "data" in error) {
      return (
        (error as { data?: { message?: string } }).data?.message ||
        "Failed to load institutions"
      );
    }
    return "An unexpected error occurred while loading institutions.";
  };

  const errorMessage = getErrorMessage();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Institutions</h1>
          <p className="text-text-muted mt-1">
            Manage registered institutions and their access.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Add Institution</Button>
      </div>

      {isLoading && (
        <div className="card p-8 flex justify-center items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {errorMessage}
        </div>
      )}

      {!isLoading && !isError && data?.data && (
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Name
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Code
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Created
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.map((institution) => (
                <tr
                  key={institution.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {institution.name}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">
                    {institution.code}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(institution.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {institution.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/dashboard/institutions/${institution.id}`}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 opacity-0 group-hover:opacity-100 tracking-wide transition-opacity rounded-lg hover:bg-primary-50"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}

              {data.data.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No institutions found. Click "Add Institution" to create
                    one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Page {page} of {data.meta?.totalPages || 1}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= (data.meta?.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <InstitutionFormModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}

export default InstitutionListPage;
