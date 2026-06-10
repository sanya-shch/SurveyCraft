import { ErrorInfo } from "../../../../components/ui/ErrorInfo";
import { type QuestionConfig } from "../../../../types/formBuilder";

interface TextConfigEditorProps {
  config: QuestionConfig | null;
  onChange: (newConfig: QuestionConfig) => void;
}

export type TextQuestionVariant = "input" | "textarea" | "email" | "name";

export default function TextConfigEditor({ config, onChange }: TextConfigEditorProps) {
  const currentConfig = config || {};
  const variant = currentConfig.variant || "input";

  const minLength = currentConfig.minLength;
  const maxLength = currentConfig.maxLength;

  const hasValidationError =
    minLength !== undefined && maxLength !== undefined && minLength > maxLength;

  const updateConfig = (patch: Partial<QuestionConfig>) => {
    onChange({ ...currentConfig, ...patch });
  };

  const handleNumberChange = (value: string, key: "minLength" | "maxLength") => {
    if (!value) {
      updateConfig({ [key]: undefined });
      return;
    }

    const parsed = parseFloat(value);
    const sanitizedValue = parsed < 0 ? 0 : parsed;

    updateConfig({ [key]: sanitizedValue });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500">Варіант поля (Variant)</label>
          <select
            value={variant}
            onChange={(e) => updateConfig({ variant: e.target.value as TextQuestionVariant })}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 cursor-pointer focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="input">Рядок тексту (Input)</option>
            <option value="textarea">Багаторядковий текст (Textarea)</option>
            <option value="email">Електронна пошта (Email)</option>
            <option value="name">Ім'я користувача</option>
          </select>
        </div>

        <div className="flex flex-row gap-3">
          <div className="w-24 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Мін. симв.</label>
            <input
              type="number"
              placeholder="0"
              min={0}
              value={currentConfig.minLength ?? ""}
              onChange={(e) => handleNumberChange(e.target.value, "minLength")}
              className={`h-10 rounded-xl border px-3 text-sm font-medium text-slate-700 focus:outline-none transition-colors ${
                hasValidationError
                  ? "border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/30"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              }`}
            />
          </div>
          <div className="w-24 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Макс. симв.</label>
            <input
              type="number"
              placeholder="—"
              min={0}
              value={currentConfig.maxLength ?? ""}
              onChange={(e) => handleNumberChange(e.target.value, "maxLength")}
              className={`h-10 rounded-xl border px-3 text-sm font-medium text-slate-700 focus:outline-none transition-colors ${
                hasValidationError
                  ? "border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/30"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              }`}
            />
          </div>
        </div>
      </div>

      {hasValidationError && (
        <ErrorInfo errorText="Мінімальна кількість символів не може бути більшим за максимальне" />
      )}
    </div>
  );
}
