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
    it('should create an event successfully', () => {
      const eventData = {
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation' as const,
        date: '2025-06-15',
        description: 'Summer vacation'
      };

      const result = eventService.createEvent(eventData);

      expect(result.employeeId).toBe(eventData.employeeId);
      expect(result.employeeName).toBe(eventData.employeeName);
      expect(result.leaveType).toBe(eventData.leaveType);
      expect(result.date).toBe(eventData.date);
      expect(result.description).toBe(eventData.description);
      expect(result.id).toBeGreaterThan(0);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should create an event without description', () => {
      const eventData = {
        employeeId: 2,
        employeeName: 'Jane Doe',
        leaveType: 'sick' as const,
        date: '2025-06-16'
      };

      const result = eventService.createEvent(eventData);

      expect(result.description).toBeUndefined();
    });
  });

  describe('getAllEvents', () => {
    it('should return all events ordered by date descending', () => {
      // Create test events
      eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation',
        date: '2025-06-15',
        description: 'Test event 1'
      });

      eventService.createEvent({
        employeeId: 2,
        employeeName: 'Jane Doe',
        leaveType: 'sick',
        date: '2025-06-20',
        description: 'Test event 2'
      });

      const events = eventService.getAllEvents();

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
        date: '2025-06-15',
        description: 'Summer vacation'
      });

      const found = eventService.getEventById(created.id);

      expect(found?.id).toBe(created.id);
      expect(found?.employeeName).toBe('John Smith');
    });

    it('should return null for non-existent event', () => {
      const event = eventService.getEventById(999);

      expect(event).toBeNull();
    });
  });

  describe('getEventsByDate', () => {
    it('should return events for specific date', () => {
      eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation',
        date: '2025-06-15',
        description: 'Vacation'
      });

      const events = eventService.getEventsByDate('2025-06-15');

      expect(events).toHaveLength(1);
      expect(events[0]!.date).toBe('2025-06-15');
    });
  });

  describe('getEventsByDateRange', () => {
    it('should return events within date range', () => {
      eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation',
        date: '2025-06-15',
        description: 'Vacation'
      });

      const events = eventService.getEventsByDateRange('2025-06-01', '2025-06-30');

      expect(events[0]!.date).toBe('2025-06-15');
    });
  });

  describe('updateEvent', () => {
    it('should update event successfully', async () => {
      const created = eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation',
        date: '2025-06-15',
        description: 'Summer vacation'
      });

      const updateData = {
        leaveType: 'sick' as const,
        description: 'New description'
      };

      await new Promise(resolve => setTimeout(resolve, 1100));
      const updated = eventService.updateEvent(created.id, updateData);

      expect(updated?.leaveType).toBe('sick');
      expect(updated?.description).toBe('New description');
      expect(updated?.employeeName).toBe('John Smith'); // Unchanged
      expect(updated?.date).toBe('2025-06-15'); // Unchanged
      expect(updated?.updatedAt).not.toBe(created.updatedAt);
    });

    it('should return null for non-existent event', () => {
      const updateData = { description: 'New description' };

      const updated = eventService.updateEvent(999, updateData);

      expect(updated).toBeNull();
    });
  });

  describe('deleteEvent', () => {
    it('should delete event successfully', () => {
      const created = eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation',
        date: '2025-06-15'
      });

      const deleted = eventService.deleteEvent(created.id);
      const found = eventService.getEventById(created.id);

      expect(deleted).toBe(true);
      expect(found).toBeNull();
    });

    it('should return false for non-existent event', () => {
      const result = eventService.deleteEvent(999);

      expect(result).toBe(false);
    });
  });

  describe('searchEvents', () => {
    it('should search events by employee name', () => {
      eventService.createEvent({
        employeeId: 1,
        employeeName: 'John Smith',
        leaveType: 'vacation',
        date: '2025-06-15',
        description: 'Test vacation'
      });

      const results = eventService.searchEvents('John');

      expect(results).toHaveLength(1);
      expect(results[0]!.employeeName).toBe('John Smith');
    });
  });

  describe('getEventStats', () => {
    it('should return event statistics', () => {
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
        date: '2025-06-16'
      });

      const stats = eventService.getEventStats();

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byLeaveType).toBeDefined();
      expect(stats.byMonth).toBeDefined();
    });
  });
});