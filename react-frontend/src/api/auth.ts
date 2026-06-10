import { z } from "zod";
import { api } from "./axios";

export const loginSchema = z.object({
  email: z.string().min(1, "Email є обовʼязковим").email("Некоректний формат email"),
  password: z.string().min(6, "Пароль має містити мінімум 6 символів"),
});

export const registerSchema = loginSchema
  .extend({
    confirmPassword: z.string().min(1, "Підтвердження пароля є обовʼязковим"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Паролі не співпадають",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

export const authApi = {
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  register: async (data: Omit<RegisterInput, "confirmPassword">): Promise<AuthResponse> => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  getMe: async (): Promise<{ id: string; email: string }> => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};
