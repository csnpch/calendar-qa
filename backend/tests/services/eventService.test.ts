import { EventService } from '../../src/services/eventService';
import type { CreateEventRequest, UpdateEventRequest } from '../../src/types';

// Mock the database connection
jest.mock('../../src/database/connection', () => ({
  getDatabase: () => global.mockDatabase,
}));

describe('EventService', () => {
  let eventService: EventService;

  beforeEach(() => {
    eventService = new EventService();
  });

  describe('createEvent', () => {
    it('should create a new event successfully', () => {
      const eventData: CreateEventRequest = {
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation',
        date: '2025-06-15',
        description: 'Summer vacation'
      };

      const result = eventService.createEvent(eventData);

      expect(result).toBeDefined();
      expect(result.employeeId).toBe(eventData.employeeId);
      expect(result.employeeName).toBe(eventData.employeeName);
      expect(result.leaveType).toBe(eventData.leaveType);
      expect(result.date).toBe(eventData.date);
      expect(result.description).toBe(eventData.description);
      expect(result.id).toBeGreaterThan(0);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should create event without description', () => {
      const eventData: CreateEventRequest = {
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'sick',
        date: '2025-06-16'
      };

      const result = eventService.createEvent(eventData);

      expect(result).toBeDefined();
      expect(result.description).toBeUndefined();
    });

    it('should throw error for invalid employee ID (foreign key constraint)', () => {
      const eventData: CreateEventRequest = {
        employeeId: 999,
        employeeName: 'Non Existent',
        leaveType: 'vacation',
        date: '2025-06-15'
      };

      expect(() => {
        eventService.createEvent(eventData);
      }).toThrow();
    });
  });

  describe('getAllEvents', () => {
    it('should return empty array when no events exist', () => {
      const events = eventService.getAllEvents();
      expect(events).toEqual([]);
    });

    it('should return all events ordered by date desc', () => {
      // Create test events
      eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation',
        date: '2025-06-15'
      });
      eventService.createEvent({
        employeeId: 2,
        employeeName: 'Jane Doe',
        leaveType: 'sick',
        date: '2025-06-20'
      });

      const events = eventService.getAllEvents();
      expect(events).toHaveLength(2);
      expect(events[0]!.date).toBe('2025-06-20'); // Latest first
      expect(events[1]!.date).toBe('2025-06-15');
    });
  });

  describe('getEventById', () => {
    it('should return event by ID', () => {
      const created = eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation',
        date: '2025-06-15'
      });

      const found = eventService.getEventById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.employeeName).toBe('John Smith');
    });

    it('should return null for non-existent ID', () => {
      const found = eventService.getEventById(999);
      expect(found).toBeNull();
    });
  });

  describe('getEventsByDate', () => {
    it('should return events for specific date', () => {
      eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation',
        date: '2025-06-15'
      });
      eventService.createEvent({
        employeeId: 2,
        employeeName: 'Jane Doe',
        leaveType: 'sick',
        date: '2025-06-15'
      });
      eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'personal',
        date: '2025-06-16'
      });

      const events = eventService.getEventsByDate('2025-06-15');
      expect(events).toHaveLength(2);
      expect(events.every(e => e.date === '2025-06-15')).toBe(true);
      
      // Should be ordered by employee name
      expect(events[0]!.employeeName).toBe('Jane Doe');
      expect(events[1]!.employeeName).toBe('John Smith');
    });

    it('should return empty array for date with no events', () => {
      const events = eventService.getEventsByDate('2025-12-31');
      expect(events).toEqual([]);
    });
  });

  describe('getEventsByDateRange', () => {
    it('should return events within date range', () => {
      eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation',
        date: '2025-06-10'
      });
      eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation',
        date: '2025-06-15'
      });
      eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation',
        date: '2025-06-25'
      });

      const events = eventService.getEventsByDateRange('2025-06-12', '2025-06-20');
      expect(events).toHaveLength(1);
      expect(events[0]!.date).toBe('2025-06-15');
    });
  });

  describe('getEventsByEmployeeId', () => {
    it('should return events for specific employee', () => {
      eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation',
        date: '2025-06-15'
      });
      eventService.createEvent({
        employeeId: 2,
        employeeName: 'Jane Doe',
        leaveType: 'sick',
        date: '2025-06-16'
      });
      eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'personal',
        date: '2025-06-20'
      });

      const events = eventService.getEventsByEmployeeId(1);
      expect(events).toHaveLength(2);
      expect(events.every(e => e.employeeId === 1)).toBe(true);
      
      // Should be ordered by date desc
      expect(events[0]!.date).toBe('2025-06-20');
      expect(events[1]!.date).toBe('2025-06-15');
    });
  });

  describe('getEventsByLeaveType', () => {
    it('should return events for specific leave type', () => {
      eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation',
        date: '2025-06-15'
      });
      eventService.createEvent({
        employeeId: 2,
        employeeName: 'Jane Doe',
        leaveType: 'sick',
        date: '2025-06-16'
      });
      eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation',
        date: '2025-06-20'
      });

      const events = eventService.getEventsByLeaveType('vacation');
      expect(events).toHaveLength(2);
      expect(events.every(e => e.leaveType === 'vacation')).toBe(true);
    });
  });

  describe('updateEvent', () => {
    it('should update existing event', async () => {
      const created = eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation',
        date: '2025-06-15',
        description: 'Old description'
      });

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const updateData: UpdateEventRequest = {
        leaveType: 'sick',
        description: 'New description'
      };

      const updated = eventService.updateEvent(created.id, updateData);
      
      expect(updated).toBeDefined();
      expect(updated?.leaveType).toBe('sick');
      expect(updated?.description).toBe('New description');
      expect(updated?.employeeName).toBe('John Smith'); // Unchanged
      expect(updated?.date).toBe('2025-06-15'); // Unchanged
      expect(updated?.updatedAt).not.toBe(created.updatedAt);
    });

    it('should return null for non-existent event', () => {
      const updated = eventService.updateEvent(999, { leaveType: 'sick' });
      expect(updated).toBeNull();
    });
  });

  describe('deleteEvent', () => {
    it('should delete existing event', () => {
      const created = eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation',
        date: '2025-06-15'
      });

      const deleted = eventService.deleteEvent(created.id);
      expect(deleted).toBe(true);

      const found = eventService.getEventById(created.id);
      expect(found).toBeNull();
    });

    it('should return false for non-existent event', () => {
      const deleted = eventService.deleteEvent(999);
      expect(deleted).toBe(false);
    });
  });

  describe('searchEvents', () => {
    it('should search events by employee name', () => {
      eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation',
        date: '2025-06-15'
      });
      eventService.createEvent({
        employeeId: 2,
        employeeName: 'Jane Doe',
        leaveType: 'sick',
        date: '2025-06-16'
      });

      const events = eventService.searchEvents('John');
      expect(events).toHaveLength(1);
      expect(events[0]!.employeeName).toBe('John Smith');
    });

    it('should search events by description', () => {
      eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation',
        date: '2025-06-15',
        description: 'Summer vacation'
      });
      eventService.createEvent({
        employeeId: 2,
        employeeName: 'Jane Doe',
        leaveType: 'sick',
        date: '2025-06-16',
        description: 'Flu symptoms'
      });

      const events = eventService.searchEvents('Summer');
      expect(events).toHaveLength(1);
      expect(events[0]!.description).toBe('Summer vacation');
    });
  });

  describe('getEventStats', () => {
    it('should return correct statistics', () => {
      eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation',
        date: '2025-06-15'
      });
      eventService.createEvent({
        employeeId: 2,
        employeeName: 'Jane Doe',
        leaveType: 'vacation',
        date: '2025-06-16'
      });
      eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'sick',
        date: '2025-07-15'
      });

      const stats = eventService.getEventStats();
      
      expect(stats.total).toBe(3);
      expect(stats.byLeaveType).toHaveLength(2);
      expect(stats.byLeaveType[0]!.leave_type).toBe('vacation');
      expect(stats.byLeaveType[0]!.count).toBe(2);
      expect(stats.byMonth).toHaveLength(2);
    });
  });
});