import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { CONSTANTS } from "@/constants";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { useCreateExamMutation, useUpdateExamMutation } from "@/services/examApi";

interface ExamFormModalProps {
  institutionId: string;
  examId?: string;
  initialData?: Partial<ExamFormData>;
  onClose: () => void;
}

const examSchema = yup.object().shape({
  title: yup.string().required(CONSTANTS.MESSAGES.REQUIRED_FIELD),
  description: yup.string().default(""),
  scheduledStartTime: yup.string().required(CONSTANTS.MESSAGES.REQUIRED_FIELD),
  scheduledEndTime: yup.string().required(CONSTANTS.MESSAGES.REQUIRED_FIELD),
  durationMinutes: yup
    .number()
    .required(CONSTANTS.MESSAGES.REQUIRED_FIELD)
    .positive()
    .integer(),
  passingScore: yup.number().required(CONSTANTS.MESSAGES.REQUIRED_FIELD).min(0),
  totalMarks: yup
    .number()
    .required(CONSTANTS.MESSAGES.REQUIRED_FIELD)
    .positive(),
});

type ExamFormData = yup.InferType<typeof examSchema>;

export function ExamFormModal({
  institutionId,
  examId,
  initialData,
  onClose,
}: ExamFormModalProps) {
  const [createExam, { isLoading: isCreating, error: createError }] =
    useCreateExamMutation();
  const [updateExam, { isLoading: isUpdating, error: updateError }] =
    useUpdateExamMutation();

  const isEdit = !!examId;
  const isLoading = isCreating || isUpdating;
  const error = createError || updateError;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExamFormData>({
    resolver: yupResolver(examSchema),
    mode: "onTouched",
    defaultValues: initialData
      ? {
          ...initialData,
          scheduledStartTime: initialData.scheduledStartTime
            ? new Date(initialData.scheduledStartTime)
                .toISOString()
                .slice(0, 16)
            : "",
          scheduledEndTime: initialData.scheduledEndTime
            ? new Date(initialData.scheduledEndTime).toISOString().slice(0, 16)
            : "",
        }
      : undefined,
  });

  const onSubmit = async (data: ExamFormData) => {
    try {
      if (isEdit) {
        await updateExam({
          institutionId,
          examId: examId!,
          body: data,
        }).unwrap();
      } else {
        await createExam({ institutionId, body: data }).unwrap();
      }
      onClose();
    } catch (err) {
      console.error(`Failed to ${isEdit ? "update" : "create"} exam:`, err);
    }
  };

  const getErrorMessage = () => {
    if (!error) return null;
    if (typeof error === "object" && "data" in error) {
      return (
        (error as { data?: { message?: string } }).data?.message ||
        `Failed to ${isEdit ? "update" : "create"} exam`
      );
    }
    return "An unexpected error occurred";
  };

  const errorMessage = getErrorMessage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="card w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-main">
            {isEdit ? "Edit Exam" : "Schedule New Exam"}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main focus:outline-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Exam Title"
            id="title"
            placeholder="e.g. Midterm Examination 2024"
            error={errors.title?.message}
            {...register("title")}
          />

          <Input
            label="Description"
            id="description"
            placeholder="Brief details about the exam"
            error={errors.description?.message}
            {...register("description")}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              id="scheduledStartTime"
              type="datetime-local"
              error={errors.scheduledStartTime?.message}
              {...register("scheduledStartTime")}
            />
            <Input
              label="End Time"
              id="scheduledEndTime"
              type="datetime-local"
              error={errors.scheduledEndTime?.message}
              {...register("scheduledEndTime")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (Minutes)"
              id="durationMinutes"
              type="number"
              placeholder="e.g. 60"
              error={errors.durationMinutes?.message}
              {...register("durationMinutes")}
            />
            <Input
              label="Total Marks"
              id="totalMarks"
              type="number"
              placeholder="e.g. 100"
              error={errors.totalMarks?.message}
              {...register("totalMarks")}
            />
          </div>

          <Input
            label="Passing Score"
            id="passingScore"
            type="number"
            placeholder="e.g. 40"
            error={errors.passingScore?.message}
            {...register("passingScore")}
          />

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {isEdit ? "Update Exam" : "Schedule Exam"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
