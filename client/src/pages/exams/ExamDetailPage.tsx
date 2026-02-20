import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetExamByIdQuery,
  useGetEnrollmentsQuery,
} from "@/services/examApi";
import { Button } from "@/components/common/Button";
import { CandidateEnrollmentModal } from "./CandidateEnrollmentModal";
import { ExamFormModal } from "./ExamFormModal";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

export function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const user = useSelector((state: RootState) => state.auth.user);
  const institutionId = user?.institutionMembers?.[0]?.institution?.id || "";

  const {
    data: examData,
    isLoading: examLoading,
    isError: examError,
  } = useGetExamByIdQuery(
    { institutionId, examId: id as string },
    { skip: !id || !institutionId },
  );

  const { data: enrollmentData, isLoading: enrollLoading } =
    useGetEnrollmentsQuery(
      { institutionId, examId: id as string, page, limit: 10 },
      { skip: !id || !institutionId },
    );

  const isLoading = examLoading || enrollLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  if (examError || !examData?.data) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
        Failed to load exam details. Ensure you have the correct permissions.
      </div>
    );
  }

  const exam = examData.data;
  const enrollments = enrollmentData?.data || [];
  const totalPages = enrollmentData?.meta?.totalPages || 1;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/dashboard/exams")}
          >
            &larr; Back to List
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-main">{exam.title}</h1>
            <p className="text-text-muted mt-1">
              Status:{" "}
              <span className="font-bold text-primary-600 uppercase">
                {exam.status}
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsEditModalOpen(true)}>
            Edit Exam
          </Button>
          <Button onClick={() => setIsCandidateModalOpen(true)}>
            Add Candidate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-8 bg-white border border-border/60 shadow-sm">
            <h2 className="text-xl font-bold text-text-main mb-6 border-b border-border pb-4">
              Candidates Enrolled
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Name</th>
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {enrollments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-slate-500"
                      >
                        No candidates enrolled yet.
                      </td>
                    </tr>
                  ) : (
                    enrollments.map((enr) => (
                      <tr
                        key={enr.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium">
                          {enr.candidate.firstName} {enr.candidate.lastName}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {enr.candidate.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100">
                            {enr.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary-600"
                          >
                            View History
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-border">
                <span className="text-sm font-medium text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-8 bg-white border border-border/60 shadow-sm">
            <h2 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Event Logistics
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Starts At</span>
                <span className="font-bold text-slate-900">
                  {formatDate(exam.scheduledStartTime)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Ends At</span>
                <span className="font-bold text-slate-900">
                  {formatDate(exam.scheduledEndTime)}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-4">
                <span className="text-slate-500">Duration</span>
                <span className="font-bold text-slate-900">
                  {exam.durationMinutes} Minutes
                </span>
              </div>
            </div>
            <div className="mt-8">
              <Button className="w-full" variant="primary">
                Add Candidates
              </Button>
            </div>
          </div>
        </div>
      </div>
      {isCandidateModalOpen && id && (
        <CandidateEnrollmentModal
          examId={id}
          onClose={() => setIsCandidateModalOpen(false)}
        />
      )}

      {isEditModalOpen && id && (
        <ExamFormModal
          institutionId={institutionId}
          examId={id}
          initialData={{
            title: exam.title,
            description: exam.description || "",
            scheduledStartTime: exam.scheduledStartTime,
            scheduledEndTime: exam.scheduledEndTime,
            durationMinutes: exam.durationMinutes,
            passingScore: exam.passingScore,
            totalMarks: exam.totalMarks,
          }}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
}

import { useSelector } from "react-redux";
export default ExamDetailPage;
