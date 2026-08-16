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
      // За релогін (редірект на /login) відповідає React-хост - Vue-remote
      // лише прибирає протухлий токен, як і React-інтерцептор в axios.ts.
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
    throw new ApiError(res.status, `Запит завершився помилкою ${res.status}`);
  }

  return res.json() as Promise<T>;
};
