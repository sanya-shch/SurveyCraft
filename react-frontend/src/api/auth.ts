import { z } from "zod";
import { api, publicApi } from "./axios";

export const loginSchema = z.object({
  email: z.string().min(1, "Email є обовʼязковим").email("Некоректний формат email"),
  password: z.string().min(1, "Пароль є обовʼязковим"),
});

/**
 * Складність пароля дзеркалить backend/src/modules/auth/auth.schema.ts -
 * застосовується лише при РЕЄСТРАЦІЇ (як і на бекенді), щоб користувач
 * дізнавався про слабкий пароль одразу у формі, а не лише після 400 від
 * сервера.
 */
const registerPasswordSchema = z
  .string()
  .min(8, "Пароль має містити щонайменше 8 символів")
  .regex(/[a-z]/, "Пароль має містити хоча б одну малу літеру")
  .regex(/[A-Z]/, "Пароль має містити хоча б одну велику літеру")
  .regex(/[0-9]/, "Пароль має містити хоча б одну цифру");

export const registerSchema = z
  .object({
    email: z.string().min(1, "Email є обовʼязковим").email("Некоректний формат email"),
    password: registerPasswordSchema,
    confirmPassword: z.string().min(1, "Підтвердження пароля є обовʼязковим"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Паролі не співпадають",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

interface AuthResponse {
  // Короткоживучий (15 хв) access-токен. Довгостроковий refresh-токен у
  // відповіді НЕ приходить - сервер виставляє його окремо як httpOnly
  // cookie (JS до нього доступу не має).
  accessToken: string;
  user: {
    id: string;
    email: string;
  };
}

interface RefreshResponse {
  accessToken: string;
}

export const authApi = {
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await publicApi.post("/auth/login", data, { withCredentials: true });
    return response.data;
  },

  register: async (data: Omit<RegisterInput, "confirmPassword">): Promise<AuthResponse> => {
    const response = await publicApi.post("/auth/register", data, { withCredentials: true });
    return response.data;
  },

  getMe: async (): Promise<{ id: string; email: string }> => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  // Обмінює refresh-cookie на новий access-токен. Використовується axios
  // response-інтерцептором (api/axios.ts) при 401, а не напряму сторінками.
  refresh: async (): Promise<RefreshResponse> => {
    const response = await publicApi.post("/auth/refresh", undefined, { withCredentials: true });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await publicApi.post("/auth/logout", undefined, { withCredentials: true });
  },
};
