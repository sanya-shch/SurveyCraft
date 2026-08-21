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

const request = async (
  apiBaseUrl: string,
  path: string,
  options: RequestInit = {},
): Promise<Response> => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

  const res = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
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

  return res;
};

export const apiGet = async <T>(apiBaseUrl: string, path: string): Promise<T> => {
  const res = await request(apiBaseUrl, path);
  return res.json() as Promise<T>;
};

export const apiPost = async <T>(apiBaseUrl: string, path: string, body: unknown): Promise<T> => {
  const res = await request(apiBaseUrl, path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<T>;
};

export const apiDownload = async (
  apiBaseUrl: string,
  path: string,
): Promise<{ blob: Blob; fileName: string | null }> => {
  const res = await request(apiBaseUrl, path);
  const blob = await res.blob();
  const disposition = res.headers.get("content-disposition");
  const match = disposition?.match(/filename="?([^"]+)"?/);
  return { blob, fileName: match?.[1] ?? null };
};
