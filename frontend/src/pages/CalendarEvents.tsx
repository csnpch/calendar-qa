import React, { useState, useEffect } from 'react';
import { CalendarGrid } from '@/components/CalendarGrid';
import { EventModal } from '@/components/EventModal';
import { EventDetailsModal } from '@/components/EventDetailsModal';
import { useCalendarData } from '@/hooks/useCalendarData';
import { Event } from '@/services/apiDatabase';
import { Layout } from '@/components/Layout';

const CalendarEvents = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState<Event[]>([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  
  const {
    employees,
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    loadEventsForMonth,
    loadData
  } = useCalendarData();

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dayEvents = getEventsForDate(date);
    setSelectedDateEvents(dayEvents);
    setIsDetailsModalOpen(true);
  };

  const handleCreateEvent = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleCreateEventFromDetails = () => {
    setIsDetailsModalOpen(false);
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsDetailsModalOpen(false);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (window.confirm('คุณต้องการลบเหตุการณ์นี้หรือไม่?')) {
      try {
        await deleteEvent(eventId);
        await loadData();
        if (selectedDate) {
          const dayEvents = getEventsForDate(selectedDate);
          setSelectedDateEvents(dayEvents);
        }
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  };

  const handleEventSave = async (eventData: {
    employeeId: number;
    employeeName: string;
    leaveType: string;
    date: string;
    description?: string;
  }) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, {
          employeeId: eventData.employeeId,
          leaveType: eventData.leaveType as any,
          date: eventData.date,
          description: eventData.description
        });
      } else {
        await addEvent({
          employeeId: eventData.employeeId,
          leaveType: eventData.leaveType as any,
          date: eventData.date,
          description: eventData.description
        });
      }

      await loadData();
      
      if (selectedDate) {
        const dayEvents = getEventsForDate(selectedDate);
        setSelectedDateEvents(dayEvents);
      }
      
      setEditingEvent(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save event:', err);
    }
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
    loadEventsForMonth(newDate.getFullYear(), newDate.getMonth());
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
    loadEventsForMonth(newDate.getFullYear(), newDate.getMonth());
  };

  const handleTodayClick = () => {
    const today = new Date();
    const newDate = new Date(today.getFullYear(), today.getMonth(), 1);
    setCurrentDate(newDate);
    loadEventsForMonth(newDate.getFullYear(), newDate.getMonth());
  };

  useEffect(() => {
    if (!isModalOpen && !isDetailsModalOpen) {
      document.body.style.overflow = 'unset';
    }
  }, [isModalOpen, isDetailsModalOpen]);

  useEffect(() => {
    if (selectedDate) {
      const dayEvents = getEventsForDate(selectedDate);
      setSelectedDateEvents(dayEvents);
    }
  }, [events, selectedDate, getEventsForDate]);

  return (
    <Layout currentPage="calendar-events">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-8">
        <div className="flex flex-col space-y-2 sm:space-y-3 md:space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-800/30 border border-red-200 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded">
              Error: {error}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500 dark:text-gray-300">Loading calendar data...</div>
            </div>
          ) : (
            <CalendarGrid
              currentDate={currentDate}
              events={events}
              employees={employees}
              onDateClick={handleDateClick}
              onCreateEvent={handleCreateEvent}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onTodayClick={handleTodayClick}
            />
          )}
        </div>
      </div>

      {/* Event Creation Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEvent(null); }}
        onSave={handleEventSave}
        selectedDate={selectedDate}
        employees={employees}
        editingEvent={editingEvent}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onCreateEvent={handleCreateEventFromDetails}
        onEditEvent={handleEditEvent}
        onDeleteEvent={handleDeleteEvent}
        events={selectedDateEvents}
        employees={employees}
        selectedDate={selectedDate}
      />
    </Layout>
  );
};

export default CalendarEvents;
