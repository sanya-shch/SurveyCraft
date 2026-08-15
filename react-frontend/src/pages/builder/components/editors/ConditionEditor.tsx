import type {
  ConditionGroup,
  ConditionOperator,
  ConditionRule,
  Question,
} from "../../../../types/formBuilder";

interface ConditionEditorProps {
  condition: ConditionGroup | null | undefined;
  currentOrder: number;
  allQuestions: Question[];
  onChange: (next: ConditionGroup | null) => void;
  error?: string;
}

const OPERATORS_BY_TYPE: Record<Question["type"], ConditionOperator[]> = {
  TEXT: ["equals", "notEquals", "contains"],
  NUMBER: ["equals", "notEquals", "gt", "lt"],
  // gt/lt лише для типу number, ISO-рядок дати такого порівняння не пройде.
  DATE: ["equals", "notEquals"],
  BOOLEAN: ["equals"],
  CHOICE_SINGLE: ["equals", "notEquals", "in"],
  CHOICE_MULTI: ["contains"],
};

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: "дорівнює",
  notEquals: "не дорівнює",
  contains: "містить",
  in: "є одним із",
  gt: "більше ніж",
  lt: "менше ніж",
};

const inputClass =
  "h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export default function ConditionEditor({
  condition,
  currentOrder,
  allQuestions,
  onChange,
  error,
}: ConditionEditorProps) {
  const availableTargets = allQuestions.filter((q) => q.id && q.order < currentOrder);

  if (availableTargets.length === 0) {
    return (
      <p className="text-[11px] text-slate-400 italic">
        Умову показу можна додати лише для питань, перед якими є інші питання.
      </p>
    );
  }

  const isEnabled = Boolean(condition && condition.rules.length > 0);

  const handleToggle = (checked: boolean) => {
    if (!checked) {
      onChange(null);
      return;
    }
    const target = availableTargets[0];
    onChange({
      logic: "AND",
      rules: [{ questionId: target.id!, operator: OPERATORS_BY_TYPE[target.type][0], value: "" }],
    });
  };

  const updateRule = (index: number, patch: Partial<ConditionRule>) => {
    if (!condition) return;
    const rules = condition.rules.map((r, i) => (i === index ? { ...r, ...patch } : r));
    onChange({ ...condition, rules });
  };

  const removeRule = (index: number) => {
    if (!condition) return;
    const rules = condition.rules.filter((_, i) => i !== index);
    if (rules.length === 0) {
      onChange(null);
    } else {
      onChange({ ...condition, rules });
    }
  };

  const addRule = () => {
    if (!condition) return;
    const target = availableTargets[0];
    onChange({
      ...condition,
      rules: [
        ...condition.rules,
        { questionId: target.id!, operator: OPERATORS_BY_TYPE[target.type][0], value: "" },
      ],
    });
  };

  const handleTargetChange = (index: number, questionId: string) => {
    const target = availableTargets.find((q) => q.id === questionId);
    if (!target) return;

    updateRule(index, { questionId, operator: OPERATORS_BY_TYPE[target.type][0], value: "" });
  };

  return (
    <div className="space-y-2.5 animate-in fade-in duration-150">
      <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={(e) => handleToggle(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-xs font-semibold text-slate-500">
          Показувати лише за умовою (conditional logic)
        </span>
      </label>

      {isEnabled && condition && (
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-2.5">
          {condition.rules.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Виконати:</span>
              <div className="flex gap-1 bg-white p-0.5 rounded-lg border border-slate-200 w-fit">
                {(["AND", "OR"] as const).map((logic) => (
                  <button
                    key={logic}
                    type="button"
                    onClick={() => onChange({ ...condition, logic })}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                      condition.logic === logic
                        ? "bg-indigo-600 text-white"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {logic === "AND" ? "УСІ умови" : "БУДЬ-ЯКА з умов"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {condition.rules.map((rule, index) => {
            const target = availableTargets.find((q) => q.id === rule.questionId);
            const operators = target ? OPERATORS_BY_TYPE[target.type] : ["equals" as const];

            return (
              <div key={index} className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 w-10 shrink-0">
                  {index === 0 ? "Якщо" : "і"}
                </span>

                <select
                  value={rule.questionId}
                  onChange={(e) => handleTargetChange(index, e.target.value)}
                  className={`${inputClass} min-w-[9rem] max-w-[14rem]`}
                >
                  {availableTargets.map((q) => (
                    <option key={q.id} value={q.id}>
                      #{q.order + 1} {q.text || "Без назви"}
                    </option>
                  ))}
                </select>

                <select
                  value={rule.operator}
                  onChange={(e) =>
                    updateRule(index, { operator: e.target.value as ConditionOperator, value: "" })
                  }
                  className={inputClass}
                >
                  {operators.map((op) => (
                    <option key={op} value={op}>
                      {OPERATOR_LABELS[op]}
                    </option>
                  ))}
                </select>

                <ConditionValueInput
                  target={target}
                  operator={rule.operator}
                  value={rule.value}
                  onChange={(value) => updateRule(index, { value })}
                />

                <button
                  type="button"
                  onClick={() => removeRule(index)}
                  className="ml-auto text-slate-300 hover:text-rose-500 transition-colors cursor-pointer p-1"
                  title="Прибрати цю умову"
                >
                  ✕
                </button>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addRule}
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
          >
            + Додати умову
          </button>
        </div>
      )}

      {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
    </div>
  );
}

interface ConditionValueInputProps {
  target: Question | undefined;
  operator: ConditionOperator;
  value: ConditionRule["value"];
  onChange: (value: ConditionRule["value"]) => void;
}

function ConditionValueInput({ target, operator, value, onChange }: ConditionValueInputProps) {
  if (!target) return null;

  if (target.type === "BOOLEAN") {
    return (
      <div className="flex gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
            value === false ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Ні
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
            value === true ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Так
        </button>
      </div>
    );
  }

  if (target.type === "CHOICE_SINGLE" && operator === "in") {
    const selected = Array.isArray(value) ? value : [];
    const toggle = (optionId: string) => {
      onChange(
        selected.includes(optionId)
          ? selected.filter((id) => id !== optionId)
          : [...selected, optionId],
      );
    };

    return (
      <div className="flex flex-wrap gap-1">
        {target.options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
              selected.includes(opt.id)
                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            {opt.text || "Без назви"}
          </button>
        ))}
      </div>
    );
  }

  if (
    (target.type === "CHOICE_SINGLE" && (operator === "equals" || operator === "notEquals")) ||
    (target.type === "CHOICE_MULTI" && operator === "contains")
  ) {
    return (
      <select
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        <option value="" disabled>
          Оберіть варіант...
        </option>
        {target.options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.text || "Без назви"}
          </option>
        ))}
      </select>
    );
  }

  if (target.type === "NUMBER") {
    return (
      <input
        type="number"
        value={typeof value === "number" ? value : ""}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className={`${inputClass} w-24`}
      />
    );
  }

  if (target.type === "DATE") {
    return (
      <input
        type="date"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    );
  }

  // TEXT (equals/notEquals/contains)
  return (
    <input
      type="text"
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Значення..."
      className={`${inputClass} min-w-[8rem]`}
    />
  );
}
