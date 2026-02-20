import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { CONSTANTS } from "@/constants";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { useCreateDepartmentMutation } from "@/services/institutionApi";

interface DepartmentFormModalProps {
  institutionId: string;
  onClose: () => void;
}

const departmentSchema = yup.object().shape({
  name: yup.string().required(CONSTANTS.MESSAGES.REQUIRED_FIELD),
  code: yup.string().required(CONSTANTS.MESSAGES.REQUIRED_FIELD).min(2).max(10),
  description: yup.string(),
});

type DepartmentFormData = yup.InferType<typeof departmentSchema>;

export function DepartmentFormModal({
  institutionId,
  onClose,
}: DepartmentFormModalProps) {
  const [createDepartment, { isLoading, error }] =
    useCreateDepartmentMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepartmentFormData>({
    resolver: yupResolver(departmentSchema) as any,
    mode: "onTouched",
  });

  const onSubmit = async (data: DepartmentFormData) => {
    try {
      await createDepartment({ institutionId, body: data }).unwrap();
      onClose();
    } catch (err) {
      console.error("Failed to create department:", err);
    }
  };

  const getErrorMessage = () => {
    if (!error) return null;
    if (typeof error === "object" && "data" in error) {
      return (
        (error as { data?: { message?: string } }).data?.message ||
        "Failed to create department"
      );
    }
    return "An unexpected error occurred.";
  };

  const errorMessage = getErrorMessage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
          <h2 className="text-xl font-bold text-text-main">
            Add New Department
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main focus:outline-none"
            aria-label="Close"
          >
            
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Department Name"
            id="name"
            placeholder="e.g. Computer Science"
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            label="Department Code"
            id="code"
            placeholder="e.g. CS"
            error={errors.code?.message}
            {...register("code")}
          />

          <Input
            label="Description (Optional)"
            id="description"
            placeholder="Brief description of the department"
            error={errors.description?.message}
            {...register("description")}
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
              Save Department
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DepartmentFormModal;
