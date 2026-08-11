import { useEffect, useRef, useState } from "react";
import {
  useCreateExportMutation,
  useDownloadExportMutation,
  useExportJobsQuery,
} from "../hooks/useExport";
import { type ExportFormat, type ExportJobDto } from "../../../types/export";

const FORMAT_LABELS: Record<ExportFormat, string> = {
  CSV: "CSV",
  EXCEL: "Excel",
  PDF: "PDF",
};

const STATUS_META: Record<ExportJobDto["status"], { label: string; className: string }> = {
  PENDING: { label: "У черзі", className: "text-slate-400" },
  PROCESSING: { label: "Генерується...", className: "text-amber-500" },
  COMPLETED: { label: "Готово", className: "text-emerald-600" },
  FAILED: { label: "Помилка", className: "text-rose-600" },
};

function StatusIcon({ status }: { status: ExportJobDto["status"] }) {
  if (status === "PENDING" || status === "PROCESSING") {
    return (
      <div className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
    );
  }

  if (status === "COMPLETED") {
    return (
      <svg
        className="h-3.5 w-3.5 shrink-0 text-emerald-600"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2.5"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    );
  }

  return (
    <svg
      className="h-3.5 w-3.5 shrink-0 text-rose-600"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2.5"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function ExportMenu({ formId }: { formId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: jobs = [] } = useExportJobsQuery(formId);
  const createExport = useCreateExportMutation(formId);
  const downloadExport = useDownloadExportMutation(formId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
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
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        Експорт
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-72 origin-top-right rounded-xl border border-slate-200 bg-white p-3 shadow-lg ring-1 ring-black/5 z-30 animate-in fade-in slide-in-from-top-1 duration-100">
          <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Новий експорт
          </p>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {(Object.keys(FORMAT_LABELS) as ExportFormat[]).map((format) => (
              <button
                key={format}
                onClick={() => createExport.mutate(format)}
                disabled={createExport.isPending}
                className="rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {FORMAT_LABELS[format]}
              </button>
            ))}
          </div>

          {createExport.isError && (
            <p className="mt-2 text-[11px] font-medium text-rose-600">
              Не вдалося поставити завдання в чергу. Спробуйте ще раз.
            </p>
          )}

          <hr className="my-3 border-slate-100" />

          <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Історія
          </p>

          {recentJobs.length === 0 ? (
            <p className="px-1 py-3 text-xs text-slate-400">Ще не було жодного експорту</p>
          ) : (
            <div className="mt-1.5 flex flex-col gap-1">
              {recentJobs.map((job) => {
                const meta = STATUS_META[job.status];
                return (
                  <div
                    key={job.id}
                    className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1.5 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusIcon status={job.status} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700">
                          {FORMAT_LABELS[job.format]}
                        </p>
                        <p className={`text-[10px] font-medium truncate ${meta.className}`}>
                          {job.status === "FAILED" && job.error ? job.error : meta.label}
                        </p>
                      </div>
                    </div>

                    {job.status === "COMPLETED" && (
                      <button
                        onClick={() => downloadExport.mutate(job)}
                        title="Завантажити"
                        className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
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
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
