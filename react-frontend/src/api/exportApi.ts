import { api } from "./axios";
import { type ExportFormat, type ExportJobDto } from "../types/export";

const extractFileName = (contentDisposition: string | undefined, fallback: string) => {
  const match = contentDisposition?.match(/filename="?([^"]+)"?/);
  return match?.[1] ?? fallback;
};

export const exportApi = {
  // POST /api/forms/:formId/export
  create: async (formId: string, format: ExportFormat): Promise<ExportJobDto> => {
    const response = await api.post(`/forms/${formId}/export`, { format });
    return response.data;
  },

  // GET /api/forms/:formId/export
  list: async (formId: string): Promise<ExportJobDto[]> => {
    const response = await api.get(`/forms/${formId}/export`);
    return response.data;
  },

  // GET /api/forms/:formId/export/:jobId
  getStatus: async (formId: string, jobId: string): Promise<ExportJobDto> => {
    const response = await api.get(`/forms/${formId}/export/${jobId}`);
    return response.data;
  },

  // GET /api/forms/:formId/export/:jobId/download
  download: async (formId: string, job: ExportJobDto): Promise<void> => {
    const response = await api.get(`/forms/${formId}/export/${job.id}/download`, {
      responseType: "blob",
    });

    const fileName = extractFileName(
      response.headers["content-disposition"],
      job.fileName ?? "export",
    );

    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
