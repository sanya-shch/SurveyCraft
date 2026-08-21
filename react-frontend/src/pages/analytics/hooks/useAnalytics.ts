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
