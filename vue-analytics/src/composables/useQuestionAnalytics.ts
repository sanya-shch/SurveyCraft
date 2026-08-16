import { ref, shallowRef } from "vue";
import type { QuestionAnalyticsDto } from "@surveycraft/shared-types";
import { apiGet, ApiError } from "../api/client";

export function useQuestionAnalytics(apiBaseUrl: string, formId: string) {
  const data = shallowRef<QuestionAnalyticsDto | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const load = async (questionId: string) => {
    isLoading.value = true;
    error.value = null;
    data.value = null;
    try {
      data.value = await apiGet<QuestionAnalyticsDto>(
        apiBaseUrl,
        `/forms/${formId}/questions/${questionId}/analytics`,
      );
    } catch (e) {
      error.value =
        e instanceof ApiError ? "Не вдалося завантажити деталі питання" : "Помилка мережі";
    } finally {
      isLoading.value = false;
    }
  };

  return { data, isLoading, error, load };
}
