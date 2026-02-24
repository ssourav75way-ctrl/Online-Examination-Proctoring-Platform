import { useState } from "react";
import { useInstitution } from "@/contexts/InstitutionContext";
import { useGetDepartmentsQuery } from "@/services/institutionApi";
import { Button } from "@/components/common/Button";
import { DepartmentFormModal } from "./DepartmentFormModal";

export default function DepartmentListPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { institutionId } = useInstitution();

  const {
    data: departmentResponse,
    isLoading,
    refetch,
  } = useGetDepartmentsQuery(institutionId || "", { skip: !institutionId });

  const departments = departmentResponse?.data || [];

  if (isLoading)
    return (
      <div className="text-center p-12 text-text-muted">
        Loading departments...
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Departments</h1>
          <p className="text-text-muted mt-1">
            Manage your institution's departments and curriculum areas.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Add Department</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.length > 0 ? (
          departments.map((dept) => (
            <div
              key={dept.id}
              className="card p-6 border border-border hover:border-primary-300 transition-colors shadow-sm bg-surface"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-primary-50 text-primary-700 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border border-primary-100 uppercase">
                  {dept.code.substring(0, 2)}
                </div>
                <span className="text-xs font-mono bg-background px-2 py-1 rounded border border-border text-text-muted">
                  {dept.code}
                </span>
              </div>
              <h3 className="text-lg font-bold text-text-main mb-2">
                {dept.name}
              </h3>
              <div className="flex items-center justify-between text-sm text-text-muted">
                <span>{dept._count?.questionPools || 0} Question Pools</span>
                <span className="h-1 w-1 bg-border rounded-full"></span>
                <span>
                  Created {new Date(dept.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full card p-12 text-center border-dashed border-2 border-border bg-background/50">
            <p className="text-text-muted mb-4 font-medium">
              No departments found for this institution.
            </p>
            <Button variant="ghost" onClick={() => setIsModalOpen(true)}>
              Create your first department
            </Button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <DepartmentFormModal
          institutionId={institutionId || ""}
          onClose={() => {
            setIsModalOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
