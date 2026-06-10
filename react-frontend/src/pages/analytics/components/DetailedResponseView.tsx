import { useSingleResponseQuery } from "../hooks/useAnalytics";

export function DetailedResponseView({
  formId,
  responseId,
}: {
  formId: string;
  responseId: string;
}) {
  const { data: respData, isLoading } = useSingleResponseQuery(formId, responseId);

  if (isLoading)
    return (
      <div className="bg-white border p-6 rounded-2xl text-slate-400 text-sm text-center">
        Завантаження...
      </div>
    );
  if (!respData)
    return (
      <div className="bg-white border p-6 rounded-2xl text-rose-500 text-sm text-center">
        Помилка
      </div>
    );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-slate-800">Перегляд відповіді</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Надіслано: {new Date(respData.createdAt).toLocaleString("uk-UA")}
          </p>
        </div>
        <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-1 rounded border">
          ID: {respData.id}
        </span>
      </div>

      <div className="space-y-4">
        {respData.answers.map((ans) => (
          <div
            key={ans.questionId}
            className="border-b border-slate-50 pb-3 last:border-0 last:pb-0"
          >
            <label className="text-base font-bold text-slate-800 flex items-center gap-1">
              {ans.questionText}
              {ans.questionRequired && <span className="text-rose-500">*</span>}
            </label>

            {ans.questionDescription && (
              <span className="text-xs font-bold text-slate-400 block">
                {ans.questionDescription}
              </span>
            )}

            <div className="text-sm mt-1.5">
              {Array.isArray(ans.displayValue) ? (
                <div className="flex flex-wrap gap-1.5">
                  {ans.displayValue.map((text, idx) => (
                    <span
                      key={idx}
                      className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-lg font-bold"
                    >
                      {text}
                    </span>
                  ))}
                </div>
              ) : ans.questionType === "BOOLEAN" ? (
                <span
                  className={`border rounded-xl px-3 py-2 block font-medium text-slate-600 ${ans.rawValue ? "bg-emerald-50/60 border-emerald-100" : "bg-rose-50/60 border-rose-100"}`}
                >
                  {ans.displayValue}
                </span>
              ) : (
                <span className="bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 block font-medium text-slate-600">
                  {ans.displayValue}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
