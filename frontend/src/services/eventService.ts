import { getApiDatabase, Event } from './apiDatabase';

export class EventService {
  private db;

  constructor() {
    this.db = getApiDatabase();
  }

  // Create a new event
  async createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    return await this.db.createEvent(event);
  }

  // Get all events
  async getAllEvents(): Promise<Event[]> {
    return await this.db.getAllEvents();
  }

  // Get event by ID
  async getEventById(id: number): Promise<Event | null> {
    return await this.db.getEventById(id);
  }

  // Get events by date
  async getEventsByDate(date: string): Promise<Event[]> {
    return await this.db.getEventsByDate(date);
  }

  // Get events by date range
  async getEventsByDateRange(startDate: string, endDate: string): Promise<Event[]> {
    return await this.db.getEventsByDateRange(startDate, endDate);
  }

  // Get events by employee ID
  async getEventsByEmployeeId(employeeId: number): Promise<Event[]> {
    return await this.db.getEventsByEmployeeId(employeeId);
  }

  // Get events by leave type
  async getEventsByLeaveType(leaveType: string): Promise<Event[]> {
    const allEvents = await this.db.getAllEvents();
    return allEvents.filter(event => event.leaveType === leaveType);
  }

  // Get events for a specific month and year
  async getEventsByMonth(year: number, month: number): Promise<Event[]> {
    return await this.db.getEventsByMonth(year, month);
  }

  // Update event
  async updateEvent(id: number, updates: Partial<Omit<Event, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Event | null> {
    return await this.db.updateEvent(id, updates);
  }

  // Delete event
  async deleteEvent(id: number): Promise<boolean> {
    return await this.db.deleteEvent(id);
  }

  // Delete events by employee ID
  async deleteEventsByEmployeeId(employeeId: number): Promise<number> {
    const events = await this.db.getEventsByEmployeeId(employeeId);
    let deletedCount = 0;
    
    for (const event of events) {
      if (await this.db.deleteEvent(event.id)) {
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  // Get event statistics
  async getEventStats(): Promise<any> {
    return await this.db.getEventStats();
  }

  // Search events
  async searchEvents(query: string): Promise<Event[]> {
    return await this.db.searchEvents(query);
  }

  // Get upcoming events (next 30 days)
  async getUpcomingEvents(days: number = 30): Promise<Event[]> {
    return await this.db.getUpcomingEvents(days);
  }
}

// Create singleton instance
let eventServiceInstance: EventService | null = null;

export const getEventService = (): EventService => {
  if (!eventServiceInstance) {
    eventServiceInstance = new EventService();
  }
  return eventServiceInstance;
};

export default EventService;