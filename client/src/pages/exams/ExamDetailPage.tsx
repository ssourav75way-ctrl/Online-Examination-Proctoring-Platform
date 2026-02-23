import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetExamByIdQuery,
  useGetEnrollmentsQuery,
  useScheduleExamMutation,
  useCancelExamMutation,
  useGetExamQuestionsQuery,
  useRemoveExamQuestionMutation,
  ExamQuestionItem,
} from "@/services/examApi";
import { Enrollment } from "@/types/modules/exam.types";
import { Button } from "@/components/common/Button";
import { CandidateEnrollmentModal } from "./CandidateEnrollmentModal";
import { ExamFormModal } from "./ExamFormModal";
import { ExamQuestionPicker } from "./ExamQuestionPicker";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { formatDateIST } from "@/utils/dateFormat";

const typeBadge: Record<string, { label: string; cls: string }> = {
  MCQ: { label: "MCQ", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  MULTI_SELECT: {
    label: "Multi-Select",
    cls: "bg-violet-50 text-violet-700 border-violet-200",
  },
  FILL_BLANK: {
    label: "Fill Blank",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  SHORT_ANSWER: {
    label: "Short Answer",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  CODE: { label: "Code", cls: "bg-gray-800 text-gray-100 border-gray-700" },
};

export function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [enrollPage, setEnrollPage] = useState(1);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isQuestionPickerOpen, setIsQuestionPickerOpen] = useState(false);

  const user = useSelector((state: RootState) => state.auth.user);
  const effectiveRole = useSelector(
    (state: RootState) => state.auth.effectiveRole,
  );
  const institutionId = user?.institutionMembers?.[0]?.institution?.id || "";
  const userRole = effectiveRole || String(user?.globalRole || "");

  const {
    data: examData,
    isLoading: examLoading,
    isError: examError,
    refetch: refetchExam,
  } = useGetExamByIdQuery(
    { institutionId, examId: id as string },
    { skip: !id || !institutionId },
  );

  const { data: enrollmentData, isLoading: enrollLoading } =
    useGetEnrollmentsQuery(
      { institutionId, examId: id as string, page: enrollPage, limit: 10 },
      { skip: !id || !institutionId },
    );

  const { data: examQuestionsData, isLoading: eqLoading } =
    useGetExamQuestionsQuery(
      { institutionId, examId: id as string },
      { skip: !id || !institutionId },
    );

  const [scheduleExam, { isLoading: isScheduling }] = useScheduleExamMutation();
  const [cancelExam, { isLoading: isCancelling }] = useCancelExamMutation();
  const [removeExamQuestion] = useRemoveExamQuestionMutation();

  const isLoading = examLoading || enrollLoading;

  const handleSchedule = async () => {
    if (!id) return;
    try {
      await scheduleExam({ institutionId, examId: id }).unwrap();
      refetchExam();
    } catch (err) {
      console.error("Failed to schedule exam:", err);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to cancel this exam?")) return;
    try {
      await cancelExam({ institutionId, examId: id }).unwrap();
      refetchExam();
    } catch (err) {
      console.error("Failed to cancel exam:", err);
    }
  };

  const handleRemoveQuestion = async (examQuestionId: string) => {
    if (!id) return;
    try {
      await removeExamQuestion({
        institutionId,
        examId: id,
        examQuestionId,
      }).unwrap();
    } catch (err) {
      console.error("Failed to remove question:", err);
    }
  };

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
        Failed to load exam details.
      </div>
    );
  }

  const exam = examData.data;
  const enrollments = enrollmentData?.data || [];
  const enrollTotalPages = enrollmentData?.meta?.totalPages || 1;
  const examQuestions: ExamQuestionItem[] = examQuestionsData?.data || [];
  const totalMarksFromQuestions = examQuestions.reduce(
    (sum, eq) => sum + (eq.questionVersion?.marks || 0),
    0,
  );

  const statusColorMap: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-700 border-slate-300",
    SCHEDULED: "bg-indigo-100 text-indigo-700 border-indigo-300",
    IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-300",
    COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-300",
    CANCELLED: "bg-rose-100 text-rose-700 border-rose-300",
  };

  const canManage =
    userRole === "ADMIN" ||
    userRole === "EXAMINER" ||
    userRole === "SUPER_ADMIN";

  const canEditQuestions =
    canManage && (exam.status === "DRAFT" || exam.status === "SCHEDULED");

  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/dashboard/exams")}
          >
            &larr; Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-main">{exam.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusColorMap[exam.status] || statusColorMap["DRAFT"]}`}
              >
                {exam.status.replace("_", " ")}
              </span>
              {exam.description && (
                <span className="text-text-muted text-sm">
                  {exam.description}
                </span>
              )}
            </div>
          </div>
        </div>
        {canManage && (
          <div className="flex gap-2">
            {exam.status === "DRAFT" && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  Edit
                </Button>
                <Button
                  onClick={handleSchedule}
                  isLoading={isScheduling}
                  disabled={examQuestions.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Publish / Schedule
                </Button>
              </>
            )}
            {(exam.status === "SCHEDULED" || exam.status === "IN_PROGRESS") && (
              <Button
                variant="danger"
                onClick={handleCancel}
                isLoading={isCancelling}
              >
                Cancel Exam
              </Button>
            )}
            {canManage && exam.status !== "DRAFT" && (
              <Button
                variant="secondary"
                onClick={() => navigate(`/dashboard/exams/${id}/results`)}
              >
                Manage Results
              </Button>
            )}
          </div>
        )}
      </div>

      {}
      {exam.status === "DRAFT" && canManage && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <svg
            className="w-5 h-5 text-amber-600 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <div>
            <p className="text-sm font-bold text-amber-800">Draft Mode</p>
            <p className="text-sm text-amber-700">
              {examQuestions.length === 0
                ? 'Add questions from your pools below, then click "Publish / Schedule".'
                : `${examQuestions.length} question(s) added (${totalMarksFromQuestions} marks). Publish when ready.`}
            </p>
          </div>
        </div>
      )}

      {}
      <div className="card p-6 bg-white border border-border/60 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
              <svg
                className="w-5 h-5 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Exam Questions ({examQuestions.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Total marks: <strong>{totalMarksFromQuestions}</strong> &middot;
              Questions pinned to version at time of addition
            </p>
          </div>
          {canEditQuestions && (
            <Button onClick={() => setIsQuestionPickerOpen(true)}>
              + Add from Pools
            </Button>
          )}
        </div>

        {eqLoading ? (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          </div>
        ) : examQuestions.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-slate-500 mb-3">
              No questions added to this exam yet.
            </p>
            {canEditQuestions && (
              <Button
                variant="secondary"
                onClick={() => setIsQuestionPickerOpen(true)}
              >
                Browse Question Pools
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold w-[5%]">#</th>
                  <th className="px-4 py-3 font-semibold w-[40%]">Content</th>
                  <th className="px-4 py-3 font-semibold">Topic</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold text-center">Diff</th>
                  <th className="px-4 py-3 font-semibold text-center">Marks</th>
                  <th className="px-4 py-3 font-semibold text-center">Ver</th>
                  {canEditQuestions && (
                    <th className="px-4 py-3 font-semibold text-right">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {examQuestions.map((eq, idx) => {
                  const badge = typeBadge[eq.question.type] || typeBadge["MCQ"];
                  return (
                    <tr
                      key={eq.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 line-clamp-1">
                          {eq.questionVersion.content}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-50 text-primary-700 border border-primary-100">
                          {eq.question.topic}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold border ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-sm">
                        {eq.questionVersion.difficulty}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-sm">
                        {eq.questionVersion.marks}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          v{eq.questionVersion.versionNumber}
                        </span>
                      </td>
                      {canEditQuestions && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRemoveQuestion(eq.id)}
                            className="text-xs text-red-500 hover:text-red-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <div className="lg:col-span-2 card p-6 bg-white border border-border/60 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-main">
              Enrolled Candidates
            </h2>
            {canManage && (
              <Button size="sm" onClick={() => setIsCandidateModalOpen(true)}>
                + Enroll Candidate
              </Button>
            )}
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {enrollments.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-slate-400 text-sm"
                  >
                    No candidates enrolled.
                  </td>
                </tr>
              ) : (
                enrollments.map((enr: Enrollment) => (
                  <tr key={enr.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">
                      {enr.candidate?.firstName} {enr.candidate?.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {enr.candidate?.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100">
                        {enr.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {enrollTotalPages > 1 && (
            <div className="mt-4 flex justify-between items-center">
              <span className="text-xs text-slate-400">
                Page {enrollPage} of {enrollTotalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={enrollPage === 1}
                  onClick={() => setEnrollPage((p) => p - 1)}
                >
                  Prev
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={enrollPage >= enrollTotalPages}
                  onClick={() => setEnrollPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {}
        <div className="card p-6 bg-white border border-border/60 shadow-sm">
          <h2 className="text-lg font-bold text-text-main mb-4">
            Exam Details
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Starts</span>
              <span className="font-bold text-slate-900">
                {formatDateIST(exam.scheduledStartTime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ends</span>
              <span className="font-bold text-slate-900">
                {formatDateIST(exam.scheduledEndTime)}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <span className="text-slate-500">Duration</span>
              <span className="font-bold">{exam.durationMinutes} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Marks</span>
              <span className="font-bold">{exam.totalMarks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Passing Score</span>
              <span className="font-bold">{exam.passingScore}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <span className="text-slate-500">Questions</span>
              <span className="font-bold">{examQuestions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Q. Marks Total</span>
              <span className="font-bold">{totalMarksFromQuestions}</span>
            </div>
          </div>
        </div>
      </div>

      {}
      {isCandidateModalOpen && id && (
        <CandidateEnrollmentModal
          institutionId={institutionId}
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
          onClose={() => {
            setIsEditModalOpen(false);
            refetchExam();
          }}
        />
      )}
      {isQuestionPickerOpen && id && (
        <ExamQuestionPicker
          institutionId={institutionId}
          examId={id}
          onClose={() => setIsQuestionPickerOpen(false)}
        />
      )}
    </div>
  );
}

export default ExamDetailPage;
