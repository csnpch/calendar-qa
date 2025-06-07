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
  leaveType: 'vacation' | 'personal' | 'sick' | 'absent' | 'maternity' | 'paternity' | 'bereavement' | 'study' | 'military' | 'sabbatical' | 'unpaid' | 'compensatory' | 'other';
  date: string;
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
  employeeName: string;
  leaveType: 'vacation' | 'personal' | 'sick' | 'absent' | 'maternity' | 'paternity' | 'bereavement' | 'study' | 'military' | 'sabbatical' | 'unpaid' | 'compensatory' | 'other';
  date: string;
  description?: string;
};

export type UpdateEventRequest = {
  employeeId?: number;
  employeeName?: string;
  leaveType?: 'vacation' | 'personal' | 'sick' | 'absent' | 'maternity' | 'paternity' | 'bereavement' | 'study' | 'military' | 'sabbatical' | 'unpaid' | 'compensatory' | 'other';
  date?: string;
  description?: string;
};