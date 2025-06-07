import { getApiDatabase, Employee } from './apiDatabase';

export class EmployeeService {
  private db;

  constructor() {
    this.db = getApiDatabase();
  }

  // Create a new employee
  async createEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    return await this.db.createEmployee(employee);
  }

  // Get all employees
  async getAllEmployees(): Promise<Employee[]> {
    return await this.db.getAllEmployees();
  }

  // Get employee by ID
  async getEmployeeById(id: number): Promise<Employee | null> {
    return await this.db.getEmployeeById(id);
  }

  // Update employee
  async updateEmployee(id: number, updates: Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Employee | null> {
    return await this.db.updateEmployee(id, updates);
  }

  // Delete employee
  async deleteEmployee(id: number): Promise<boolean> {
    return await this.db.deleteEmployee(id);
  }

  // Search employees by name or email
  async searchEmployees(query: string): Promise<Employee[]> {
    return await this.db.searchEmployees(query);
  }

  // Get employee statistics
  async getEmployeeStats(): Promise<any> {
    return await this.db.getEmployeeStats();
  }
}

// Create singleton instance
let employeeServiceInstance: EmployeeService | null = null;

export const getEmployeeService = (): EmployeeService => {
  if (!employeeServiceInstance) {
    employeeServiceInstance = new EmployeeService();
  }
  return employeeServiceInstance;
};

export default EmployeeService;