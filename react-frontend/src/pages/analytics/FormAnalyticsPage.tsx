import { useParams, useSearchParams } from "react-router-dom";
import AnalyticsHeader from "./components/AnalyticsHeader";
import VueAnalyticsHost from "./components/VueAnalyticsHost";
import ResponsesTab from "./components/ResponsesTab";

export default function FormAnalyticsPage() {
  const { formId } = useParams<{ formId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || "overview";

  if (!formId) return <div className="p-6 text-rose-500 font-bold">Form ID missing</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AnalyticsHeader formId={formId} />

      <div className="flex-1 max-w-5xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setSearchParams({ tab: "overview" })}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600 cursor-pointer"
            }`}
          >
            Загальний огляд
          </button>
          <button
            onClick={() => setSearchParams({ tab: "responses" })}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === "responses"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600 cursor-pointer"
            }`}
          >
            Сирі відповіді
          </button>
        </div>

        <div className="mt-4">
          {activeTab === "overview" ? (
            <VueAnalyticsHost formId={formId} />
          ) : (
            <ResponsesTab formId={formId} />
          )}
        </div>
      </div>
    </div>
  );
}
