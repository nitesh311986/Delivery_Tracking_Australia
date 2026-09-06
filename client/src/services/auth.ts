/// <reference types="vite/client" />

import axios, { type AxiosError } from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type Role = 'DRIVER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  businessName: string | null;
  subcontractorName: string | null;
  rego: string | null;
  yardLocation: string | null;
}

interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: AuthUser;
  };
}

interface MeResponse {
  success: boolean;
  data: AuthUser;
}

export async function login(
  email: string,
  password: string
): Promise<{ token: string; user: AuthUser }> {
  const response = await api.post<LoginResponse>('/auth/login', {
    email,
    password,
  });
  return response.data.data;
}

export async function me(): Promise<AuthUser> {
  const response = await api.get<MeResponse>('/auth/me');
  return response.data.data;
}

export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    return (
      axiosError.response?.data?.error ||
      axiosError.response?.data?.message ||
      axiosError.message ||
      'Request failed'
    );
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
