import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateEventPopover } from '@/components/CreateEventPopover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useHolidays } from '@/hooks/useHolidays';
import { Event } from '@/services/apiDatabase';
import { DAYS_OF_WEEK, MONTHS, LEAVE_TYPE_COLORS, LEAVE_TYPE_LABELS } from '@/lib/utils';

interface CalendarGridProps {
  currentDate: Date;
  events: Event[];
  employees: { id: number; name: string }[];
  companyHolidays: any[];
  onDateClick: (date: Date) => void;
  onCreateEvent: (date: Date) => void;
  onHolidayAdded?: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onTodayClick: () => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  events,
  employees,
  companyHolidays,
  onDateClick,
  onCreateEvent,
  onHolidayAdded,
  onPrevMonth,
  onNextMonth,
  onTodayClick
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedPopoverDate, setSelectedPopoverDate] = useState<Date | null>(null);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const { holidays, isHoliday, isWeekend } = useHolidays(year);

  const isCompanyHoliday = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return companyHolidays.find(holiday => holiday.date === dateString) || null;
  };

  const handleHolidayAdded = () => {
    // Refresh company holidays when a new one is added
    if (onHolidayAdded) {
      onHolidayAdded();
    }
  };
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const getDaysInMonth = () => {
    const days = [];
    const currentDay = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0');
    return events.filter(event => event.date === dateString);
  };

  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.name || 'Unknown Employee';
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleDateClick = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    const companyHoliday = isCompanyHoliday(date);
    
    if (dayEvents.length > 0 || companyHoliday) {
      onDateClick(date);
    } else {
      setSelectedPopoverDate(date);
      setPopoverOpen(true);
    }
  };

  const handleCreateEvent = () => {
    if (selectedPopoverDate) {
      onCreateEvent(selectedPopoverDate);
    }
  };

  const days = getDaysInMonth();

  // Group days into weeks - always show 6 rows
  const weeks = [];
  for (let i = 0; i < 42; i += 7) {
    const week = days.slice(i, i + 7);
    weeks.push(week);
  }

  const allVisibleDays = weeks.flat();

  return (
    <TooltipProvider>
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
      {/* Header */}
      <div className="p-2 sm:p-3 md:p-4 border-b border-gray-200 dark:border-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-gray-200" />
            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
              {MONTHS[month]} {year}
            </h2>
          </div>
          <div className="flex space-x-1">
            <Button variant="outline" size="sm" onClick={onTodayClick} className="h-6 sm:h-7 px-2 text-xs sm:text-sm text-gray-500 hover:text-gray-700 dark:text-white dark:hover:text-gray-300 border-gray-200 dark:border-gray-600">
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={onPrevMonth} className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-gray-500 hover:text-gray-700 dark:text-white dark:hover:text-gray-300 border-gray-200 dark:border-gray-600">
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onNextMonth} className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-gray-500 hover:text-gray-700 dark:text-white dark:hover:text-gray-300 border-gray-200 dark:border-gray-600">
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-1 sm:p-2 md:p-3">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
          {DAYS_OF_WEEK.map((day, index) => (
            <div key={day} className={`p-1 sm:p-2 text-center text-xs font-semibold rounded ${
              index === 0 || index === 6 
                ? 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar weeks */}
        <div className="space-y-0.5 sm:space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {week.map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const isOtherMonth = !isCurrentMonth(date);
                const isTodayDate = isToday(date);
                const hasEvents = dayEvents.length > 0;
                const thaiHoliday = isHoliday(date);
                const companyHoliday = isCompanyHoliday(date);
                const weekend = isWeekend(date);

                let bgColor = 'bg-white dark:bg-gray-700';
                let textColor = 'text-gray-900 dark:text-white';
                let borderColor = 'border-gray-200 dark:border-gray-600';

                if (isOtherMonth) {
                  bgColor = 'bg-gray-50 dark:bg-gray-800';
                  textColor = 'text-gray-400 dark:text-gray-500'; // Adjusted for better visibility
                  borderColor = 'border-gray-300 dark:border-gray-600';
                } else { // For current month days
                  // Apply weekend styling first if applicable
                  if (weekend) {
                    bgColor = 'bg-red-50 dark:bg-red-800/30';
                    textColor = 'text-red-700 dark:text-red-300';
                    borderColor = 'border-red-200 dark:border-red-600';
                  } else if (companyHoliday) {
                    // Company holidays get red styling (old Thai holiday colors)
                    textColor = 'text-red-600 dark:text-red-500';
                    borderColor = 'border-red-100 dark:border-red-800';
                  } else if (thaiHoliday) {
                    // Thai holidays get dark gray styling
                    textColor = 'text-gray-600 dark:text-gray-400';
                    borderColor = 'border-gray-300 dark:border-gray-600';
                  }

                  // Today's styling (overrides previous settings for the current day)
                  if (isTodayDate) {
                    borderColor = 'ring-2 ring-blue-500 dark:ring-gray-400 ring-offset-1';
                    // Don't override background - keep original (default or weekend/holiday)
                    // Keep text color as white in dark mode, but preserve the appropriate color in light mode
                    if (weekend) {
                      textColor = 'text-red-700 dark:text-white';
                    } else if (companyHoliday) {
                      textColor = 'text-red-600 dark:text-white';
                    } else if (thaiHoliday) {
                      textColor = 'text-gray-600 dark:text-white';
                    } else {
                      textColor = 'text-blue-700 dark:text-white';
                    }
                  }

                  // Event styling (modifies border and bgColor if it's a plain day with events)
                  if (hasEvents) {
                    borderColor = 'border-blue-400 dark:border-gray-500';
                    // Only change bgColor for events if it's not today, not a weekend,
                    // and not a non-weekend holiday (which now has default background).
                    if (!isTodayDate && !weekend && !thaiHoliday && !companyHoliday) {
                      bgColor = 'bg-blue-25 dark:bg-gray-800/20';
                    }
                  }
                }

                const dayElement = (
                  <div
                    key={`${weekIndex}-${index}`}
                    className={`
                      min-h-[45px] sm:min-h-[60px] md:min-h-[75px] lg:min-h-[90px] 
                      p-0.5 sm:p-1 border rounded cursor-pointer transition-all duration-200
                      hover:shadow-sm hover:scale-[1.01] transform
                      ${!isOtherMonth ? 'hover:bg-blue-50 dark:hover:bg-gray-800/30 hover:border-blue-300 dark:hover:border-gray-500' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}
                      ${bgColor} ${textColor} ${borderColor}
                    `}
                    onClick={() => handleDateClick(date)}
                  >
                    <div className={`text-xs font-semibold mb-0.5 ${isTodayDate && !isOtherMonth ? 'dark:text-white' : ''}`}>
                      {date.getDate()}
                    </div>
                    
                    {companyHoliday && !isOtherMonth && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-xs bg-red-200 dark:bg-red-600 text-black dark:text-red-100 px-1 py-0.5 rounded mb-0.5 font-medium leading-tight cursor-pointer">
                            <div className="break-words overflow-hidden leading-tight" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical'
                            }}>
                              {companyHoliday.name}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{companyHoliday.description || companyHoliday.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    
                    {thaiHoliday && !isOtherMonth && (
                      <div className="text-xs bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-1 py-0.5 rounded mb-0.5 font-medium leading-tight">
                        <div className="break-words overflow-hidden leading-tight" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {thaiHoliday.name}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, window.innerWidth < 640 ? 1 : window.innerWidth < 768 ? 1 : 2).map((event) => {
                        const employeeName = getEmployeeName(event.employeeId);
                        return (
                          <div
                            key={event.id}
                            className={`
                              text-xs px-0.5 py-0.5 sm:px-1 sm:py-0.5 rounded border text-center font-medium truncate
                              ${LEAVE_TYPE_COLORS[event.leaveType as keyof typeof LEAVE_TYPE_COLORS] || LEAVE_TYPE_COLORS.other}
                            `}
                            title={`${employeeName} - ${LEAVE_TYPE_LABELS[event.leaveType as keyof typeof LEAVE_TYPE_LABELS] || event.leaveType}`}
                          >
                            <span className="sm:inline truncate block">{employeeName.length > 12 ? employeeName.substring(0, 12) + '...' : employeeName}</span>
                            <span className="sm:hidden truncate block">{employeeName.split(' ')[0].substring(0, 6)}</span>
                          </div>
                        );
                      })}
                      {dayEvents.length > (window.innerWidth < 640 ? 1 : window.innerWidth < 768 ? 1 : 2) && (
                        <div className="text-xs text-gray-600 text-center font-medium">
                          +{dayEvents.length - (window.innerWidth < 640 ? 1 : window.innerWidth < 768 ? 1 : 2)}
                        </div>
                      )}
                    </div>
                  </div>
                );

                return !hasEvents && !companyHoliday ? (
                  <CreateEventPopover
                    key={`${weekIndex}-${index}`}
                    isOpen={popoverOpen && selectedPopoverDate?.toDateString() === date.toDateString()}
                    onOpenChange={(open) => {
                      setPopoverOpen(open);
                      if (!open) setSelectedPopoverDate(null);
                    }}
                    onCreateEvent={handleCreateEvent}
                    onHolidayAdded={handleHolidayAdded}
                    selectedDate={selectedPopoverDate}
                    triggerElement={dayElement}
                  />
                ) : (
                  dayElement
                );
              })}
            </div>
          ))}
        </div>
      </div>
      </div>
    </TooltipProvider>
  );
};
