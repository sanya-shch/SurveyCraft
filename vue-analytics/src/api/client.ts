import { AUTH_EXPIRED_EVENT } from "@surveycraft/shared-types";

const AUTH_TOKEN_STORAGE_KEY = "token";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const apiGet = async <T>(apiBaseUrl: string, path: string): Promise<T> => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

  const res = await fetch(`${apiBaseUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    if (res.status === 401) {
      // Токен протух. Vue сам НЕ вирішує, куди редіректити - single
      // source of truth для logout лишається React-хост (ProtectedRoute
      // реагує на Zustand-стан). Просте видалення localStorage-ключа тут
      // недостатнє: Zustand-стор React читає localStorage лише ОДИН раз
      // при ініціалізації (react-frontend/src/store/useAuthStore.ts), тож
      // зміна localStorage ЗЗОВНІ (з Vue) сама по собі ніяк не долетить
      // до React-стану без явного сигналу - CustomEvent це і є.
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(res.status, `Запит завершився помилкою ${res.status}`);
  }

  return res.json() as Promise<T>;
};
