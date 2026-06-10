import { useState } from "react";
import { useResponsesListQuery } from "../hooks/useAnalytics";
import { DetailedResponseView } from "./DetailedResponseView";

export default function ResponsesTab({ formId }: { formId: string }) {
  const [page, setPage] = useState<number>(1);
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);

  const { data: listData, isLoading: isListLoading } = useResponsesListQuery(formId, page);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">
          Всі відповіді
        </h3>

        {isListLoading ? (
          <div className="text-center py-6 text-slate-400 text-xs">Завантаження списку...</div>
        ) : listData?.data.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">Немає відповідей</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {listData?.data.map((resp) => {
              const isSelected = selectedResponseId === resp.id;
              return (
                <button
                  key={resp.id}
                  onClick={() => setSelectedResponseId(resp.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                      : "bg-slate-50 border-slate-200/60 text-slate-700 hover:bg-slate-100/70 cursor-pointer"
                  }`}
                >
                  <div className="font-bold truncate line-clamp-1">ID: {resp.id}</div>
                  <div
                    className={`mt-1 text-[10px] ${isSelected ? "text-indigo-200" : "text-slate-400"}`}
                  >
                    {new Date(resp.createdAt).toLocaleString("uk-UA")}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {listData && listData.total > listData.limit && (
          <div className="flex justify-between items-center pt-2 border-t text-xs">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-2.5 py-1 rounded border bg-white disabled:opacity-40 font-bold"
            >
              Назад
            </button>
            <span className="text-slate-400 font-medium">Сторінка {page}</span>
            <button
              disabled={page * listData.limit >= listData.total}
              onClick={() => setPage((p) => p + 1)}
              className="px-2.5 py-1 rounded border bg-white disabled:opacity-40 font-bold"
            >
              Вперед
            </button>
          </div>
        )}
      </div>

      <div className="md:col-span-2">
        {selectedResponseId ? (
          <DetailedResponseView formId={formId} responseId={selectedResponseId} />
        ) : (
          <div className="h-48 border-2 border-dashed border-slate-200 bg-white rounded-2xl flex items-center justify-center text-slate-400 font-medium text-sm text-center px-4">
            Оберіть відповідь зі списку ліворуч для перегляду деталей
          </div>
        )}
      </div>
    </div>
  );
}
