export type Employee = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Event = {
  id: number;
  employeeId: number;
  employeeName: string;
  leaveType: 'vacation' | 'personal' | 'sick' | 'absent' | 'maternity' | 'bereavement' | 'study' | 'military' | 'sabbatical' | 'unpaid' | 'compensatory' | 'other';
  date?: string; // Keep for backward compatibility
  startDate: string;
  endDate: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type Holiday = {
  date: string;
  name: string;
  type: 'public' | 'religious' | 'substitution';
};

export type CreateEmployeeRequest = {
  name: string;
};

export type UpdateEmployeeRequest = {
  name?: string;
};

export type CreateEventRequest = {
  employeeId: number;
  leaveType: 'vacation' | 'personal' | 'sick' | 'absent' | 'maternity' | 'bereavement' | 'study' | 'military' | 'sabbatical' | 'unpaid' | 'compensatory' | 'other';
  startDate: string;
  endDate: string;
  description?: string;
};

export type UpdateEventRequest = {
  employeeId?: number;
  leaveType?: 'vacation' | 'personal' | 'sick' | 'absent' | 'maternity' | 'bereavement' | 'study' | 'military' | 'sabbatical' | 'unpaid' | 'compensatory' | 'other';
  startDate?: string;
  endDate?: string;
  description?: string;
};

export type CronjobConfig = {
  id: number;
  name: string;
  enabled: boolean;
  schedule_time: string;
  webhook_url: string;
  notification_days: number;
  notification_type: 'daily' | 'weekly';
  weekly_days?: number[];
  weekly_scope?: 'current' | 'next';
  created_at: string;
  updated_at: string;
};