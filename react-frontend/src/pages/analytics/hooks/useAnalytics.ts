import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../../../api/analyticsApi";

export const useFormOverviewQuery = (formId: string) =>
  useQuery({
    queryKey: ["analytics", "overview", formId],
    queryFn: () => analyticsApi.getOverview(formId),
  });

export const useQuestionAnalyticsQuery = (formId: string, questionId: string) =>
  useQuery({
    queryKey: ["analytics", "question", formId, questionId],
    queryFn: () => analyticsApi.getQuestionDetails(formId, questionId),
    enabled: !!questionId,
  });

export const useResponsesListQuery = (formId: string, page: number, limit = 10) =>
  useQuery({
    queryKey: ["analytics", "responses", formId, page],
    queryFn: () => analyticsApi.getResponsesList(formId, page, limit),
  });

export const useSingleResponseQuery = (formId: string, responseId: string) =>
  useQuery({
    queryKey: ["analytics", "singleResponse", formId, responseId],
    queryFn: () => analyticsApi.getResponseById(formId, responseId),
    enabled: !!responseId,
  });
