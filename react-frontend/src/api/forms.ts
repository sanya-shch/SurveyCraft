import { api } from "./axios";
import { type FormSummary } from "../types/form";
import type { FormState } from "../types/formBuilder";

export const formsApi = {
  // GET /api/forms
  getAll: async (): Promise<FormSummary[]> => {
    const response = await api.get("/forms");
    return response.data;
  },

  // POST /api/forms
  create: async (): Promise<FormSummary> => {
    const response = await api.post("/forms", {
      title: "Нове опитування",
      description: "",
    });
    return response.data;
  },

  // DELETE /api/forms/:formId
  delete: async (formId: string): Promise<void> => {
    await api.delete(`/forms/${formId}`);
  },

  // PATCH /api/forms/:formId/publish
  publish: async (formId: string): Promise<void> => {
    const response = await api.patch(`/forms/${formId}/publish`);
    return response.data;
  },

  // PATCH /api/forms/:formId/unpublish
  unpublish: async (formId: string): Promise<void> => {
    const response = await api.patch(`/forms/${formId}/unpublish`);
    return response.data;
  },

  // POST /api/forms/:formId/duplicate
  duplicate: async (formId: string): Promise<FormSummary> => {
    const response = await api.post(`/forms/${formId}/duplicate`);
    return response.data;
  },

  // PATCH /api/forms/:formId
  update: async (formId: string, data: FormState): Promise<void> => {
    const response = await api.patch(`/forms/${formId}`, data);
    return response.data;
  },

  // GET /api/forms/:formId/admin
  getAdminForm: async (formId: string): Promise<FormState> => {
    const response = await api.get(`/forms/${formId}/admin`);
    return response.data;
  },
};
