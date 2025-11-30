import { getDatabase } from '../database/connection';
import type { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '../types';
import moment from 'moment';

export class EmployeeService {
  private db = getDatabase();

  createEmployee(data: CreateEmployeeRequest): Employee {
    const now = moment().utcOffset('+07:00').format();
    const stmt = this.db.prepare(`
      INSERT INTO employees (name, created_at, updated_at)
      VALUES (?, ?, ?)
    `);
    
    stmt.run(data.name, now, now);
    const result = this.db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
    
    return {
      id: result.id,
      name: data.name,
      createdAt: now,
      updatedAt: now
    };
  }

  getAllEmployees(): Employee[] {
    const stmt = this.db.prepare(`
      SELECT id, name, created_at as createdAt, updated_at as updatedAt
      FROM employees
      ORDER BY name ASC
    `);
    
    return stmt.all() as Employee[];
  }

  getEmployeeById(id: number): Employee | null {
    const stmt = this.db.prepare(`
      SELECT id, name, created_at as createdAt, updated_at as updatedAt
      FROM employees
      WHERE id = ?
    `);
    
    const result = stmt.get(id) as Employee | undefined;
    return result || null;
  }

  updateEmployee(id: number, data: UpdateEmployeeRequest): Employee | null {
    const existing = this.getEmployeeById(id);
    if (!existing) return null;

    const now = moment().utcOffset('+07:00').format();
    const stmt = this.db.prepare(`
      UPDATE employees
      SET name = ?, updated_at = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(data.name || existing.name, now, id);
    
    if (result.changes === 0) return null;
    
    return this.getEmployeeById(id);
  }

  deleteEmployee(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM employees WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  searchEmployees(query: string): Employee[] {
    const stmt = this.db.prepare(`
      SELECT id, name, created_at as createdAt, updated_at as updatedAt
      FROM employees
      WHERE name LIKE ?
      ORDER BY name ASC
    `);
    
    return stmt.all(`%${query}%`) as Employee[];
  }

  getEmployeeStats() {
    const stmt = this.db.prepare('SELECT COUNT(*) as total FROM employees');
    const result = stmt.get() as { total: number };
    
    return {
      total: result.total
    };
  }
}