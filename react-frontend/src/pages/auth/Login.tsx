import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { loginSchema, type LoginInput, authApi } from "../../api/auth";
import { useAuthStore } from "../../store/useAuthStore";
import { Input } from "../../components/ui/Input";
import { AxiosError } from "axios";

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      navigate("/dashboard");
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const serverMessage = error.response?.data?.message || "Невірний email або пароль";
      setError("root", { message: serverMessage });
    },
  });

  const onSubmit = (data: LoginInput) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
            Вхід у кабінет
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Або{" "}
            <Link
              to="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              створіть новий акаунт
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {errors.root && (
            <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-100 animate-fade-in">
              {errors.root.message}
            </div>
          )}

          <Input
            label="Email адреса"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="Пароль"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 cursor-pointer mt-6"
          >
            {loginMutation.isPending ? "Вхід..." : "Увійти"}
          </button>
        </form>
      </div>
    </div>
  );
}
