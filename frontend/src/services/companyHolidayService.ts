import { apiClient } from './api';

export interface CompanyHoliday {
  id: number;
  name: string;
  date: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyHolidayInput {
  name: string;
  date: string;
  description?: string;
}

export interface UpdateCompanyHolidayInput {
  name?: string;
  date?: string;
  description?: string;
}

export const fetchAllCompanyHolidays = async (): Promise<CompanyHoliday[]> => {
  return await apiClient.get<CompanyHoliday[]>('/company-holidays');
};

export const fetchCompanyHolidaysByYear = async (year: number): Promise<CompanyHoliday[]> => {
  return await apiClient.get<CompanyHoliday[]>(`/company-holidays/${year}`);
};

export const fetchCompanyHolidayById = async (id: number): Promise<CompanyHoliday> => {
  return await apiClient.get<CompanyHoliday>(`/company-holidays/holiday/${id}`);
};

export const createCompanyHoliday = async (holiday: CreateCompanyHolidayInput): Promise<CompanyHoliday> => {
  return await apiClient.post<CompanyHoliday>('/company-holidays', holiday);
};

export const createMultipleCompanyHolidays = async (holidays: CreateCompanyHolidayInput[]): Promise<CompanyHoliday[]> => {
  return await apiClient.post<CompanyHoliday[]>('/company-holidays/bulk', { holidays });
};

export const updateCompanyHoliday = async (id: number, holiday: UpdateCompanyHolidayInput): Promise<CompanyHoliday> => {
  return await apiClient.put<CompanyHoliday>(`/company-holidays/${id}`, holiday);
};

export const deleteCompanyHoliday = async (id: number): Promise<void> => {
  await apiClient.delete(`/company-holidays/${id}`);
};

export const fetchCompanyHolidaysForDateRange = async (startDate: string, endDate: string): Promise<CompanyHoliday[]> => {
  return await apiClient.get<CompanyHoliday[]>(`/company-holidays/range/${startDate}/${endDate}`);
};

export const checkIsCompanyHoliday = async (date: string): Promise<{ date: string; isHoliday: boolean }> => {
  return await apiClient.get<{ date: string; isHoliday: boolean }>(`/company-holidays/check/${date}`);
};

export const clearAllCompanyHolidays = async (): Promise<{ count: number }> => {
  return await apiClient.delete<{ count: number }>('/company-holidays/clear-all');
};