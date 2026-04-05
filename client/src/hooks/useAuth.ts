import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '@/api/endpoints/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { extractApiError } from '@/api/ky';
import type { LoginRequest, RegisterRequest } from '@/types';

export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => {
      setAuth({
        user: data.user,
        company: data.company,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      toast.success(`Welcome back, ${data.user.name}`);
      navigate('/', { replace: true });
    },
    onError: async (error) => {
      const message = await extractApiError(error);
      toast.error(message);
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (data) => {
      setAuth({
        user: data.user,
        company: data.company,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      toast.success('Account created successfully');
      navigate('/', { replace: true });
    },
    onError: async (error) => {
      const message = await extractApiError(error);
      toast.error(message);
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  return () => {
    clearAuth();
    toast.success('Logged out');
    navigate('/login', { replace: true });
  };
}
