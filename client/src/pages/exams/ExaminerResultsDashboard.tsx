import { useNavigate } from "react-router-dom";
import { useInstitution } from "@/contexts/InstitutionContext";
import { useGetExamsByInstitutionQuery } from "@/services/examApi";
import { Button } from "@/components/common/Button";
import { formatDateIST } from "@/utils/dateFormat";
import { Exam } from "@/types/exam";

export default function ExaminerResultsDashboard() {
  const navigate = useNavigate();
  const { institutionId } = useInstitution();

  const page = 1;

  const { data, isLoading, isError } = useGetExamsByInstitutionQuery(
    { institutionId, page, limit: 15 },
    { skip: !institutionId },
  );

  const exams = data?.data || [];
  const completedExams = exams.filter(
    (ex: Exam) =>
      ex.status === "COMPLETED" ||
      ex.status === "IN_PROGRESS" ||
      ex.status === "SCHEDULED",
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">
            Results & Publishing
          </h1>
          <p className="text-text-muted mt-1">
            Manage results and re-evaluation requests for your exams.
          </p>
        </div>
      </div>

      <div className="card p-6 bg-white border border-border/60 shadow-sm">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
          </div>
        ) : isError ? (
          <div className="text-center text-red-600 py-10">
            Failed to load exams
          </div>
        ) : completedExams.length === 0 ? (
          <div className="text-center text-slate-500 py-10">
            No ongoing or completed exams available for results management.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold">Exam Title</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Ended At</th>
                  <th className="px-4 py-3 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {completedExams.map((exam: Exam) => (
                  <tr
                    key={exam.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {exam.title}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          exam.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-700"
                            : exam.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {exam.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDateIST(exam.scheduledEndTime)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          navigate(`/dashboard/exams/${exam.id}/results`)
                        }
                      >
                        Manage Results
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
