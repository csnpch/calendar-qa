import { useState, useEffect } from 'react';
import { getEmployeeService } from '../services/employeeService';
import { getEventService } from '../services/eventService';
import { Employee, Event } from '../services/apiDatabase';
import moment from 'moment';

export const useCalendarData = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const employeeService = getEmployeeService();
  const eventService = getEventService();

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const employeesData = await employeeService.getAllEmployees();
      const eventsData = await eventService.getAllEvents();
      
      setEmployees(employeesData);
      setEvents(eventsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Load events for a specific month
  const loadEventsForMonth = async (year: number, month: number) => {
    try {
      const eventsData = await eventService.getEventsByMonth(year, month + 1); // month is 0-indexed
      setEvents(eventsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    }
  };

  // Employee operations
  const addEmployee = async (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newEmployee = await employeeService.createEmployee(employee);
      setEmployees(prev => [...prev, newEmployee]);
      return newEmployee;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add employee');
      throw err;
    }
  };

  const updateEmployee = async (id: number, updates: Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const updatedEmployee = await employeeService.updateEmployee(id, updates);
      if (updatedEmployee) {
        setEmployees(prev => prev.map(emp => emp.id === id ? updatedEmployee : emp));
        // Reload events to get updated employee names
        const eventsData = await eventService.getAllEvents();
        setEvents(eventsData);
        return updatedEmployee;
      }
      throw new Error('Employee not found');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee');
      throw err;
    }
  };

  const deleteEmployee = async (id: number) => {
    try {
      const success = await employeeService.deleteEmployee(id);
      if (success) {
        setEmployees(prev => prev.filter(emp => emp.id !== id));
        // Also remove related events
        setEvents(prev => prev.filter(event => event.employeeId !== id));
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee');
      throw err;
    }
  };

  // Event operations
  const addEvent = async (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newEvent = await eventService.createEvent(event);
      // Don't update local state here - let the component reload data
      return newEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add event');
      throw err;
    }
  };

  const updateEvent = async (id: number, updates: Partial<Omit<Event, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const updatedEvent = await eventService.updateEvent(id, updates);
      if (updatedEvent) {
        // Don't update local state here - let the component reload data
        return updatedEvent;
      }
      throw new Error('Event not found');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
      throw err;
    }
  };

  const deleteEvent = async (id: number) => {
    try {
      const success = await eventService.deleteEvent(id);
      // Don't update local state here - let the component reload data
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
      throw err;
    }
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date): Event[] => {
    const dateString = moment(date).format('YYYY-MM-DD');
    return events.filter(event => {
      // Check both legacy date field and new date range fields
      if (event.date === dateString) return true;
      if (event.startDate && event.endDate) {
        return dateString >= event.startDate && dateString <= event.endDate;
      }
      return false;
    });
  };

  // Search functions
  const searchEmployees = async (query: string) => {
    return await employeeService.searchEmployees(query);
  };

  const searchEvents = async (query: string) => {
    return await eventService.searchEvents(query);
  };

  // Statistics
  const getEmployeeStats = async () => {
    return await employeeService.getEmployeeStats();
  };

  const getEventStats = async () => {
    return await eventService.getEventStats();
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // Data
    employees,
    events,
    loading,
    error,
    
    // Load functions
    loadData,
    loadEventsForMonth,
    
    // Employee operations
    addEmployee,
    updateEmployee,
    deleteEmployee,
    
    // Event operations
    addEvent,
    updateEvent,
    deleteEvent,
    
    // Utility functions
    getEventsForDate,
    searchEmployees,
    searchEvents,
    getEmployeeStats,
    getEventStats,
  };
};

export default useCalendarData;