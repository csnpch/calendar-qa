import moment from 'moment';

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
  date: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseData {
  employees: Employee[];
  events: Event[];
  lastEmployeeId: number;
  lastEventId: number;
}

class DatabaseService {
  private storageKey = 'calendar-app-data';
  private data: DatabaseData;

  constructor() {
    this.data = this.loadData();
    this.initializeDatabase();
  }

  private loadData(): DatabaseData {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
    }
    
    return {
      employees: [],
      events: [],
      lastEmployeeId: 0,
      lastEventId: 0
    };
  }

  private saveData(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }

  private initializeDatabase() {
    // Insert some default employees if empty
    if (this.data.employees.length === 0) {
      this.insertDefaultEmployees();
    }
  }

  private insertDefaultEmployees() {
    const defaultEmployees = [
      { name: 'John Smith' },
      { name: 'Sarah Johnson' },
      { name: 'Michael Brown' },
      { name: 'Emily Davis' },
      { name: 'David Wilson' }
    ];

    for (const empData of defaultEmployees) {
      const now = moment().format();
      const employee: Employee = {
        id: ++this.data.lastEmployeeId,
        ...empData,
        createdAt: now,
        updatedAt: now
      };
      this.data.employees.push(employee);
    }
    
    this.saveData();
  }

  // Employee operations
  createEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Employee {
    const now = moment().format();
    const newEmployee: Employee = {
      id: ++this.data.lastEmployeeId,
      name: employee.name,
      createdAt: now,
      updatedAt: now
    };
    
    this.data.employees.push(newEmployee);
    this.saveData();
    return newEmployee;
  }

  getAllEmployees(): Employee[] {
    return [...this.data.employees].sort((a, b) => a.name.localeCompare(b.name));
  }

  getEmployeeById(id: number): Employee | null {
    return this.data.employees.find(emp => emp.id === id) || null;
  }


  updateEmployee(id: number, updates: Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>): Employee | null {
    const index = this.data.employees.findIndex(emp => emp.id === id);
    if (index === -1) return null;

    const updatedEmployee = {
      ...this.data.employees[index],
      ...updates,
      updatedAt: moment().format()
    };
    
    this.data.employees[index] = updatedEmployee;
    this.saveData();
    return updatedEmployee;
  }

  deleteEmployee(id: number): boolean {
    const index = this.data.employees.findIndex(emp => emp.id === id);
    if (index === -1) return false;

    this.data.employees.splice(index, 1);
    // Also delete related events
    this.data.events = this.data.events.filter(event => event.employeeId !== id);
    this.saveData();
    return true;
  }

  // Event operations
  createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Event {
    const now = moment().format();
    const newEvent: Event = {
      id: ++this.data.lastEventId,
      ...event,
      createdAt: now,
      updatedAt: now
    };
    
    this.data.events.push(newEvent);
    this.saveData();
    return newEvent;
  }

  getAllEvents(): Event[] {
    return [...this.data.events].sort((a, b) => moment(b.date).unix() - moment(a.date).unix());
  }

  getEventById(id: number): Event | null {
    return this.data.events.find(event => event.id === id) || null;
  }

  getEventsByDate(date: string): Event[] {
    return this.data.events.filter(event => event.date === date);
  }

  getEventsByDateRange(startDate: string, endDate: string): Event[] {
    return this.data.events.filter(event => event.date >= startDate && event.date <= endDate);
  }

  updateEvent(id: number, updates: Partial<Omit<Event, 'id' | 'createdAt' | 'updatedAt'>>): Event | null {
    const index = this.data.events.findIndex(event => event.id === id);
    if (index === -1) return null;

    const updatedEvent = {
      ...this.data.events[index],
      ...updates,
      updatedAt: moment().format()
    };
    
    this.data.events[index] = updatedEvent;
    this.saveData();
    return updatedEvent;
  }

  deleteEvent(id: number): boolean {
    const index = this.data.events.findIndex(event => event.id === id);
    if (index === -1) return false;

    this.data.events.splice(index, 1);
    this.saveData();
    return true;
  }

  // Search operations
  searchEmployees(query: string): Employee[] {
    const lowerQuery = query.toLowerCase();
    return this.data.employees.filter(emp => 
      emp.name.toLowerCase().includes(lowerQuery)
    );
  }

  searchEvents(query: string): Event[] {
    const lowerQuery = query.toLowerCase();
    return this.data.events.filter(event => 
      event.employeeName.toLowerCase().includes(lowerQuery) || 
      (event.description && event.description.toLowerCase().includes(lowerQuery))
    );
  }
}

// Create singleton instance
let dbInstance: DatabaseService | null = null;

export const getDatabase = (): DatabaseService => {
  if (!dbInstance) {
    dbInstance = new DatabaseService();
  }
  return dbInstance;
};

export default DatabaseService;