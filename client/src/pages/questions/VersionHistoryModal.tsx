import {
  useGetQuestionVersionsQuery,
  useRollbackQuestionMutation,
} from "@/services/questionApi";
import { Button } from "@/components/common/Button";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

interface VersionHistoryModalProps {
  institutionId: string;
  questionId: string;
  onClose: () => void;
}

export function VersionHistoryModal({
  institutionId,
  questionId,
  onClose,
}: VersionHistoryModalProps) {
  const { data, isLoading, isError } = useGetQuestionVersionsQuery({
    institutionId,
    questionId,
  });
  const [rollback] = useRollbackQuestionMutation();

  const versions = data?.data || [];

  const handleRollback = async (versionId: string) => {
    try {
      await toast.promise(
        rollback({ institutionId, questionId, versionId }).unwrap(),
        {
          loading: "Rolling back...",
          success: "Question rolled back successfully",
          error: "Failed to rollback version",
        },
      );
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Version History
            </h3>
            <p className="text-sm text-slate-500">
              View previous versions and rollback if needed
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-2xl"
          >
            &times;
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
          )}

          {isError && (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-lg text-center font-medium">
              Failed to load version history.
            </div>
          )}

          {!isLoading &&
            !isError &&
            versions.map((v: any, index: number) => (
              <div
                key={v.id}
                className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:border-primary-200 transition-colors"
              >
                <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                      v{v.versionNumber}
                    </span>
                    <div className="text-xs">
                      <p className="font-bold text-slate-700">
                        Created by {v.createdBy.firstName}{" "}
                        {v.createdBy.lastName}
                      </p>
                      <p className="text-slate-400">
                        {format(new Date(v.createdAt), "PPpp")}
                      </p>
                    </div>
                  </div>
                  {index === 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
                      Current
                    </span>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 text-[10px]"
                      onClick={() => handleRollback(v.id)}
                    >
                      Rollback to this
                    </Button>
                  )}
                </div>
                <div className="p-4 bg-white">
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {v.content}
                  </p>
                  <div className="mt-3 flex gap-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <span>Difficulty: {v.difficulty}</span>
                    <span>Marks: {v.marks}</span>
                    {v.codeLanguage && <span>Language: {v.codeLanguage}</span>}
                  </div>
                </div>
              </div>
            ))}

          {!isLoading && versions.length === 0 && (
            <div className="text-center py-12 text-slate-400 italic">
              No previous versions found.
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-slate-50 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
