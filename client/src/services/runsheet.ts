/// <reference types="vite/client" />

import axios, { type AxiosError } from 'axios';
import {
  type ApiResponse,
  type CreateLegRequest,
  type CreateRunsheetRequest,
  type CompleteRunsheetRequest,
  type Runsheet,
  type RunsheetLegItem,
} from '../types/runsheet';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api/v1';

const api = axios.create({
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

function wrap<T>(response: { data: T; status: number }): ApiResponse<T> {
  return { data: response.data, status: response.status };
}

export async function createRunsheet(
  payload: CreateRunsheetRequest
): Promise<ApiResponse<Runsheet>> {
  const response = await api.post<Runsheet>('/runsheets', payload);
  return wrap(response);
}

export async function addLeg(
  runsheetId: string,
  payload: CreateLegRequest
): Promise<ApiResponse<RunsheetLegItem>> {
  const response = await api.post<RunsheetLegItem>(`/runsheets/${runsheetId}/legs`, payload);
  return wrap(response);
}

export async function completeRunsheet(
  runsheetId: string,
  payload: CompleteRunsheetRequest
): Promise<ApiResponse<Runsheet>> {
  const response = await api.put<Runsheet>(`/runsheets/${runsheetId}/complete`, payload);
  return wrap(response);
}

export async function getMyRunsheets(params: {
  status?: 'COMPLETED' | 'DRAFT' | '';
  startDate?: string;
  endDate?: string;
} = {}): Promise<Runsheet[]> {
  const response = await api.get<unknown>('/runsheets', { params });
  const payload = (response.data ?? {}) as any;
  const items = payload?.data ?? payload?.items ?? payload ?? [];
  return Array.isArray(items) ? items : [];
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
