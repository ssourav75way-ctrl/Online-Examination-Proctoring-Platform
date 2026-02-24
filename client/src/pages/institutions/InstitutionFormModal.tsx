import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { CONSTANTS } from "@/constants";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { useCreateInstitutionMutation } from "@/services/institutionApi";

interface InstitutionFormModalProps {
  onClose: () => void;
}

const institutionSchema = yup.object().shape({
  name: yup.string().required(CONSTANTS.MESSAGES.REQUIRED_FIELD),
  code: yup.string().required(CONSTANTS.MESSAGES.REQUIRED_FIELD).min(2).max(10),
});

type InstitutionFormData = yup.InferType<typeof institutionSchema>;

export function InstitutionFormModal({ onClose }: InstitutionFormModalProps) {
  const [createInstitution, { isLoading, error }] =
    useCreateInstitutionMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InstitutionFormData>({
    resolver: yupResolver(institutionSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data: InstitutionFormData) => {
    try {
      await createInstitution(data).unwrap();
      onClose();
    } catch (err) {
      console.error("Failed to create institution:", err);
    }
  };

  const getErrorMessage = () => {
    if (!error) return null;
    if (typeof error === "object" && "data" in error) {
      return (
        (error as { data?: { message?: string } }).data?.message ||
        "Failed to create institution"
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
            Add New Institution
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main focus:outline-none"
          >

          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Institution Name"
            id="name"
            placeholder="e.g. University of Example"
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            label="Institution Code"
            id="code"
            placeholder="e.g. UOE"
            error={errors.code?.message}
            {...register("code")}
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
              Save Institution
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
