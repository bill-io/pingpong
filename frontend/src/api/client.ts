import { useAuthStore } from "@/store/authStore";

async function parseResponse<T>(res: Response, logout: () => void): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401) {
      logout();
    }
    throw new Error(text || `HTTP ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text().catch(() => "");
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { token, logout } = useAuthStore.getState();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`/api${path}`, {
    headers,
    ...init
  });

  return parseResponse<T>(res, logout);
}

async function upload<T>(path: string, formData: FormData): Promise<T> {
  const { token, logout } = useAuthStore.getState();
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers,
    body: formData
  });

  return parseResponse<T>(res, logout);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined
    }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined
    }),
  upload: <T>(path: string, formData: FormData) => upload<T>(path, formData)
};
