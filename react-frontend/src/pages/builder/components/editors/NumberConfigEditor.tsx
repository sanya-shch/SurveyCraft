import { ErrorInfo } from "../../../../components/ui/ErrorInfo";
import { type QuestionConfig } from "../../../../types/formBuilder";

interface NumberConfigEditorProps {
  config: QuestionConfig | null;
  onChange: (newConfig: QuestionConfig) => void;
}

export default function NumberConfigEditor({ config, onChange }: NumberConfigEditorProps) {
  const currentConfig = config || {};
  const minValue = currentConfig.min;
  const maxValue = currentConfig.max;

  const hasValidationError =
    minValue !== undefined && maxValue !== undefined && minValue > maxValue;

  const updateConfig = (patch: Partial<QuestionConfig>) => {
    onChange({ ...currentConfig, ...patch });
  };

  const handleNumberChange = (value: string, key: "min" | "max") => {
    if (!value) {
      updateConfig({ [key]: undefined });
      return;
    }

    const parsed = parseFloat(value);
    const sanitizedValue = parsed < 0 ? 0 : parsed;

    updateConfig({ [key]: sanitizedValue });
  };

  return (
    <div className="flex flex-col gap-3 animate-in fade-in duration-150">
      <div className="flex gap-4">
        <div className="w-32 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500">Мінімальне число</label>
          <input
            type="number"
            min={0}
            placeholder="Без ліміту"
            value={minValue ?? ""}
            onChange={(e) => handleNumberChange(e.target.value, "min")}
            className={`h-10 rounded-xl border px-3 text-sm font-medium text-slate-700 focus:outline-none transition-colors ${
              hasValidationError
                ? "border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/30"
                : "border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            }`}
          />
        </div>

        <div className="w-32 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500">Максимальне число</label>
          <input
            type="number"
            min={0}
            placeholder="Без ліміту"
            value={maxValue ?? ""}
            onChange={(e) => handleNumberChange(e.target.value, "max")}
            className={`h-10 rounded-xl border px-3 text-sm font-medium text-slate-700 focus:outline-none transition-colors ${
              hasValidationError
                ? "border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/30"
                : "border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            }`}
          />
        </div>
      </div>

      {hasValidationError && (
        <ErrorInfo errorText="Мінімальне значення не може бути більшим за максимальне" />
      )}
    </div>
  );
}
