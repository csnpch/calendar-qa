import React, { useState, useEffect } from 'react';
import { CalendarGrid } from '@/components/CalendarGrid';
import { EventModal } from '@/components/EventModal';
import { EventDetailsModal } from '@/components/EventDetailsModal';
import { EmployeeList } from '@/components/EmployeeList';
import { LeaveStats } from '@/components/LeaveStats';
import { CalendarDays, Building2, Menu, Users, Settings, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCalendarData } from '@/hooks/useCalendarData';
import { Event } from '@/services/apiDatabase';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

const Index = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
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
    // Get fresh events data
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

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('คุณต้องการลบเหตุการณ์นี้หรือไม่?')) {
      try {
        await deleteEvent(parseInt(eventId));
        // Reload all data to ensure consistency
        await loadData();
        // Update selected date events
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
    employeeName: string;
    leaveType: string;
    date: string;
    description?: string;
  }) => {
    try {
      // Find employee by name or use the first one
      const employee = employees.find(emp => emp.name === eventData.employeeName) || employees[0];
      
      if (!employee) {
        console.error('No employee found');
        return;
      }

      if (editingEvent) {
        // Update existing event
        await updateEvent(parseInt(editingEvent.id), {
          employeeId: employee.id,
          employeeName: eventData.employeeName,
          leaveType: eventData.leaveType as any,
          date: eventData.date,
          description: eventData.description
        });
      } else {
        // Create new event
        await addEvent({
          employeeId: employee.id,
          employeeName: eventData.employeeName,
          leaveType: eventData.leaveType as any,
          date: eventData.date,
          description: eventData.description
        });
      }

      // Reload all data to ensure consistency
      await loadData();
      
      // Refresh events for selected date if applicable
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

  // Cleanup body overflow when no modals are open
  useEffect(() => {
    if (!isModalOpen && !isDetailsModalOpen) {
      document.body.style.overflow = 'unset';
    }
  }, [isModalOpen, isDetailsModalOpen]);

  // Update selected date events when main events change
  useEffect(() => {
    if (selectedDate) {
      const dayEvents = getEventsForDate(selectedDate);
      setSelectedDateEvents(dayEvents);
    }
  }, [events, selectedDate, getEventsForDate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-700 dark:via-gray-600 dark:to-blue-700">
      {/* Header */}
      <div className="bg-white dark:bg-gray-600 shadow-sm border-b border-gray-200 dark:border-gray-500">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            <div className="p-1.5 sm:p-2 md:p-3 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Calendar QA</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-white dark:hover:text-gray-300 border-gray-200 dark:border-gray-600"
              >
                {theme === 'dark' ? 
                  <Sun className="w-4 h-4" /> : 
                  <Moon className="w-4 h-4" />
                }
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-white dark:hover:text-gray-300 border-gray-200 dark:border-gray-600">
                    <Menu className="w-4 h-4" />
                    <span className="hidden sm:inline">เมนู</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => navigate('/employees')}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    จัดการข้อมูลพนักงาน
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
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
            <div>
              <CalendarGrid
                currentDate={currentDate}
                events={events}
                onDateClick={handleDateClick}
                onCreateEvent={handleCreateEvent}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
              />
            </div>
          )}
        </div>
      </div>

      {/* Event Creation Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEvent(null); }}
        onSave={handleEventSave}
        selectedDate={selectedDate}
        employees={employees.map(emp => emp.name)}
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
        selectedDate={selectedDate}
      />

    </div>
  );
};

export default Index;
