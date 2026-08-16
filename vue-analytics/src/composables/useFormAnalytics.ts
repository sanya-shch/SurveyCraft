import { ref, shallowRef } from "vue";
import type { FormAnalyticsDto } from "@surveycraft/shared-types";
import { apiGet, ApiError } from "../api/client";

export function useFormAnalytics(apiBaseUrl: string, formId: string) {
  const data = shallowRef<FormAnalyticsDto | null>(null);
  const isLoading = ref(true);
  const error = ref<string | null>(null);

  const load = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      data.value = await apiGet<FormAnalyticsDto>(apiBaseUrl, `/forms/${formId}/analytics`);
    } catch (e) {
      error.value =
        e instanceof ApiError
          ? e.status === 403
            ? "Немає доступу до аналітики цієї форми"
            : e.status === 404
              ? "Форму не знайдено"
              : "Не вдалося завантажити аналітику"
          : "Не вдалося завантажити аналітику";
    } finally {
      isLoading.value = false;
    }
  };

  load();

  return { data, isLoading, error, reload: load };
}
