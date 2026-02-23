import { useForm, useFieldArray, Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useCreateQuestionMutation } from "@/services/questionApi";
import { QuestionType } from "@/types/exam";
import { CONSTANTS } from "@/constants";

interface QuestionFormModalProps {
  institutionId: string;
  poolId: string;
  onClose: () => void;
}

const questionSchema = yup.object().shape({
  type: yup.string().required(CONSTANTS.MESSAGES.REQUIRED_FIELD),
  topic: yup.string().required(CONSTANTS.MESSAGES.REQUIRED_FIELD),
  content: yup.string().required(CONSTANTS.MESSAGES.REQUIRED_FIELD),
  difficulty: yup
    .number()
    .min(1)
    .max(10)
    .required(CONSTANTS.MESSAGES.REQUIRED_FIELD),
  marks: yup.number().min(0.5).required(CONSTANTS.MESSAGES.REQUIRED_FIELD),
  negativeMarks: yup.number().min(0).default(0),

  correctAnswer: yup.string().when("type", {
    is: (val: string) => val === "FILL_BLANK" || val === "SHORT_ANSWER",
    then: (schema) => schema.required("Correct answer/keywords are required"),
    otherwise: (schema) => schema.optional(),
  }),
  options: yup.array().when("type", {
    is: (val: string) => val === "MCQ" || val === "MULTI_SELECT",
    then: () =>
      yup
        .array()
        .of(
          yup.object().shape({
            text: yup.string().required("Option text is required"),
            isCorrect: yup.boolean().required(),
          }),
        )
        .min(2, "At least 2 options are required"),
    otherwise: () => yup.array().notRequired(),
  }),
  codeLanguage: yup.string().when("type", {
    is: "CODE",
    then: (schema) =>
      schema.required("Language is required for code questions"),
    otherwise: (schema) => schema.optional(),
  }),
  codeTemplate: yup.string().optional(),
});

export interface BaseQuestionFormData {
  type: string;
  topic: string;
  content: string;
  difficulty: number;
  marks: number;
  negativeMarks?: number;
  correctAnswer?: string;
  options?: Array<{ text: string; isCorrect: boolean }>;
  codeLanguage?: string;
  codeTemplate?: string;
}

