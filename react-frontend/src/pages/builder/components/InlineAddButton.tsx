import { useState, useRef, useEffect } from "react";
import { type QuestionType } from "../../../types/formBuilder";
import { QUESTION_TYPE_LABELS } from "../../../constants";

interface InlineAddButtonProps {
  onAdd: (type: QuestionType) => void;
}

const OPTIONS: { type: QuestionType; label: string }[] = [
  { type: "TEXT", label: QUESTION_TYPE_LABELS.TEXT },
  { type: "NUMBER", label: QUESTION_TYPE_LABELS.NUMBER },
  { type: "CHOICE_SINGLE", label: QUESTION_TYPE_LABELS.CHOICE_SINGLE },
  { type: "CHOICE_MULTI", label: QUESTION_TYPE_LABELS.CHOICE_MULTI },
  { type: "BOOLEAN", label: QUESTION_TYPE_LABELS.BOOLEAN },
  { type: "DATE", label: QUESTION_TYPE_LABELS.DATE },
];

export default function InlineAddButton({ onAdd }: InlineAddButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);

        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative group/line my-4 h-4 flex items-center justify-center">
      <div className="absolute inset-x-0 h-[2px] bg-transparent group-hover/line:bg-indigo-100 transition-colors pointer-events-none" />

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all group-hover/line:scale-110 group-hover/line:border-indigo-500 group-hover/line:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
          isOpen ? "scale-110 border-indigo-500 text-indigo-600 rotate-45" : ""
        }`}
        aria-label="Додати питання сюди"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="3"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Типи питань"
          className="absolute top-7 z-30 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100"
        >
          {OPTIONS.map((opt) => (
            <button
              key={opt.type}
              type="button"
              role="menuitem"
              onClick={() => {
                onAdd(opt.type);
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
              className="flex w-full items-center rounded-lg px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
