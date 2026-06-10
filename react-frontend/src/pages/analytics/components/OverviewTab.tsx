import { useFormOverviewQuery } from "../hooks/useAnalytics";
import { AnalyticsQuestionCard } from "./AnalyticsQuestionCard";

export default function OverviewTab({ formId }: { formId: string }) {
  const { data, isLoading, error } = useFormOverviewQuery(formId);

  if (isLoading)
    return (
      <div className="text-center py-12 text-slate-400 font-medium">Завантаження метрик...</div>
    );
  if (error || !data)
    return (
      <div className="text-center py-12 text-rose-500 font-medium">Помилка завантаження даних</div>
    );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 max-w-xs shadow-sm">
        <p className="text-sm font-medium text-slate-400">Всього відповідей</p>
        <p className="mt-2 text-3xl font-bold text-emerald-600 tracking-tight">
          {data.totalResponses}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {data.questions.map((q) => (
          <AnalyticsQuestionCard
            key={q.id}
            question={q}
            formId={formId}
            totalResponses={data.totalResponses}
          />
        ))}
      </div>
    </div>
  );
}