export function QuestionFormModal({
  institutionId,
  poolId,
  onClose,
}: QuestionFormModalProps) {
  const [createQuestion, { isLoading, error }] = useCreateQuestionMutation();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BaseQuestionFormData>({
    resolver: yupResolver(
      questionSchema,
    ) as unknown as Resolver<BaseQuestionFormData>,
    defaultValues: {
      type: "MCQ",
      difficulty: 1,
      marks: 1,
      negativeMarks: 0,
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const selectedType = watch("type") as QuestionType;

  const onSubmit = async (data: BaseQuestionFormData) => {
    try {
      await createQuestion({
        institutionId,
        body: {
          ...data,
          poolId,

          options:
            data.type === "MCQ" || data.type === "MULTI_SELECT"
              ? data.options?.map((o, idx) => ({ ...o, id: `opt-${idx}` }))
              : undefined,
          keywords:
            data.type === "SHORT_ANSWER" && data.correctAnswer
              ? data.correctAnswer
                  .split(",")
                  .map((k) => ({ keyword: k.trim(), weight: 1 }))
                  .filter((k) => k.keyword.length > 0)
              : undefined,
          correctAnswer:
            data.type === "FILL_BLANK" ? data.correctAnswer : undefined,
        },
      }).unwrap();
      onClose();
    } catch (err) {
      console.error("Failed to create question:", err);
    }
  };

  const getErrorMessage = () => {
    if (!error) return null;
    if (typeof error === "object" && error && "data" in error) {
      return (
        (error as { data?: { message?: string } }).data?.message ||
        "Failed to create question"
      );
    }
    return "An unexpected error occurred";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto pt-20 pb-20">
      <div className="card w-full max-w-2xl p-6 my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-main">Add New Question</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main focus:outline-none"
          ></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                className="text-sm font-semibold text-text-main"
                htmlFor="type"
              >
                Question Type
              </label>
              <select
                id="type"
                className="w-full h-11 px-4 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                {...register("type")}
              >
                <option value="MCQ">Multiple Choice (Single Correct)</option>
                <option value="MULTI_SELECT">
                  Multiple Select (Multiple Correct)
                </option>
                <option value="FILL_BLANK">Fill in the Blank</option>
                <option value="SHORT_ANSWER">
                  Short Answer (Keyword based)
                </option>
                <option value="CODE">Coding Problem</option>
              </select>
            </div>

            <Input
              label="Topic / Tags"
              id="topic"
              placeholder="e.g. Arrays, Thermodynamics"
              error={errors.topic?.message}
              {...register("topic")}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="text-sm font-semibold text-text-main"
              htmlFor="content"
            >
              Question Content (Markdown supported)
            </label>
            <textarea
              id="content"
              rows={4}
              className={`w-full p-4 rounded-lg bg-surface border ${errors.content ? "border-red-500" : "border-border"} focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none`}
              placeholder="Type your question here..."
              {...register("content")}
            />
            {errors.content && (
              <p className="text-xs text-red-500 font-medium">
                {errors.content.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Difficulty (1-10)"
              id="difficulty"
              type="number"
              error={errors.difficulty?.message}
              {...register("difficulty")}
            />
            <Input
              label="Marks"
              id="marks"
              type="number"
              step="0.5"
              error={errors.marks?.message}
              {...register("marks")}
            />
            <Input
              label="Negative Marks"
              id="negativeMarks"
              type="number"
              step="0.5"
              error={errors.negativeMarks?.message}
              {...register("negativeMarks")}
            />
          </div>

          {}
          {(selectedType === "MCQ" || selectedType === "MULTI_SELECT") && (
            <div className="space-y-4 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-main">Options</h3>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => append({ text: "", isCorrect: false })}
                >
                  + Add Option
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-4">
                    <input
                      type={selectedType === "MCQ" ? "radio" : "checkbox"}
                      name="correct-option"
                      checked={watch(`options.${index}.isCorrect`)}
                      onChange={(e) => {
                        if (selectedType === "MCQ") {
                          fields.forEach((_, i) =>
                            setValue(`options.${i}.isCorrect`, false),
                          );
                        }
                        setValue(
                          `options.${index}.isCorrect`,
                          e.target.checked,
                        );
                      }}
                      className="mt-3.5 h-4 w-4 text-primary-600 focus:ring-primary-500 border-border"
                    />
                    <div className="flex-1">
                      <Input
                        id={`options.${index}.text`}
                        placeholder={`Option ${index + 1}`}
                        {...register(`options.${index}.text`)}
                      />
                    </div>
                    {fields.length > 2 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="mt-2.5 text-text-muted hover:text-red-500 transition-colors"
                      ></button>
                    )}
                  </div>
                ))}
              </div>
              {errors.options && (
                <p className="text-xs text-red-500 font-medium">
                  {errors.options.message}
                </p>
              )}
            </div>
          )}

          {(selectedType === "FILL_BLANK" ||
            selectedType === "SHORT_ANSWER") && (
            <div className="border-t border-border pt-4">
              <Input
                label={
                  selectedType === "FILL_BLANK"
                    ? "Correct Answer"
                    : "Expected Answer / Keywords"
                }
                id="correctAnswer"
                placeholder={
                  selectedType === "FILL_BLANK"
                    ? "The exact expected string"
                    : "Comma separated keywords or expected string"
                }
                error={errors.correctAnswer?.message}
                {...register("correctAnswer")}
              />
            </div>
          )}

          {selectedType === "CODE" && (
            <div className="space-y-4 border-t border-border pt-4">
              <div className="space-y-1.5">
                <label
                  className="text-sm font-semibold text-text-main"
                  htmlFor="codeLanguage"
                >
                  Language
                </label>
                <select
                  id="codeLanguage"
                  className="w-full h-11 px-4 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  {...register("codeLanguage")}
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-sm font-semibold text-text-main"
                  htmlFor="codeTemplate"
                >
                  Starter Template (Optional)
                </label>
                <textarea
                  id="codeTemplate"
                  rows={6}
                  className="w-full p-4 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm resize-none"
                  placeholder="def solution():\n    # your code here"
                  {...register("codeTemplate")}
                />
              </div>
            </div>
          )}

          {getErrorMessage() && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
              {getErrorMessage()}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} className="px-8">
              Save Question
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
