import { getDatabase } from '../database/connection';
import type { Event, CreateEventRequest, UpdateEventRequest } from '../types';

export class EventService {
  private db = getDatabase();

  createEvent(data: CreateEventRequest): Event {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO events (employee_id, employee_name, leave_type, date, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      data.employeeId,
      data.employeeName,
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
      employeeName: data.employeeName,
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
        id,
        employee_id as employeeId,
        employee_name as employeeName,
        leave_type as leaveType,
        date,
        description,
        created_at as createdAt,
        updated_at as updatedAt
      FROM events
      ORDER BY date DESC
    `);
    
    return stmt.all() as Event[];
  }

  getEventById(id: number): Event | null {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        employee_id as employeeId,
        employee_name as employeeName,
        leave_type as leaveType,
        date,
        description,
        created_at as createdAt,
        updated_at as updatedAt
      FROM events
      WHERE id = ?
    `);
    
    const result = stmt.get(id) as Event | undefined;
    return result || null;
  }

  getEventsByDate(date: string): Event[] {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        employee_id as employeeId,
        employee_name as employeeName,
        leave_type as leaveType,
        date,
        description,
        created_at as createdAt,
        updated_at as updatedAt
      FROM events
      WHERE date = ?
      ORDER BY employee_name ASC
    `);
    
    return stmt.all(date) as Event[];
  }

  getEventsByDateRange(startDate: string, endDate: string): Event[] {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        employee_id as employeeId,
        employee_name as employeeName,
        leave_type as leaveType,
        date,
        description,
        created_at as createdAt,
        updated_at as updatedAt
      FROM events
      WHERE date >= ? AND date <= ?
      ORDER BY date ASC, employee_name ASC
    `);
    
    return stmt.all(startDate, endDate) as Event[];
  }

  getEventsByEmployeeId(employeeId: number): Event[] {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        employee_id as employeeId,
        employee_name as employeeName,
        leave_type as leaveType,
        date,
        description,
        created_at as createdAt,
        updated_at as updatedAt
      FROM events
      WHERE employee_id = ?
      ORDER BY date DESC
    `);
    
    return stmt.all(employeeId) as Event[];
  }

  getEventsByLeaveType(leaveType: string): Event[] {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        employee_id as employeeId,
        employee_name as employeeName,
        leave_type as leaveType,
        date,
        description,
        created_at as createdAt,
        updated_at as updatedAt
      FROM events
      WHERE leave_type = ?
      ORDER BY date DESC
    `);
    
    return stmt.all(leaveType) as Event[];
  }

  getEventsByMonth(year: number, month: number): Event[] {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDateObj = new Date(year, month, 0);
    const endDate = endDateObj.toISOString().split('T')[0]!;
    
    return this.getEventsByDateRange(startDate, endDate);
  }

  updateEvent(id: number, data: UpdateEventRequest): Event | null {
    const existing = this.getEventById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE events
      SET 
        employee_id = ?,
        employee_name = ?,
        leave_type = ?,
        date = ?,
        description = ?,
        updated_at = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(
      data.employeeId ?? existing.employeeId,
      data.employeeName ?? existing.employeeName,
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
        id,
        employee_id as employeeId,
        employee_name as employeeName,
        leave_type as leaveType,
        date,
        description,
        created_at as createdAt,
        updated_at as updatedAt
      FROM events
      WHERE employee_name LIKE ? OR description LIKE ?
      ORDER BY date DESC
    `);
    
    const searchTerm = `%${query}%`;
    return stmt.all(searchTerm, searchTerm) as Event[];
  }

  getUpcomingEvents(days: number = 30): Event[] {
    const todayObj = new Date();
    const today = todayObj.toISOString().split('T')[0]!;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const endDate = futureDate.toISOString().split('T')[0]!;
    
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
    const params: any[] = [];
    
    if (startDate && endDate) {
      whereClause = 'WHERE date >= ? AND date <= ?';
      params.push(startDate, endDate);
    }
    
    if (eventType && eventType !== 'all') {
      whereClause += whereClause ? ' AND leave_type = ?' : 'WHERE leave_type = ?';
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
        employee_id as employeeId,
        employee_name as employeeName,
        leave_type as leaveType,
        COUNT(*) as count
      FROM events
      ${whereClause}
      GROUP BY employee_id, employee_name, leave_type
      ORDER BY employee_name ASC
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
      
      // Map backend leave types to frontend display names
      const typeMapping: { [key: string]: string } = {
        'sick': 'ลาป่วย',
        'personal': 'ลากิจ',
        'vacation': 'ลาพักร้อน',
        'absent': 'ขาดงาน',
        'maternity': 'ลาคลอด',
        'paternity': 'ลาคลอด',
        'bereavement': 'ลากิจส่วนตัว',
        'study': 'ลาเรียน',
        'military': 'ลาทหาร',
        'sabbatical': 'ลาศึกษา',
        'unpaid': 'ลาไม่รับเงิน',
        'compensatory': 'ลาชดเชย',
        'other': 'อื่นๆ'
      };
      
      const displayType = typeMapping[row.leaveType] || row.leaveType;
      employee.eventTypes[displayType] = row.count;
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