import { Elysia, t } from 'elysia';
import { EventService } from '../services/eventService';
import Logger from '../utils/logger';

const eventService = new EventService();

export const eventsRoutes = new Elysia({ prefix: '/events' })
  .get('/', () => {
    try {
      Logger.debug('Fetching all events');
      const events = eventService.getAllEvents();
      Logger.debug(`Retrieved ${events.length} events`);
      return events;
    } catch (error) {
      Logger.error('Error fetching all events:', error);
      throw error;
    }
  })
  
  .get('/:id', ({ params: { id } }) => {
    try {
      Logger.debug(`Fetching event with ID: ${id}`);
      const event = eventService.getEventById(Number(id));
      if (!event) {
        Logger.warn(`Event not found with ID: ${id}`);
        throw new Error('Event not found');
      }
      Logger.debug(`Retrieved event: ${event.employeeName} - ${event.leaveType}`);
      return event;
    } catch (error) {
      Logger.error(`Error fetching event ${id}:`, error);
      throw error;
    }
  }, {
    params: t.Object({
      id: t.String()
    })
  })
  
  .post('/', ({ body }) => {
    try {
      Logger.debug(`Creating new event: ${JSON.stringify(body)}`);
      const newEvent = eventService.createEvent(body);
      Logger.info(`Created event: ${newEvent.employeeName} - ${newEvent.leaveType} on ${newEvent.date}`);
      return newEvent;
    } catch (error) {
      Logger.error('Error creating event:', error);
      Logger.error('Event data:', JSON.stringify(body, null, 2));
      throw error;
    }
  }, {
    body: t.Object({
      employeeId: t.Number(),
      employeeName: t.String(),
      leaveType: t.Union([
        t.Literal('vacation'),
        t.Literal('personal'),
        t.Literal('sick'),
        t.Literal('absent'),
        t.Literal('maternity'),
        t.Literal('paternity'),
        t.Literal('bereavement'),
        t.Literal('study'),
        t.Literal('military'),
        t.Literal('sabbatical'),
        t.Literal('unpaid'),
        t.Literal('compensatory'),
        t.Literal('other')
      ]),
      date: t.String(),
      description: t.Optional(t.String())
    })
  })
  
  .put('/:id', ({ params: { id }, body }) => {
    try {
      Logger.debug(`Updating event ${id}: ${JSON.stringify(body)}`);
      const event = eventService.updateEvent(Number(id), body);
      if (!event) {
        Logger.warn(`Event not found for update with ID: ${id}`);
        throw new Error('Event not found');
      }
      Logger.info(`Updated event ${id}: ${event.employeeName} - ${event.leaveType}`);
      return event;
    } catch (error) {
      Logger.error(`Error updating event ${id}:`, error);
      Logger.error('Update data:', JSON.stringify(body, null, 2));
      throw error;
    }
  }, {
    params: t.Object({
      id: t.String()
    }),
    body: t.Object({
      employeeId: t.Optional(t.Number()),
      employeeName: t.Optional(t.String()),
      leaveType: t.Optional(t.Union([
        t.Literal('vacation'),
        t.Literal('personal'),
        t.Literal('sick'),
        t.Literal('absent'),
        t.Literal('maternity'),
        t.Literal('paternity'),
        t.Literal('bereavement'),
        t.Literal('study'),
        t.Literal('military'),
        t.Literal('sabbatical'),
        t.Literal('unpaid'),
        t.Literal('compensatory'),
        t.Literal('other')
      ])),
      date: t.Optional(t.String()),
      description: t.Optional(t.String())
    })
  })
  
  .delete('/:id', ({ params: { id } }) => {
    try {
      Logger.debug(`Deleting event with ID: ${id}`);
      const success = eventService.deleteEvent(Number(id));
      if (!success) {
        Logger.warn(`Event not found for deletion with ID: ${id}`);
        throw new Error('Event not found');
      }
      Logger.info(`Deleted event with ID: ${id}`);
      return { success: true };
    } catch (error) {
      Logger.error(`Error deleting event ${id}:`, error);
      throw error;
    }
  }, {
    params: t.Object({
      id: t.String()
    })
  })
  
  .get('/date/:date', ({ params: { date } }) => {
    return eventService.getEventsByDate(date);
  }, {
    params: t.Object({
      date: t.String()
    })
  })
  
  .get('/date-range/:startDate/:endDate', ({ params: { startDate, endDate } }) => {
    return eventService.getEventsByDateRange(startDate, endDate);
  }, {
    params: t.Object({
      startDate: t.String(),
      endDate: t.String()
    })
  })
  
  .get('/employee/:employeeId', ({ params: { employeeId } }) => {
    return eventService.getEventsByEmployeeId(Number(employeeId));
  }, {
    params: t.Object({
      employeeId: t.String()
    })
  })

  .get('/employee', ({ query }) => {
    try {
      Logger.debug('Fetching events by employee name with query:', query);
      const { employeeName, startDate, endDate } = query;
      
      if (!employeeName) {
        Logger.warn('Employee name is required');
        throw new Error('Employee name is required');
      }
      
      const events = eventService.getEventsByEmployeeName(
        employeeName as string,
        startDate as string,
        endDate as string
      );
      
      Logger.debug(`Retrieved ${events.length} events for employee: ${employeeName}`);
      return events;
    } catch (error) {
      Logger.error('Error fetching events by employee name:', error);
      throw error;
    }
  }, {
    query: t.Object({
      employeeName: t.String(),
      startDate: t.Optional(t.String()),
      endDate: t.Optional(t.String())
    })
  })
  
  .get('/leave-type/:leaveType', ({ params: { leaveType } }) => {
    return eventService.getEventsByLeaveType(leaveType);
  }, {
    params: t.Object({
      leaveType: t.String()
    })
  })
  
  .get('/month/:year/:month', ({ params: { year, month } }) => {
    return eventService.getEventsByMonth(Number(year), Number(month));
  }, {
    params: t.Object({
      year: t.String(),
      month: t.String()
    })
  })
  
  .get('/search/:query', ({ params: { query } }) => {
    return eventService.searchEvents(query);
  }, {
    params: t.Object({
      query: t.String()
    })
  })
  
  .get('/upcoming/:days?', ({ params: { days } }) => {
    return eventService.getUpcomingEvents(days ? Number(days) : 30);
  }, {
    params: t.Object({
      days: t.Optional(t.String())
    })
  })
  
  .get('/stats/overview', () => {
    return eventService.getEventStats();
  })

  .get('/dashboard/summary', ({ query }) => {
    try {
      Logger.debug('Fetching dashboard summary with query:', query);
      const { startDate, endDate, eventType } = query;
      const summary = eventService.getDashboardSummary(
        startDate as string,
        endDate as string,
        eventType as string
      );
      Logger.debug('Dashboard summary retrieved successfully');
      return summary;
    } catch (error) {
      Logger.error('Error fetching dashboard summary:', error);
      throw error;
    }
  }, {
    query: t.Object({
      startDate: t.Optional(t.String()),
      endDate: t.Optional(t.String()),
      eventType: t.Optional(t.String())
    })
  });