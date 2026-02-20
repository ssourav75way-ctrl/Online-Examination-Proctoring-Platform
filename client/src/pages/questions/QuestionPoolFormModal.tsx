import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { CONSTANTS } from "@/constants";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { useCreateQuestionPoolMutation } from "@/services/questionApi";
import { useGetDepartmentsQuery } from "@/services/institutionApi";

interface QuestionPoolFormModalProps {
  institutionId: string;
  onClose: () => void;
}

const poolSchema = yup.object().shape({
  name: yup.string().required(CONSTANTS.MESSAGES.REQUIRED_FIELD),
  description: yup.string().default(""),
  departmentId: yup.string().required(CONSTANTS.MESSAGES.REQUIRED_FIELD),
});

type PoolFormData = yup.InferType<typeof poolSchema>;

export function QuestionPoolFormModal({
  institutionId,
  onClose,
}: QuestionPoolFormModalProps) {
  const [createPool, { isLoading, error }] = useCreateQuestionPoolMutation();
  const { data: deptData } = useGetDepartmentsQuery(institutionId, {
    skip: !institutionId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PoolFormData>({
    resolver: yupResolver(poolSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data: PoolFormData) => {
    try {
      await createPool({
        institutionId,
        body: { ...data, isShared: false },
      }).unwrap();
      onClose();
    } catch (err) {
      console.error("Failed to create question pool:", err);
    }
  };

  const getErrorMessage = () => {
    if (!error) return null;
    if (typeof error === "object" && "data" in error) {
      return (
        (error as { data?: { message?: string } }).data?.message ||
        "Failed to create pool"
      );
    }
    return "An unexpected error occurred";
  };

  const errorMessage = getErrorMessage();
  const departments = deptData?.data || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="card w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-main">
            Create Question Pool
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
            label="Pool Name"
            id="name"
            placeholder="e.g. Computer Science Fundamentals"
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            label="Description"
            id="description"
            placeholder="Brief description of the pool"
            error={errors.description?.message}
            {...register("description")}
          />

          <div className="space-y-1.5">
            <label
              className="text-sm font-semibold text-text-main"
              htmlFor="departmentId"
            >
              Department
            </label>
            <select
              id="departmentId"
              className={`w-full h-11 px-4 rounded-lg bg-surface border ${errors.departmentId ? "border-red-500" : "border-border"} focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all`}
              {...register("departmentId")}
            >
              <option value="">Select a department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {errors.departmentId && (
              <p className="text-xs text-red-500 font-medium">
                {errors.departmentId.message}
              </p>
            )}
          </div>

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
              Save Pool
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
