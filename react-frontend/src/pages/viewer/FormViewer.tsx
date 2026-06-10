import React, { useState } from "react";
import { type Question } from "../../types/formBuilder";
import { type FormAnswers, type AnswerValue } from "../../types/formViewer";
import { ErrorInfo } from "../../components/ui/ErrorInfo";

interface FormViewerProps {
  formTitle: string;
  formDescription?: string;
  questions: Question[];
  onSubmit: (data: FormAnswers) => void;
  serverErrors?: Record<string, string>;
  onClearServerError?: (fieldId: string) => void;
}

export default function FormViewer({
  formTitle,
  formDescription,
  questions,
  onSubmit,
  serverErrors = {},
  onClearServerError,
}: FormViewerProps) {
  const [answers, setAnswers] = useState<FormAnswers>(() => {
    const initialAnswers: FormAnswers = {};

    questions.forEach((q, index) => {
      const qId = q.id || `q-${index}`;

      if (q.type === "BOOLEAN") {
        initialAnswers[qId] = q.config?.defaultValue ?? false;
      } else if (q.type === "CHOICE_SINGLE") {
        const defaultOpt = q.options?.find((o) => o.isDefault);
        initialAnswers[qId] = defaultOpt ? defaultOpt.id : "";
      } else if (q.type === "CHOICE_MULTI") {
        initialAnswers[qId] = q.options?.filter((o) => o.isDefault).map((o) => o.id) || [];
      } else {
        initialAnswers[qId] = "";
      }
    });

    return initialAnswers;
  });

  const [isSubmitAttempted, setIsSubmitAttempted] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const combinedErrors = { ...serverErrors, ...localErrors };

  const validateField = (q: Question, value: AnswerValue): string | null => {
    const isEmptyText = typeof value === "string" && value.trim() === "";
    const isEmptyArray = Array.isArray(value) && value.length === 0;
    const isUndefinedOrNull = value === undefined || value === null || value === "";
    const isEmpty = isEmptyText || isEmptyArray || isUndefinedOrNull;

    if (q.required && isEmpty) {
      return "Це поле є обов'язковим для заповнення";
    }

    if (isEmpty) return null;

    if (q.type === "NUMBER" && typeof value === "number") {
      if (q.config?.min !== undefined && value < q.config.min)
        return `Значення має бути не менше ${q.config.min}`;
      if (q.config?.max !== undefined && value > q.config.max)
        return `Значення має бути не більше ${q.config.max}`;
    }

    if (q.type === "TEXT" && typeof value === "string") {
      const trimmedValue = value.trim();

      if (q.config?.minLength !== undefined && trimmedValue.length < q.config.minLength) {
        return `Мінімальна кількість символів: ${q.config.minLength}`;
      }
      if (q.config?.maxLength !== undefined && trimmedValue.length > q.config.maxLength) {
        return `Максимальна кількість символів: ${q.config.maxLength}`;
      }

      if (q.config?.variant === "email") {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(trimmedValue)) {
          return "Введіть коректну електронну адресу";
        }
      }

      if (q.config?.variant === "name") {
        const nameRegex = /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ\s'\u2019\u02BC-]+$/;
        if (!nameRegex.test(trimmedValue)) {
          return "Ім'я може містити лише літери, пробіли або дефіси";
        }
      }

      if (q.config?.pattern) {
        const regex = new RegExp(q.config.pattern);
        if (!regex.test(trimmedValue)) {
          return "Невірний формат вводу";
        }
      }
    }

    return null;
  };

  const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

    if (serverErrors[questionId] && onClearServerError) {
      onClearServerError(questionId);
    }

    if (isSubmitAttempted) {
      const question = questions.find((q) => (q.id || "") === questionId);
      if (question) {
        const error = validateField(question, value);
        setLocalErrors((prev) => {
          const copy = { ...prev };
          if (error) {
            copy[questionId] = error;
          } else {
            delete copy[questionId];
          }
          return copy;
        });
      }
    } else {
      if (localErrors[questionId]) {
        setLocalErrors((prev) => {
          const copy = { ...prev };
          delete copy[questionId];
          return copy;
        });
      }
    }
  };

  const handleMultiChoiceChange = (questionId: string, optionId: string) => {
    const currentAnswers = (answers[questionId] as string[]) || [];
    const newValue = currentAnswers.includes(optionId)
      ? currentAnswers.filter((id) => id !== optionId)
      : [...currentAnswers, optionId];

    handleAnswerChange(questionId, newValue);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    questions.forEach((q, index) => {
      const qId = q.id || `q-${index}`;
      const value = answers[qId];
      const error = validateField(q, value);

      if (error) {
        newErrors[qId] = error;
      }
    });

    setLocalErrors(newErrors);

    const isValid = Object.keys(newErrors).length === 0;

    if (!isValid) {
      const firstErrorId = Object.keys(newErrors)[0];
      document
        .getElementById(`card-${firstErrorId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitAttempted(true);

    if (validateForm()) {
      const cleanedAnswers: FormAnswers = {};

      questions.forEach((question) => {
        const qId = question.id;
        if (!qId) return;

        const value = answers[qId];

        const isEmptyText = typeof value === "string" && value.trim() === "";
        const isEmptyArray = Array.isArray(value) && value.length === 0;
        const isUndefinedOrNull = value === undefined || value === null || value === "";

        if (!question.required && (isEmptyText || isEmptyArray || isUndefinedOrNull)) {
          return;
        }

        cleanedAnswers[qId] = value;
      });

      onSubmit(cleanedAnswers);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <form onSubmit={handleSubmit} noValidate className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm border-t-8 border-t-indigo-600">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{formTitle}</h1>
          {formDescription && <p className="text-sm text-slate-500 mt-2">{formDescription}</p>}
        </div>

        {questions.map((question, index) => {
          const qId = question.id || `q-${index}`;
          const currentAnswer = answers[qId];
          const displayVariant = question.config?.displayVariant || "list";

          const hasError = !!combinedErrors[qId];

          return (
            <div
              key={qId}
              id={`card-${qId}`}
              className={`bg-white rounded-2xl border p-6 shadow-sm space-y-4 transition-all duration-200 ${
                hasError
                  ? "border-rose-500 ring-2 ring-rose-100 shadow-rose-100/50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div>
                <label className="text-base font-bold text-slate-800 flex items-center gap-1">
                  {question.text || `Питання №${index + 1}`}
                  {question.required && <span className="text-rose-500">*</span>}
                </label>
                {question.description && (
                  <p className="text-xs text-slate-400 mt-0.5">{question.description}</p>
                )}
              </div>

              {question.type === "TEXT" &&
                (question.config?.variant === "textarea" ? (
                  <textarea
                    value={(currentAnswer as string) || ""}
                    onChange={(e) => handleAnswerChange(qId, e.target.value)}
                    className="w-full min-h-[100px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none placeholder-slate-400"
                    placeholder="Введіть розгорнуту відповідь..."
                  />
                ) : (
                  <input
                    type={question.config?.variant === "email" ? "email" : "text"}
                    value={(currentAnswer as string) || ""}
                    onChange={(e) => handleAnswerChange(qId, e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none placeholder-slate-400"
                    placeholder="Введіть відповідь..."
                  />
                ))}

              {question.type === "NUMBER" && (
                <input
                  type="number"
                  value={
                    currentAnswer !== undefined && currentAnswer !== ""
                      ? (currentAnswer as number)
                      : ""
                  }
                  onChange={(e) =>
                    handleAnswerChange(qId, e.target.value ? parseFloat(e.target.value) : "")
                  }
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                  placeholder="0"
                />
              )}

              {question.type === "BOOLEAN" && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleAnswerChange(qId, !(currentAnswer as boolean))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      currentAnswer ? "bg-indigo-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        currentAnswer ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="text-sm font-medium text-slate-600">
                    {currentAnswer ? "Так" : "Ні"}
                  </span>
                </div>
              )}

              {question.type === "CHOICE_SINGLE" && (
                <>
                  {displayVariant === "list" && (
                    <div className="flex flex-col gap-2.5">
                      {question.options.map((option) => (
                        <label
                          key={option.id}
                          className={`flex items-center gap-3 border rounded-xl p-3 text-sm font-medium cursor-pointer transition-all ${
                            currentAnswer === option.id
                              ? "bg-indigo-50/50 border-indigo-200 text-indigo-900"
                              : "bg-slate-50 border-slate-200/60 text-slate-700 hover:bg-slate-100/70"
                          }`}
                        >
                          <input
                            type="radio"
                            name={qId}
                            checked={currentAnswer === option.id}
                            onChange={() => handleAnswerChange(qId, option.id)}
                            className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                          />
                          {option.text}
                        </label>
                      ))}
                    </div>
                  )}

                  {displayVariant === "tabs" && (
                    <div className="flex flex-wrap gap-2">
                      {question.options.map((option) => {
                        const isSelected = currentAnswer === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleAnswerChange(qId, option.id)}
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
                  )}

                  {displayVariant === "dropdown" && (
                    <div className="relative">
                      <select
                        value={(currentAnswer as string) || ""}
                        onChange={(e) => handleAnswerChange(qId, e.target.value)}
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
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </>
              )}

              {question.type === "CHOICE_MULTI" && (
                <>
                  {displayVariant === "list" && (
                    <div className="flex flex-col gap-2.5">
                      {question.options.map((option) => {
                        const isChecked = ((currentAnswer as string[]) || []).includes(option.id);
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
                              onChange={() => handleMultiChoiceChange(qId, option.id)}
                              className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                            />
                            {option.text}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {displayVariant === "tabs" && (
                    <div className="flex flex-wrap gap-2">
                      {question.options.map((option) => {
                        const isSelected = ((currentAnswer as string[]) || []).includes(option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleMultiChoiceChange(qId, option.id)}
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
                  )}
                </>
              )}

              {question.type === "DATE" && (
                <input
                  type="date"
                  value={(currentAnswer as string) || ""}
                  onChange={(e) => handleAnswerChange(qId, e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              )}

              {hasError && <ErrorInfo errorText={combinedErrors[qId]} />}
            </div>
          );
        })}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white hover:bg-indigo-500 shadow-sm transition-colors focus:outline-none cursor-pointer"
          >
            Надіслати відповіді
          </button>
        </div>
      </form>
    </div>
  );
}
