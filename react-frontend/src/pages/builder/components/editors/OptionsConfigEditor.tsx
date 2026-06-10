import { Droppable, Draggable } from "@hello-pangea/dnd";
import { type QuestionOption, type QuestionDisplayVariant } from "../../../../types/formBuilder";

interface OptionsConfigEditorProps {
  questionIndex: number;
  questionType: "CHOICE_SINGLE" | "CHOICE_MULTI";
  options: QuestionOption[];
  displayVariant: QuestionDisplayVariant;
  onChangeOptions: (newOptions: QuestionOption[]) => void;
  onChangeDisplayVariant: (variant: QuestionDisplayVariant) => void;
}

export default function OptionsConfigEditor({
  questionIndex,
  questionType,
  options,
  displayVariant,
  onChangeOptions,
  onChangeDisplayVariant,
}: OptionsConfigEditorProps) {
  const handleAddOption = () => {
    const newOption: QuestionOption = {
      id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: `Варіант ${options.length + 1}`,
      isDefault: false,
    };
    onChangeOptions([...options, newOption]);
  };

  const handleTextChange = (index: number, text: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], text };
    onChangeOptions(updated);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 1) return;
    onChangeOptions(options.filter((_, i) => i !== index));
  };

  const handleToggleDefault = (index: number) => {
    const updated = options.map((opt, i) => {
      if (questionType === "CHOICE_SINGLE") {
        return { ...opt, isDefault: i === index ? !opt.isDefault : false };
      } else {
        return i === index ? { ...opt, isDefault: !opt.isDefault } : opt;
      }
    });
    onChangeOptions(updated);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-500 block">
          Варіанти відповідей та значення за замовчуванням
        </label>

        <Droppable droppableId={`options-${questionIndex}`} type="OPTIONS">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {options.map((option, index) => (
                <Draggable key={option.id} draggableId={option.id} index={index}>
                  {(draggableProvided) => (
                    <div
                      ref={draggableProvided.innerRef}
                      {...draggableProvided.draggableProps}
                      className="flex items-center gap-2 bg-slate-50/50 border border-slate-200/60 rounded-xl p-2 group"
                    >
                      <div
                        {...draggableProvided.dragHandleProps}
                        className="text-slate-300 hover:text-slate-500 cursor-grab px-1"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2.5"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 9h16.5m-16.5 6.75h16.5"
                          />
                        </svg>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleDefault(index)}
                        className={`h-5 w-5 shrink-0 flex items-center justify-center border transition-all cursor-pointer ${
                          questionType === "CHOICE_SINGLE" ? "rounded-full" : "rounded-md"
                        } ${
                          option.isDefault
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-white border-slate-300 hover:border-slate-400"
                        }`}
                        title={
                          option.isDefault ? "Прибрати вибір за замовчуванням" : "Зробити дефолтним"
                        }
                      >
                        {option.isDefault &&
                          (questionType === "CHOICE_SINGLE" ? (
                            <span className="h-2 w-2 bg-white rounded-full" />
                          ) : (
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="3"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ))}
                      </button>

                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => handleTextChange(index, e.target.value)}
                        className="flex-1 min-w-0 bg-transparent text-sm font-medium text-slate-700 focus:outline-none placeholder-slate-400"
                        placeholder="Введіть варіант..."
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        disabled={options.length <= 1}
                        className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer disabled:opacity-0"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        <button
          type="button"
          onClick={handleAddOption}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 px-3 py-2 rounded-xl border border-dashed border-indigo-200 transition-all mt-1 cursor-pointer"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5H4.5" />
          </svg>
          Додати варіант
        </button>
      </div>

      <hr className="border-slate-100" />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500">
          Стиль відображення респонденту
        </label>

        <div className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => onChangeDisplayVariant("list")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              displayVariant === "list"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Список
          </button>

          <button
            type="button"
            onClick={() => onChangeDisplayVariant("tabs")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              displayVariant === "tabs"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Таби
          </button>

          {/* <button
            type="button"
            onClick={() => onChangeDisplayVariant("dropdown")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              displayVariant === "dropdown"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Дропдаун
          </button> */}
          <button
            type="button"
            disabled={questionType === "CHOICE_MULTI"}
            onClick={() => onChangeDisplayVariant("dropdown")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              displayVariant === "dropdown"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
            title={
              questionType === "CHOICE_MULTI"
                ? "Дропдаун доступний тільки для питань з одним варіантом відповіді"
                : ""
            }
          >
            Дропдаун
          </button>
        </div>
      </div>
    </div>
  );
}
