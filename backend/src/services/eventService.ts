import { getDatabase } from '../database/connection';
import type { Event, CreateEventRequest, UpdateEventRequest } from '../types';
import moment from 'moment';

export class EventService {
  private db = getDatabase();

  createEvent(data: CreateEventRequest): Event {
    const now = moment().utcOffset('+07:00').format();
    
    // Verify employee exists
    const employeeStmt = this.db.prepare('SELECT name FROM employees WHERE id = ?');
    const employee = employeeStmt.get(data.employeeId) as { name: string } | undefined;
    
    if (!employee) {
      throw new Error(`Employee with id ${data.employeeId} not found`);
    }
    
    const stmt = this.db.prepare(`
      INSERT INTO events (employee_id, leave_type, date, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      data.employeeId,
      data.leaveType,
      data.date,
      data.description || null,
      now,
      now
    );
    
    const result = this.db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
    
    return {
      id: result.id,
      employeeId: data.employeeId,
      employeeName: employee.name, // Get from current lookup
      leaveType: data.leaveType,
      date: data.date,
      description: data.description,
      createdAt: now,
      updatedAt: now
    };
  }

  getAllEvents(): Event[] {
    const stmt = this.db.prepare(`
      SELECT 
        e.id,
        e.employee_id as employeeId,
        emp.name as employeeName,
        e.leave_type as leaveType,
        e.date,
        e.description,
        e.created_at as createdAt,
        e.updated_at as updatedAt
      FROM events e
      LEFT JOIN employees emp ON e.employee_id = emp.id
      ORDER BY e.date DESC
    `);
    
    return stmt.all() as Event[];
  }

  getEventById(id: number): Event | null {
    const stmt = this.db.prepare(`
      SELECT 
        e.id,
        e.employee_id as employeeId,
        emp.name as employeeName,
        e.leave_type as leaveType,
        e.date,
        e.description,
        e.created_at as createdAt,
        e.updated_at as updatedAt
      FROM events e
      LEFT JOIN employees emp ON e.employee_id = emp.id
      WHERE e.id = ?
    `);
    
    const result = stmt.get(id) as Event | undefined;
    return result || null;
  }

  getEventsByDate(date: string): Event[] {
    const stmt = this.db.prepare(`
      SELECT 
        e.id,
        e.employee_id as employeeId,
        emp.name as employeeName,
        e.leave_type as leaveType,
        e.date,
        e.description,
        e.created_at as createdAt,
        e.updated_at as updatedAt
      FROM events e
      LEFT JOIN employees emp ON e.employee_id = emp.id
      WHERE e.date = ?
      ORDER BY emp.name ASC
    `);
    
    return stmt.all(date) as Event[];
  }

  getEventsByDateRange(startDate: string, endDate: string): Event[] {
    const stmt = this.db.prepare(`
      SELECT 
        e.id,
        e.employee_id as employeeId,
        emp.name as employeeName,
        e.leave_type as leaveType,
        e.date,
        e.description,
        e.created_at as createdAt,
        e.updated_at as updatedAt
      FROM events e
      LEFT JOIN employees emp ON e.employee_id = emp.id
      WHERE e.date >= ? AND e.date <= ?
      ORDER BY e.date ASC, emp.name ASC
    `);
    
    return stmt.all(startDate, endDate) as Event[];
  }

  getEventsByEmployeeId(employeeId: number): Event[] {
    const stmt = this.db.prepare(`
      SELECT 
        e.id,
        e.employee_id as employeeId,
        emp.name as employeeName,
        e.leave_type as leaveType,
        e.date,
        e.description,
        e.created_at as createdAt,
        e.updated_at as updatedAt
      FROM events e
      LEFT JOIN employees emp ON e.employee_id = emp.id
      WHERE e.employee_id = ?
      ORDER BY e.date DESC
    `);
    
    return stmt.all(employeeId) as Event[];
  }

  getEventsByEmployeeName(employeeName: string, startDate?: string, endDate?: string): Event[] {
    let query = `
      SELECT 
        e.id,
        e.employee_id as employeeId,
        emp.name as employeeName,
        e.leave_type as leaveType,
        e.date,
        e.description,
        e.created_at as createdAt,
        e.updated_at as updatedAt
      FROM events e
      LEFT JOIN employees emp ON e.employee_id = emp.id
      WHERE emp.name = ?
    `;
    
    const params: any[] = [employeeName];
    
    if (startDate && endDate) {
      query += ' AND e.date >= ? AND e.date <= ?';
      params.push(startDate, endDate);
    }
    
    query += ' ORDER BY e.date DESC';
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params) as Event[];
  }

  getEventsByLeaveType(leaveType: string): Event[] {
    const stmt = this.db.prepare(`
      SELECT 
        e.id,
        e.employee_id as employeeId,
        emp.name as employeeName,
        e.leave_type as leaveType,
        e.date,
        e.description,
        e.created_at as createdAt,
        e.updated_at as updatedAt
      FROM events e
      LEFT JOIN employees emp ON e.employee_id = emp.id
      WHERE e.leave_type = ?
      ORDER BY e.date DESC
    `);
    
    return stmt.all(leaveType) as Event[];
  }

  getEventsByMonth(year: number, month: number): Event[] {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = moment().year(year).month(month - 1).endOf('month').format('YYYY-MM-DD');
    
    return this.getEventsByDateRange(startDate, endDate);
  }

  updateEvent(id: number, data: UpdateEventRequest): Event | null {
    const existing = this.getEventById(id);
    if (!existing) return null;

    const now = moment().utcOffset('+07:00').format();
    const newEmployeeId = data.employeeId ?? existing.employeeId;
    
    // Verify employee exists
    const employeeStmt = this.db.prepare('SELECT name FROM employees WHERE id = ?');
    const employee = employeeStmt.get(newEmployeeId) as { name: string } | undefined;
    
    if (!employee) {
      throw new Error(`Employee with id ${newEmployeeId} not found`);
    }
    
    const stmt = this.db.prepare(`
      UPDATE events
      SET 
        employee_id = ?,
        leave_type = ?,
        date = ?,
        description = ?,
        updated_at = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(
      newEmployeeId,
      data.leaveType ?? existing.leaveType,
      data.date ?? existing.date,
      data.description ?? existing.description ?? null,
      now,
      id
    );
    
    if (result.changes === 0) return null;
    
    return this.getEventById(id);
  }

  deleteEvent(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM events WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  deleteEventsByEmployeeId(employeeId: number): number {
    const stmt = this.db.prepare('DELETE FROM events WHERE employee_id = ?');
    const result = stmt.run(employeeId);
    return result.changes;
  }

  searchEvents(query: string): Event[] {
    const stmt = this.db.prepare(`
      SELECT 
        e.id,
        e.employee_id as employeeId,
        emp.name as employeeName,
        e.leave_type as leaveType,
        e.date,
        e.description,
        e.created_at as createdAt,
        e.updated_at as updatedAt
      FROM events e
      LEFT JOIN employees emp ON e.employee_id = emp.id
      WHERE emp.name LIKE ? OR e.description LIKE ?
      ORDER BY e.date DESC
    `);
    
    const searchTerm = `%${query}%`;
    return stmt.all(searchTerm, searchTerm) as Event[];
  }

  getUpcomingEvents(days: number = 30): Event[] {
    const today = moment().utcOffset('+07:00').format('YYYY-MM-DD');
    const endDate = moment().utcOffset('+07:00').add(days, 'days').format('YYYY-MM-DD');
    
    return this.getEventsByDateRange(today, endDate);
  }

  getEventStats() {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as total FROM events');
    const total = (totalStmt.get() as { total: number }).total;
    
    const typeStmt = this.db.prepare(`
      SELECT leave_type, COUNT(*) as count
      FROM events
      GROUP BY leave_type
      ORDER BY count DESC
    `);
    const byLeaveType = typeStmt.all() as Array<{ leave_type: string; count: number }>;
    
    const monthStmt = this.db.prepare(`
      SELECT 
        substr(date, 1, 7) as month,
        COUNT(*) as count
      FROM events
      GROUP BY substr(date, 1, 7)
      ORDER BY month DESC
      LIMIT 12
    `);
    const byMonth = monthStmt.all() as Array<{ month: string; count: number }>;
    
    return {
      total,
      byLeaveType,
      byMonth
    };
  }

  getDashboardSummary(startDate?: string, endDate?: string, eventType?: string) {
    let whereClause = '';
    let joinWhereClause = '';
    const params: any[] = [];
    
    if (startDate && endDate) {
      whereClause = 'WHERE date >= ? AND date <= ?';
      joinWhereClause = 'WHERE e.date >= ? AND e.date <= ?';
      params.push(startDate, endDate);
    }
    
    if (eventType && eventType !== 'all') {
      whereClause += whereClause ? ' AND leave_type = ?' : 'WHERE leave_type = ?';
      joinWhereClause += joinWhereClause ? ' AND e.leave_type = ?' : 'WHERE e.leave_type = ?';
      params.push(eventType);
    }

    // Total events
    const totalStmt = this.db.prepare(`SELECT COUNT(*) as totalEvents FROM events ${whereClause}`);
    const { totalEvents } = totalStmt.get(...params) as { totalEvents: number };

    // Total employees with events
    const employeeStmt = this.db.prepare(`SELECT COUNT(DISTINCT employee_id) as totalEmployees FROM events ${whereClause}`);
    const { totalEmployees } = employeeStmt.get(...params) as { totalEmployees: number };

    // Most common leave type
    const typeStmt = this.db.prepare(`
      SELECT leave_type, COUNT(*) as count
      FROM events
      ${whereClause}
      GROUP BY leave_type
      ORDER BY count DESC
      LIMIT 1
    `);
    const mostCommonResult = typeStmt.get(...params) as { leave_type: string; count: number } | undefined;
    const mostCommonType = mostCommonResult?.leave_type || 'N/A';

    // Employee ranking with event breakdown
    const rankingStmt = this.db.prepare(`
      SELECT 
        e.employee_id as employeeId,
        emp.name as employeeName,
        e.leave_type as leaveType,
        COUNT(*) as count
      FROM events e
      LEFT JOIN employees emp ON e.employee_id = emp.id
      ${joinWhereClause}
      GROUP BY e.employee_id, emp.name, e.leave_type
      ORDER BY emp.name ASC
    `);
    
    const rankingData = rankingStmt.all(...params) as Array<{
      employeeId: number;
      employeeName: string;
      leaveType: string;
      count: number;
    }>;

    // Transform ranking data to match frontend format
    const employeeMap = new Map();
    rankingData.forEach(row => {
      if (!employeeMap.has(row.employeeId)) {
        employeeMap.set(row.employeeId, {
          name: row.employeeName,
          totalEvents: 0,
          eventTypes: {}
        });
      }
      
      const employee = employeeMap.get(row.employeeId);
      employee.totalEvents += row.count;
      
      // Keep the original leave type as key for consistency with frontend
      employee.eventTypes[row.leaveType] = row.count;
    });

    const employeeRanking = Array.from(employeeMap.values())
      .sort((a, b) => b.totalEvents - a.totalEvents);

    return {
      monthlyStats: {
        totalEvents,
        totalEmployees,
        mostCommonType: mostCommonType === 'sick' ? 'ลาป่วย' : 
                      mostCommonType === 'personal' ? 'ลากิจ' : 
                      mostCommonType === 'vacation' ? 'ลาพักร้อน' : mostCommonType
      },
      employeeRanking
    };
  }
}