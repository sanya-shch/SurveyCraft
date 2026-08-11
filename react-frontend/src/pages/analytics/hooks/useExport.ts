import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { exportApi } from "../../../api/exportApi";
import { type ExportFormat, type ExportJobDto } from "../../../types/export";

const ACTIVE_STATUSES = new Set<ExportJobDto["status"]>(["PENDING", "PROCESSING"]);

export const useExportJobsQuery = (formId: string) =>
  useQuery({
    queryKey: ["export", "jobs", formId],
    queryFn: () => exportApi.list(formId),
    refetchInterval: (query) => {
      const jobs = query.state.data ?? [];
      return jobs.some((job) => ACTIVE_STATUSES.has(job.status)) ? 2000 : false;
    },
  });

export const useCreateExportMutation = (formId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (format: ExportFormat) => exportApi.create(formId, format),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["export", "jobs", formId] });
    },
  });
};

export const useDownloadExportMutation = (formId: string) =>
  useMutation({
    mutationFn: (job: ExportJobDto) => exportApi.download(formId, job),
  });
