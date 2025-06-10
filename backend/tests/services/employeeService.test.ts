import { EmployeeService } from '../../src/services/employeeService';
import type { CreateEmployeeRequest, UpdateEmployeeRequest } from '../../src/types';

// Mock the database connection
jest.mock('../../src/database/connection', () => ({
  getDatabase: () => global.mockDatabase,
}));

describe('EmployeeService', () => {
  let employeeService: EmployeeService;

  beforeEach(() => {
    employeeService = new EmployeeService();
  });

  describe('createEmployee', () => {
    it('should create an employee successfully', () => {
      const employeeData = {
        name: 'John Smith'
      };

      const result = employeeService.createEmployee(employeeData);

      expect(result.name).toBe(employeeData.name);
      expect(result.id).toBeGreaterThan(0);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should create an employee with Thai name', () => {
      const employeeData = {
        name: 'สมชาย ใจดี'
      };

      const result = employeeService.createEmployee(employeeData);

      expect(result.name).toBe('สมชาย ใจดี');
    });
  });

  describe('getAllEmployees', () => {
    it('should return all employees ordered by name', () => {
      const employees = employeeService.getAllEmployees();

      expect(employees[0]!.name).toBe('Jane Doe');
      expect(employees[1]!.name).toBe('John Smith');
    });

    it('should ensure all employees have required fields', () => {
      const employees = employeeService.getAllEmployees();

      employees.forEach(employee => {
        expect(employee.id).toBeDefined();
        expect(employee.name).toBeDefined();
        expect(employee.createdAt).toBeDefined();
        expect(employee.updatedAt).toBeDefined();
      });
    });
  });

  describe('getEmployeeById', () => {
    it('should return employee by ID', () => {
      const employee = employeeService.getEmployeeById(1);

      expect(employee?.id).toBe(1);
      expect(employee?.name).toBe('John Smith');
    });

    it('should return null for non-existent employee', () => {
      const employee = employeeService.getEmployeeById(999);

      expect(employee).toBeNull();
    });
  });

  describe('updateEmployee', () => {
    it('should update employee successfully', () => {
      const updateData = { name: 'John Updated Smith' };
      
      const updated = employeeService.updateEmployee(1, updateData);

      expect(updated?.name).toBe('John Updated Smith');
      expect(updated?.id).toBe(1);
      expect(updated?.updatedAt).toBeDefined();
    });

    it('should return null for non-existent employee', () => {
      const updateData = { name: 'Non-existent' };

      const updated = employeeService.updateEmployee(999, updateData);

      expect(updated).toBeNull();
    });

    it('should handle update with same data', () => {
      const original = employeeService.getEmployeeById(1);
      const updated = employeeService.updateEmployee(1, { name: original?.name });

      expect(updated?.name).toBe(original?.name);
    });
  });

  describe('deleteEmployee', () => {
    it('should delete employee successfully', () => {
      const created = employeeService.createEmployee({ name: 'Test Employee' });
      const deleted = employeeService.deleteEmployee(created.id);
      const found = employeeService.getEmployeeById(created.id);

      expect(deleted).toBe(true);
      expect(found).toBeNull();
    });

    it('should return false for non-existent employee', () => {
      const result = employeeService.deleteEmployee(999);

      expect(result).toBe(false);
    });
  });

  describe('searchEmployees', () => {
    it('should search employees by name', () => {
      const results = employeeService.searchEmployees('John');

      expect(results.every(emp => emp.name.includes('John'))).toBe(true);
      expect(results[0]!.name).toBe('John Smith'); // Ordered by name
    });

    it('should return empty array for no matches', () => {
      const results = employeeService.searchEmployees('NonExistent');

      expect(results).toHaveLength(0);
    });

    it('should handle partial name search', () => {
      const results = employeeService.searchEmployees('John');

      expect(results[0]!.name).toBe('John Smith');
    });
  });

  describe('getEmployeeStats', () => {
    it('should return correct employee count', () => {
      const stats = employeeService.getEmployeeStats();

      expect(stats.total).toBe(2); // Test data from setup
    });

    it('should handle dynamic employee count changes', () => {
      const stats = employeeService.getEmployeeStats();

      expect(stats.total).toBe(2);

      // Create new employee
      employeeService.createEmployee({ name: 'Dynamic Test 1' });
      employeeService.createEmployee({ name: 'Dynamic Test 2' });

      const updatedStats = employeeService.getEmployeeStats();

      expect(updatedStats.total).toBe(4);

      // Clean up
      const employees = employeeService.getAllEmployees();
      employees.forEach(emp => {
        if (emp.name.includes('Dynamic Test')) {
          employeeService.deleteEmployee(emp.id);
        }
      });

      const finalStats = employeeService.getEmployeeStats();

      expect(finalStats.total).toBe(2); // Back to original count
    });
  });
});