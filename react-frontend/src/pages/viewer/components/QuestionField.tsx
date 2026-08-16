import { type Question } from "../../../types/formBuilder";
import { type AnswerValue } from "../../../types/formViewer";

interface QuestionFieldProps {
  question: Question;
  qId: string;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
}

export default function QuestionField({ question, qId, value, onChange }: QuestionFieldProps) {
  const displayVariant = question.config?.displayVariant || "list";

  if (question.type === "TEXT") {
    return question.config?.variant === "textarea" ? (
      <textarea
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[100px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none placeholder-slate-400"
        placeholder="Введіть розгорнуту відповідь..."
      />
    ) : (
      <input
        type={question.config?.variant === "email" ? "email" : "text"}
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none placeholder-slate-400"
        placeholder="Введіть відповідь..."
      />
    );
  }

  if (question.type === "NUMBER") {
    return (
      <input
        type="number"
        value={value !== undefined && value !== "" ? (value as number) : ""}
        onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : "")}
        className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
        placeholder="0"
      />
    );
  }

  if (question.type === "BOOLEAN") {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(!(value as boolean))}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            value ? "bg-indigo-600" : "bg-slate-200"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              value ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-sm font-medium text-slate-600">{value ? "Так" : "Ні"}</span>
      </div>
    );
  }

  if (question.type === "CHOICE_SINGLE") {
    if (displayVariant === "tabs") {
      return (
        <div className="flex flex-wrap gap-2">
          {question.options.map((option) => {
            const isSelected = value === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange(option.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-all ${
                  isSelected
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                }`}
              >
                {option.text}
              </button>
            );
          })}
        </div>
      );
    }

    if (displayVariant === "dropdown") {
      return (
        <div className="relative">
          <select
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">Оберіть варіант...</option>
            {question.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.text}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2.5">
        {question.options.map((option) => (
          <label
            key={option.id}
            className={`flex items-center gap-3 border rounded-xl p-3 text-sm font-medium cursor-pointer transition-all ${
              value === option.id
                ? "bg-indigo-50/50 border-indigo-200 text-indigo-900"
                : "bg-slate-50 border-slate-200/60 text-slate-700 hover:bg-slate-100/70"
            }`}
          >
            <input
              type="radio"
              name={qId}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
            />
            {option.text}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "CHOICE_MULTI") {
    const toggle = (optionId: string) => {
      const current = (value as string[]) || [];
      onChange(
        current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      );
    };

    if (displayVariant === "tabs") {
      return (
        <div className="flex flex-wrap gap-2">
          {question.options.map((option) => {
            const isSelected = ((value as string[]) || []).includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggle(option.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {option.text}
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2.5">
        {question.options.map((option) => {
          const isChecked = ((value as string[]) || []).includes(option.id);
          return (
            <label
              key={option.id}
              className={`flex items-center gap-3 border rounded-xl p-3 text-sm font-medium cursor-pointer transition-all ${
                isChecked
                  ? "bg-indigo-50/50 border-indigo-200 text-indigo-900"
                  : "bg-slate-50 border-slate-200/60 text-slate-700 hover:bg-slate-100/70"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(option.id)}
                className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
              />
              {option.text}
            </label>
          );
        })}
      </div>
    );
  }

  if (question.type === "DATE") {
    return (
      <input
        type="date"
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
      />
    );
  }

  return null;
}
