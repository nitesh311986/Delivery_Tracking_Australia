/// <reference types="vite/client" />

import axios, { type AxiosError } from 'axios';
import { type Runsheet } from '../types/runsheet';

export const API_BASE_URL =
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

export interface KpiData {
  period: { start: string; end: string };
  distanceDay: number;
  distanceWeek: number;
  distanceMonth: number;
  totalPickups: number;
  totalDeliveries: number;
  totalTollExpenses: number;
  activeDrivers: number;
  totalRunsheets: number;
  totalLegs: number;
}

export interface RunsheetListResponse {
  items: Runsheet[];
  total: number;
}

export interface DriverOption {
  id: string;
  fullName: string;
}

export interface AdminDriver extends DriverOption {
  email: string;
  isActive: boolean;
  rego: string | null;
  subcontractorName: string | null;
  businessName: string | null;
  yardLocation: string | null;
  totalShifts: number;
}

export interface AdminDriverCreateInput {
  fullName: string;
  email: string;
  temporaryPassword: string;
  rego?: string;
  subcontractorName?: string;
  businessName?: string;
  yardLocation?: string;
}

export interface AdminDriverUpdateInput {
  fullName?: string;
  email?: string;
  rego?: string;
  subcontractorName?: string;
  businessName?: string;
  yardLocation?: string;
  isActive?: boolean;
}

export interface Filters {
  driverId?: string;
  start?: string;
  end?: string;
  company?: string;
  status?: 'DRAFT' | 'COMPLETED' | '';
  page?: number;
  limit?: number;
  sortBy?: 'shiftDate' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

function toParams(filters: Filters): Record<string, string | number | undefined> {
  const params: Record<string, string | number | undefined> = {};
  if (filters.driverId) params.driverId = filters.driverId;
  if (filters.start) params.start = filters.start;
  if (filters.end) params.end = filters.end;
  if (filters.company) params.company = filters.company;
  if (filters.status) params.status = filters.status;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.sortBy) params.sortBy = filters.sortBy;
  if (filters.sortOrder) params.sortOrder = filters.sortOrder;
  return params;
}

export async function getKpis(filters: Omit<Filters, 'page' | 'limit' | 'sortBy' | 'sortOrder'>): Promise<KpiData> {
  const { data } = await api.get<KpiData>('/admin/analytics/kpis', { params: toParams(filters) });
  return data;
}

export async function getDrivers(): Promise<DriverOption[]> {
  const { data } = await api.get<DriverOption[]>('/admin/drivers');
  return data;
}

export async function getAdminDrivers(): Promise<AdminDriver[]> {
  const { data } = await api.get<AdminDriver[]>('/admin/drivers');
  return data;
}

export async function createAdminDriver(input: AdminDriverCreateInput): Promise<AdminDriver> {
  const { data } = await api.post<AdminDriver>('/admin/drivers', input);
  return data;
}

export async function updateAdminDriver(id: string, input: AdminDriverUpdateInput): Promise<AdminDriver> {
  const { data } = await api.put<AdminDriver>(`/admin/drivers/${id}`, input);
  return data;
}

export async function deactivateAdminDriver(id: string): Promise<AdminDriver> {
  const { data } = await api.delete<AdminDriver>(`/admin/drivers/${id}`);
  return data;
}

export async function getCompanies(): Promise<string[]> {
  const { data } = await api.get<string[]>('/admin/companies');
  return data;
}

export async function getRunsheets(filters: Filters): Promise<RunsheetListResponse> {
  const { data } = await api.get<RunsheetListResponse>('/admin/runsheets', {
    params: toParams(filters),
  });
  return data;
}

export function buildCsvUrl(filters: Omit<Filters, 'page' | 'limit' | 'sortBy' | 'sortOrder'>): string {
  const params = new URLSearchParams();
  Object.entries(toParams(filters)).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  return `${API_BASE_URL}/admin/reports/csv?${params.toString()}`;
}

export async function dispatchEmail(runsheetId: string, to: string): Promise<{ success: boolean; emailId?: string }> {
  const { data } = await api.post<{ success: boolean; emailId: string }>('/admin/reports/dispatch-email', {
    runsheetId,
    to,
  });
  return data;
}

export function buildPdfUrl(runsheetId: string): string {
  const token = localStorage.getItem('token');
  const base = `${API_BASE_URL}/admin/reports/pdf/${runsheetId}`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
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
