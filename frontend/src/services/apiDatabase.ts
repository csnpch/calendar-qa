import { apiClient } from './api';

export interface Employee {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: number;
  employeeId: number;
  employeeName: string;
  leaveType: 'vacation' | 'personal' | 'sick' | 'other';
  date?: string; // Keep for backward compatibility
  startDate: string;
  endDate: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateEmployeeRequest {
  name: string;
}

interface UpdateEmployeeRequest {
  name?: string;
}

interface CreateEventRequest {
  employeeId: number;
  leaveType: 'vacation' | 'personal' | 'sick' | 'other';
  startDate: string;
  endDate: string;
  description?: string;
}

interface UpdateEventRequest {
  employeeId?: number;
  leaveType?: 'vacation' | 'personal' | 'sick' | 'other';
  startDate?: string;
  endDate?: string;
  description?: string;
}

class ApiDatabaseService {
  // Employee operations
  async createEmployee(employee: CreateEmployeeRequest): Promise<Employee> {
    return await apiClient.post<Employee>('/employees', employee);
  }

  async getAllEmployees(): Promise<Employee[]> {
    return await apiClient.get<Employee[]>('/employees');
  }

  async getEmployeeById(id: number): Promise<Employee | null> {
    try {
      return await apiClient.get<Employee>(`/employees/${id}`);
    } catch (error) {
      return null;
    }
  }

  async updateEmployee(id: number, updates: UpdateEmployeeRequest): Promise<Employee | null> {
    try {
      return await apiClient.put<Employee>(`/employees/${id}`, updates);
    } catch (error) {
      return null;
    }
  }

  async deleteEmployee(id: number): Promise<boolean> {
    try {
      await apiClient.delete<{ success: boolean }>(`/employees/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async searchEmployees(query: string): Promise<Employee[]> {
    return await apiClient.get<Employee[]>(`/employees/search/${encodeURIComponent(query)}`);
  }

  // Event operations
  async createEvent(event: CreateEventRequest): Promise<Event> {
    return await apiClient.post<Event>('/events', event);
  }

  async getAllEvents(): Promise<Event[]> {
    return await apiClient.get<Event[]>('/events');
  }

  async getEventById(id: number): Promise<Event | null> {
    try {
      return await apiClient.get<Event>(`/events/${id}`);
    } catch (error) {
      return null;
    }
  }

  async getEventsByDate(date: string): Promise<Event[]> {
    return await apiClient.get<Event[]>(`/events/date/${date}`);
  }

  async getEventsByDateRange(startDate: string, endDate: string): Promise<Event[]> {
    return await apiClient.get<Event[]>(`/events/date-range/${startDate}/${endDate}`);
  }

  async getEventsByEmployeeId(employeeId: number): Promise<Event[]> {
    return await apiClient.get<Event[]>(`/events/employee/${employeeId}`);
  }

  async getEventsByMonth(year: number, month: number): Promise<Event[]> {
    return await apiClient.get<Event[]>(`/events/month/${year}/${month}`);
  }

  async updateEvent(id: number, updates: UpdateEventRequest): Promise<Event | null> {
    try {
      return await apiClient.put<Event>(`/events/${id}`, updates);
    } catch (error) {
      return null;
    }
  }

  async deleteEvent(id: number): Promise<boolean> {
    try {
      await apiClient.delete<{ success: boolean }>(`/events/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async searchEvents(query: string): Promise<Event[]> {
    return await apiClient.get<Event[]>(`/events/search/${encodeURIComponent(query)}`);
  }

  async getUpcomingEvents(days: number = 30): Promise<Event[]> {
    return await apiClient.get<Event[]>(`/events/upcoming/${days}`);
  }

  async getEventStats(): Promise<any> {
    return await apiClient.get('/events/stats/overview');
  }

  async getEmployeeStats(): Promise<any> {
    return await apiClient.get('/employees/stats/overview');
  }

  async deleteEventsByMonth(year: number, month: number, password: string): Promise<{ deletedCount: number }> {
    return await apiClient.delete(`/events/bulk/month/${year}/${month}`, { password });
  }

  async deleteEventsByYear(year: number, password: string): Promise<{ deletedCount: number }> {
    return await apiClient.delete(`/events/bulk/year/${year}`, { password });
  }

  async deleteAllEvents(password: string): Promise<{ deletedCount: number }> {
    return await apiClient.delete('/events/bulk/all', { password });
  }
}

// Create singleton instance
let apiDbInstance: ApiDatabaseService | null = null;

export const getApiDatabase = (): ApiDatabaseService => {
  if (!apiDbInstance) {
    apiDbInstance = new ApiDatabaseService();
  }
  return apiDbInstance;
};

export default ApiDatabaseService;