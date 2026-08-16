import { useParams } from "react-router-dom";
import { type FormAnswers } from "../../types/formViewer";
import { usePublicFormQuery, useSubmitResponsesMutation } from "./hooks/usePublicForm";
import FormViewer from "./FormViewer";
import QuestionStepper from "./QuestionStepper";
import { useState } from "react";

interface ExpectedError {
  response?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

export default function PublicFormPage() {
  const { shareId } = useParams<{ shareId: string }>();

  const { data: formData, isLoading, error } = usePublicFormQuery(shareId);

  const [formServerErrors, setFormServerErrors] = useState<Record<string, string>>({});

  const [mode, setMode] = useState<"all" | "step">("all");

  const {
    mutate: submitResponses,
    isSuccess: isSubmitted,
    isPending: isSubmitting,
  } = useSubmitResponsesMutation();

  const handleClearServerError = (fieldId: string) => {
    setFormServerErrors((prev) => {
      if (!prev[fieldId]) return prev;
      const copy = { ...prev };
      delete copy[fieldId];
      return copy;
    });
  };

  const handleFormSubmit = (cleanedAnswers: FormAnswers) => {
    setFormServerErrors({});

    if (shareId)
      submitResponses(
        { shareId, answers: cleanedAnswers },
        {
          onError: (error: unknown) => {
            const err = error as ExpectedError;

            const errorResponseBody = err.response?.data || err.data;

            console.log("Дебаг помилки в onError:", errorResponseBody);

            if (errorResponseBody && Array.isArray(errorResponseBody.errors)) {
              const mappedErrors: Record<string, string> = {};

              errorResponseBody.errors.forEach((err: { field: string; message: string }) => {
                if (!mappedErrors[err.field]) {
                  mappedErrors[err.field] = err.message;
                }
              });

              setFormServerErrors(mappedErrors);

              const firstErrorField = errorResponseBody.errors[0]?.field;
              if (firstErrorField) {
                setTimeout(() => {
                  document.getElementById(`card-${firstErrorField}`)?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }, 60);
              }
            }
          },
        },
      );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <p className="text-sm font-semibold text-slate-500">Завантаження опитування...</p>
        </div>
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm">
          <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-800">Помилка доступу</h3>
          <p className="text-sm text-slate-500 mt-1">
            {error instanceof Error ? error.message : "Форму не знайдено або доступ обмежено"}
          </p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="h-12 w-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Дякуємо!</h2>
          <p className="text-sm text-slate-500 mt-2">
            Ваші відповіді успішно збережено. Опитування завершено.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={isSubmitting ? "opacity-60 pointer-events-none transition-opacity" : ""}>
      <div className="fixed top-4 right-4 z-10 flex gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
        {(
          [
            { key: "all", label: "Усі питання" },
            { key: "step", label: "По одному" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setMode(opt.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              mode === opt.key ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {mode === "all" ? (
        <FormViewer
          formTitle={formData.title}
          formDescription={formData.description}
          questions={formData.questions}
          serverErrors={formServerErrors}
          onClearServerError={handleClearServerError}
          onSubmit={handleFormSubmit}
        />
      ) : (
        <QuestionStepper
          formTitle={formData.title}
          formDescription={formData.description}
          questions={formData.questions}
          serverErrors={formServerErrors}
          onClearServerError={handleClearServerError}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}
