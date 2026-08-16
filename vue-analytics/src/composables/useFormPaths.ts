import { ref, shallowRef } from "vue";
import type { FormPathsDto } from "@surveycraft/shared-types";
import { apiGet, ApiError } from "../api/client";

export function useFormPaths(apiBaseUrl: string, formId: string) {
  const data = shallowRef<FormPathsDto | null>(null);
  const isLoading = ref(true);
  const error = ref<string | null>(null);

  const load = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      data.value = await apiGet<FormPathsDto>(apiBaseUrl, `/forms/${formId}/analytics/paths`);
    } catch (e) {
      error.value =
        e instanceof ApiError ? "Не вдалося завантажити шляхи проходження" : "Помилка мережі";
    } finally {
      isLoading.value = false;
    }
  };

  load();

  return { data, isLoading, error, reload: load };
}
