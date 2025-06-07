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
    // Clear employees except test data and reset them
    global.mockDatabase.exec('DELETE FROM employees WHERE id > 2');
    global.mockDatabase.exec(`
      UPDATE employees SET name = 'John Smith' WHERE id = 1;
      UPDATE employees SET name = 'Jane Doe' WHERE id = 2;
    `);
  });

  describe('createEmployee', () => {
    it('should create a new employee successfully', () => {
      const employeeData: CreateEmployeeRequest = {
        name: 'New Employee'
      };

      const result = employeeService.createEmployee(employeeData);

      expect(result).toBeDefined();
      expect(result.name).toBe(employeeData.name);
      expect(result.id).toBeGreaterThan(0);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should create employee with valid name', () => {
      const employeeData: CreateEmployeeRequest = {
        name: 'สมชาย ใจดี'
      };

      const result = employeeService.createEmployee(employeeData);

      expect(result).toBeDefined();
      expect(result.name).toBe('สมชาย ใจดี');
    });
  });

  describe('getAllEmployees', () => {
    it('should return all employees ordered by name', () => {
      const employees = employeeService.getAllEmployees();
      
      expect(employees).toHaveLength(2); // Test data from setup
      expect(employees[0]!.name).toBe('Jane Doe');
      expect(employees[1]!.name).toBe('John Smith');
    });

    it('should return employees with correct structure', () => {
      const employees = employeeService.getAllEmployees();
      
      employees.forEach(employee => {
        expect(employee).toHaveProperty('id');
        expect(employee).toHaveProperty('name');
        expect(employee).toHaveProperty('createdAt');
        expect(employee).toHaveProperty('updatedAt');
        expect(typeof employee.id).toBe('number');
        expect(typeof employee.name).toBe('string');
      });
    });
  });

  describe('getEmployeeById', () => {
    it('should return employee by ID', () => {
      const employee = employeeService.getEmployeeById(1);
      
      expect(employee).toBeDefined();
      expect(employee?.id).toBe(1);
      expect(employee?.name).toBe('John Smith');
    });

    it('should return null for non-existent ID', () => {
      const employee = employeeService.getEmployeeById(999);
      expect(employee).toBeNull();
    });
  });

  describe('updateEmployee', () => {
    it('should update existing employee', () => {
      const updateData: UpdateEmployeeRequest = {
        name: 'John Updated Smith'
      };

      const updated = employeeService.updateEmployee(1, updateData);
      
      expect(updated).toBeDefined();
      expect(updated?.name).toBe('John Updated Smith');
      expect(updated?.id).toBe(1);
      expect(updated?.updatedAt).toBeDefined();
    });

    it('should return null for non-existent employee', () => {
      const updateData: UpdateEmployeeRequest = {
        name: 'Non Existent'
      };

      const updated = employeeService.updateEmployee(999, updateData);
      expect(updated).toBeNull();
    });

    it('should keep existing name if not provided', () => {
      const original = employeeService.getEmployeeById(1);
      const updateData: UpdateEmployeeRequest = {};

      const updated = employeeService.updateEmployee(1, updateData);
      
      expect(updated).toBeDefined();
      expect(updated?.name).toBe(original?.name);
    });
  });

  describe('deleteEmployee', () => {
    it('should delete existing employee', () => {
      const created = employeeService.createEmployee({ name: 'To Delete' });
      
      const deleted = employeeService.deleteEmployee(created.id);
      expect(deleted).toBe(true);

      const found = employeeService.getEmployeeById(created.id);
      expect(found).toBeNull();
    });

    it('should return false for non-existent employee', () => {
      const deleted = employeeService.deleteEmployee(999);
      expect(deleted).toBe(false);
    });
  });

  describe('searchEmployees', () => {
    it('should search employees by name', () => {
      employeeService.createEmployee({ name: 'Alice Johnson' });
      employeeService.createEmployee({ name: 'Bob Smith' });
      employeeService.createEmployee({ name: 'Charlie Johnson' });

      const results = employeeService.searchEmployees('Johnson');
      
      expect(results).toHaveLength(2);
      expect(results.every(emp => emp.name.includes('Johnson'))).toBe(true);
      expect(results[0]!.name).toBe('Alice Johnson'); // Ordered by name
      expect(results[1]!.name).toBe('Charlie Johnson');
    });

    it('should return empty array for no matches', () => {
      const results = employeeService.searchEmployees('NonExistent');
      expect(results).toEqual([]);
    });

    it('should be case insensitive', () => {
      const results = employeeService.searchEmployees('john');
      expect(results).toHaveLength(1);
      expect(results[0]!.name).toBe('John Smith');
    });
  });

  describe('getEmployeeStats', () => {
    it('should return correct employee count', () => {
      const stats = employeeService.getEmployeeStats();
      
      expect(stats).toHaveProperty('total');
      expect(stats.total).toBe(2); // Test data from setup
    });

    it('should update count after adding employees', () => {
      employeeService.createEmployee({ name: 'New Employee 1' });
      employeeService.createEmployee({ name: 'New Employee 2' });

      const stats = employeeService.getEmployeeStats();
      expect(stats.total).toBe(4);
    });

    it('should update count after deleting employees', () => {
      const created = employeeService.createEmployee({ name: 'To Delete' });
      employeeService.deleteEmployee(created.id);

      const stats = employeeService.getEmployeeStats();
      expect(stats.total).toBe(2); // Back to original count
    });
  });
});