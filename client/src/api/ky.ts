import ky, { type KyInstance } from 'ky';
import { useAuthStore } from '@/store/auth.store';
import type { ApiResponse } from '@/types';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();
  if (!refreshToken) {
    clearAuth();
    return false;
  }

  try {
    const response = await ky
      .post('auth/refresh', {
        prefixUrl: import.meta.env.VITE_API_URL,
        json: { refreshToken },
      })
      .json<ApiResponse<{ accessToken: string; refreshToken: string }>>();

    if (response.success) {
      setTokens(response.data.accessToken, response.data.refreshToken);
      return true;
    }
    clearAuth();
    return false;
  } catch {
    clearAuth();
    return false;
  }
}

const api: KyInstance = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL,
  timeout: 30000,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        if (response.status === 401) {
          if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = attemptTokenRefresh().finally(() => {
              isRefreshing = false;
              refreshPromise = null;
            });
          }

          const refreshed = await refreshPromise;
          if (refreshed) {
            const token = useAuthStore.getState().accessToken;
            request.headers.set('Authorization', `Bearer ${token!}`);
            return ky(request);
          }

          window.location.href = '/login';
        }
      },
    ],
  },
});

export async function get<T>(url: string, searchParams?: Record<string, string | number | undefined>): Promise<T> {
  const cleaned: Record<string, string> = {};
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== '') {
        cleaned[key] = String(value);
      }
    }
  }
  const response = await api.get(url, { searchParams: cleaned }).json<ApiResponse<T>>();
  return response.data;
}

export async function getPaginated<T>(
  url: string,
  searchParams?: Record<string, string | number | undefined>
): Promise<{ data: T; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  const cleaned: Record<string, string> = {};
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== '') {
        cleaned[key] = String(value);
      }
    }
  }
  const response = await api.get(url, { searchParams: cleaned }).json<ApiResponse<T> & { meta: { page: number; limit: number; total: number; totalPages: number } }>();
  return { data: response.data, meta: response.meta! };
}

export async function post<T>(url: string, data?: unknown): Promise<T> {
  const response = await api.post(url, { json: data }).json<ApiResponse<T>>();
  return response.data;
}

export async function put<T>(url: string, data?: unknown): Promise<T> {
  const response = await api.put(url, { json: data }).json<ApiResponse<T>>();
  return response.data;
}

export async function del<T>(url: string): Promise<T> {
  const response = await api.delete(url).json<ApiResponse<T>>();
  return response.data;
}

export async function extractApiError(error: unknown): Promise<string> {
  if (error && typeof error === 'object' && 'response' in error) {
    try {
      const body = await (error as { response: Response }).response.json();
      if (body?.error?.message) return body.error.message;
    } catch {
      // response not parseable
    }
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export { api };
