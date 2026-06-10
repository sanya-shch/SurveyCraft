import { useNavigate } from "react-router-dom";
import type { QuestionOverview } from "../../../types/analytics";

export function AnalyticsQuestionCard({
  question,
  formId,
  totalResponses,
}: {
  question: QuestionOverview;
  formId: string;
  totalResponses: number;
}) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/analytics/${formId}/questions/${question.id}`)}
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group relative"
    >
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 mb-1.5 uppercase">
            {question.type}
          </span>
          <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2">
            {question.text || "Питання без назви"}
          </h3>
        </div>
        <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-500 flex items-center gap-1 shrink-0">
          Детальніше
          <svg
            className="h-3.5 w-3.5 transform group-hover:translate-x-0.5 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </span>
      </div>

      {(question.type === "TEXT" || question.type === "DATE") && question.preview && (
        <div className="space-y-2">
          {question.preview.map((p, i) => (
            <div
              key={i}
              className="flex justify-between items-center text-sm bg-slate-50 px-3 py-2 rounded-xl"
            >
              <span className="text-slate-700 font-medium truncate max-w-md">{p.value}</span>
              <span className="text-xs font-bold text-slate-400 bg-white border px-2 py-0.5 rounded-md shadow-sm">
                {p.count}
              </span>
            </div>
          ))}
        </div>
      )}

      {question.type === "NUMBER" && question.stats && (
        <div className="grid grid-cols-3 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Середнє</span>
            <p className="text-lg font-bold text-slate-700">{question.stats.avg.toFixed(1)}</p>
          </div>
          <div className="text-center border-x border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Мін</span>
            <p className="text-lg font-bold text-slate-700">{question.stats.min}</p>
          </div>
          <div className="text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Макс</span>
            <p className="text-lg font-bold text-slate-700">{question.stats.max}</p>
          </div>
        </div>
      )}

      {(question.type === "CHOICE_SINGLE" || question.type === "CHOICE_MULTI") &&
        question.distribution && (
          <div className="space-y-2.5">
            {question.distribution.map((dist, i) => {
              const percentage = totalResponses > 0 ? (dist.count / totalResponses) * 100 : 0;

              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span className="truncate max-w-xs">{dist.text}</span>
                    <span>{dist.count}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {question.type === "BOOLEAN" && (
        <div className="flex gap-4">
          <div className="flex-1 bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 flex justify-between items-center">
            <span className="text-sm font-bold text-emerald-700">Так (True)</span>
            <span className="text-lg font-black text-emerald-800">{question.trueCount ?? 0}</span>
          </div>
          <div className="flex-1 bg-rose-50/60 border border-rose-100 rounded-xl p-3 flex justify-between items-center">
            <span className="text-sm font-bold text-rose-700">Ні (False)</span>
            <span className="text-lg font-black text-rose-800">{question.falseCount ?? 0}</span>
          </div>
        </div>
      )}
    </div>
  );
}
