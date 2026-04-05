import { post } from '@/api/ky';
import type { AuthResponse, LoginRequest, RegisterRequest, RefreshResponse } from '@/types';

export const authApi = {
  login: (data: LoginRequest) =>
    post<AuthResponse>('auth/login', data),

  register: (data: RegisterRequest) =>
    post<AuthResponse>('auth/register', data),

  refresh: (refreshToken: string) =>
    post<RefreshResponse>('auth/refresh', { refreshToken }),
};
