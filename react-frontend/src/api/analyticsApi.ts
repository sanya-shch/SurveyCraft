import {
  type FormAnalyticsDto,
  type QuestionAnalyticsDto,
  type ResponseListDto,
  type ResponseDetailsDto,
} from "../types/analytics";
import { api } from "./axios";

export const analyticsApi = {
  getOverview: async (formId: string): Promise<FormAnalyticsDto> => {
    const response = await api.get(`/forms/${formId}/analytics`);
    return response.data;
  },

  getQuestionDetails: async (formId: string, questionId: string): Promise<QuestionAnalyticsDto> => {
    const response = await api.get(`/forms/${formId}/questions/${questionId}/analytics`);
    return response.data;
  },

  getResponsesList: async (formId: string, page = 1, limit = 10): Promise<ResponseListDto> => {
    const response = await api.get(`/forms/${formId}/responses?page=${page}&limit=${limit}`);
    return response.data;
  },

  getResponseById: async (formId: string, responseId: string): Promise<ResponseDetailsDto> => {
    const response = await api.get(`/forms/${formId}/responses/${responseId}`);
    return response.data;
  },
};
