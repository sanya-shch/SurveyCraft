import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
});

// автоматично додаємо Bearer токен до КОЖНОГО запиту
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// перехоплюємо 401 помилки (якщо токен протух)
// Для запитів vue-analytics (Module Federation remote) той самий ефект
// (clearAuth -> ProtectedRoute реагує на isAuthenticated) досягається не
// напряму, а через AUTH_EXPIRED_EVENT - див. useAuthExpiredListener.ts.
// React-запитам цей event не потрібен: clearAuth() тут одразу оновлює
// Zustand, на який ProtectedRoute і так підписаний реактивно.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
    }
    return Promise.reject(error);
  },
);

export const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
});
