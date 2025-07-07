import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateEventPopover } from '@/components/CreateEventPopover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useHolidays } from '@/hooks/useHolidays';
import { Event } from '@/services/apiDatabase';
import { DAYS_OF_WEEK, MONTHS, LEAVE_TYPE_COLORS, LEAVE_TYPE_LABELS } from '@/lib/utils';
import moment from 'moment';

interface CalendarGridProps {
  currentDate: Date;
  events: Event[];
  employees: { id: number; name: string }[];
  companyHolidays: any[];
  highlightedDates?: string[];
  onDateClick: (date: Date) => void;
  onCreateEvent: (date: Date, dateRange?: Date[]) => void;
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
  highlightedDates = [],
  onDateClick,
  onCreateEvent,
  onHolidayAdded,
  onPrevMonth,
  onNextMonth,
  onTodayClick
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedPopoverDate, setSelectedPopoverDate] = useState<Date | null>(null);
  const [maxVisibleEvents, setMaxVisibleEvents] = useState(2);
  const [popoverJustOpened, setPopoverJustOpened] = useState(false);
  
  // Drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
  const [dragEndDate, setDragEndDate] = useState<Date | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<Date[]>([]);
  const [hoverDateRange, setHoverDateRange] = useState<Date[]>([]);
  
  // Safely handle window resize
  React.useEffect(() => {
    const updateMaxEvents = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        setMaxVisibleEvents(width < 640 ? 1 : width < 768 ? 1 : 2);
      }
    };
    
    updateMaxEvents();
    window.addEventListener('resize', updateMaxEvents);
    
    return () => window.removeEventListener('resize', updateMaxEvents);
  }, []);
  
  const year = moment(currentDate).year();
  const month = moment(currentDate).month();
  const { holidays, isHoliday, isWeekend } = useHolidays(year);

  const isCompanyHoliday = (date: Date) => {
    if (!Array.isArray(companyHolidays)) return null;
    const dateString = moment(date).format('YYYY-MM-DD');
    return companyHolidays.find(holiday => holiday.date === dateString) || null;
  };

  const handleHolidayAdded = () => {
    // Refresh company holidays when a new one is added
    if (onHolidayAdded) {
      onHolidayAdded();
    }
  };
  
  const firstDay = moment().year(year).month(month).date(1);
  const startDate = firstDay.clone().subtract(firstDay.day(), 'days');
  
  const getDaysInMonth = () => {
    const days = [];
    let currentDay = moment(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(currentDay.toDate());
      currentDay = currentDay.clone().add(1, 'day');
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    if (!Array.isArray(events)) return [];
    const dateString = moment(date).format('YYYY-MM-DD');
    const filteredEvents = events.filter(event => {
      // Check both legacy date field and new date range fields
      if (event.date === dateString) return true;
      if (event.startDate && event.endDate) {
        return dateString >= event.startDate && dateString <= event.endDate;
      }
      return false;
    });
    
    // Sort events for consistent layering
    return filteredEvents.sort((a, b) => {
      // First sort by start date (earlier events first)
      const aStart = a.startDate || a.date;
      const bStart = b.startDate || b.date;
      if (aStart !== bStart) {
        return aStart < bStart ? -1 : 1;
      }
      
      // Then by duration (longer events first)
      const aEnd = a.endDate || a.date;
      const bEnd = b.endDate || b.date;
      const aDuration = moment(aEnd).diff(moment(aStart), 'days');
      const bDuration = moment(bEnd).diff(moment(bStart), 'days');
      if (aDuration !== bDuration) {
        return bDuration - aDuration;
      }
      
      // Finally by employee ID for consistency
      return a.employeeId - b.employeeId;
    });
  };

  const getEmployeeName = (employeeId: number) => {
    if (!Array.isArray(employees)) return 'Unknown Employee';
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.name || 'Unknown Employee';
  };

  const isCurrentMonth = (date: Date) => {
    return moment(date).month() === month;
  };

  const isToday = (date: Date) => {
    return moment(date).isSame(moment(), 'day');
  };

  const handleDateClick = (date: Date) => {
    // If we have a date range selected (either valid dates or just hover range), create events for the range
    if (selectedDateRange.length > 1 || hoverDateRange.length > 1) {
      const popoverDate = selectedDateRange.length > 0 ? selectedDateRange[0] : hoverDateRange[0];
      setSelectedPopoverDate(popoverDate);
      setPopoverOpen(true);
      return;
    }
    
    const dayEvents = getEventsForDate(date);
    const companyHoliday = isCompanyHoliday(date);
    const thaiHoliday = isHoliday(date);
    
    if (dayEvents.length > 0 || companyHoliday || thaiHoliday) {
      onDateClick(date);
    } else {
      // Clear any previous selections for clean single-day click
      clearSelection();
      setTimeout(() => {
        setSelectedPopoverDate(date);
        setPopoverOpen(true);
        setPopoverJustOpened(true);
        // Allow normal closing after a short delay
        setTimeout(() => setPopoverJustOpened(false), 100);
      }, 0);
    }
  };

  const handleMouseDown = (date: Date) => {
    setIsDragging(true);
    setDragStartDate(date);
    setDragEndDate(date);
    
    // Check if starting date is valid for event creation (only block company holidays)
    const companyHoliday = isCompanyHoliday(date);
    
    if (!companyHoliday) {
      // Valid starting date (allow overlapping with existing events)
      setSelectedDateRange([date]);
      setHoverDateRange([date]);
    } else {
      // Invalid starting date, but allow drag to continue
      setSelectedDateRange([]);
      setHoverDateRange([date]);
    }
  };

  const handleMouseEnter = (date: Date) => {
    if (!isDragging || !dragStartDate) return;
    
    setDragEndDate(date);
    
    // Calculate all dates in the drag range for visual feedback
    const startMoment = moment(dragStartDate);
    const endMoment = moment(date);
    const allDatesInRange = [];
    const validDatesInRange = [];
    
    if (startMoment.isBefore(endMoment) || startMoment.isSame(endMoment)) {
      let current = startMoment.clone();
      while (current.isSameOrBefore(endMoment)) {
        const currentDate = current.toDate();
        allDatesInRange.push(currentDate);
        
        // Only exclude company holidays (allow overlapping with existing events)
        const currentHoliday = isCompanyHoliday(currentDate);
        
        if (!currentHoliday) {
          validDatesInRange.push(currentDate);
        }
        current.add(1, 'day');
      }
    } else {
      let current = endMoment.clone();
      while (current.isSameOrBefore(startMoment)) {
        const currentDate = current.toDate();
        allDatesInRange.push(currentDate);
        
        // Only exclude company holidays (allow overlapping with existing events)
        const currentHoliday = isCompanyHoliday(currentDate);
        
        if (!currentHoliday) {
          validDatesInRange.push(currentDate);
        }
        current.add(1, 'day');
      }
      allDatesInRange.reverse();
      validDatesInRange.reverse();
    }
    
    // Set hover range for visual feedback (all dates)
    setHoverDateRange(allDatesInRange);
    // Set selected range for final selection (only valid dates)
    setSelectedDateRange(validDatesInRange);
  };

  const handleMouseUp = () => {
    if (isDragging && hoverDateRange.length > 1) {
      // Show popover for multi-day selection (use hoverDateRange to include all dragged dates)
      // Use the first valid date from selectedDateRange, or first date from hoverDateRange if no valid dates
      const popoverDate = selectedDateRange.length > 0 ? selectedDateRange[0] : hoverDateRange[0];
      setSelectedPopoverDate(popoverDate);
      setPopoverOpen(true);
    }
    setIsDragging(false);
    // Keep hoverDateRange to show the full drag selection until cleared
  };

  // Add global mouse up event listener
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging]);

  const isDateInSelectedRange = (date: Date) => {
    return selectedDateRange.some(rangeDate => 
      moment(rangeDate).isSame(moment(date), 'day')
    );
  };

  const isDateInHoverRange = (date: Date) => {
    return hoverDateRange.some(rangeDate => 
      moment(rangeDate).isSame(moment(date), 'day')
    );
  };

  const clearSelection = () => {
    setSelectedDateRange([]);
    setHoverDateRange([]);
    setDragStartDate(null);
    setDragEndDate(null);
  };

  // Helper function to check if an event continues to adjacent days
  const getEventContinuity = (event: Event, date: Date) => {
    // For multi-day events, check if this date is at the start, middle, or end of the range
    if (event.startDate && event.endDate && event.startDate !== event.endDate) {
      const currentDateStr = moment(date).format('YYYY-MM-DD');
      const prevDateStr = moment(date).subtract(1, 'day').format('YYYY-MM-DD');
      const nextDateStr = moment(date).add(1, 'day').format('YYYY-MM-DD');
      
      // Check if this is a multi-day event that spans multiple dates
      const hasPrevious = prevDateStr >= event.startDate && prevDateStr <= event.endDate && !isWeekend(moment(date).subtract(1, 'day').toDate());
      const hasNext = nextDateStr >= event.startDate && nextDateStr <= event.endDate && !isWeekend(moment(date).add(1, 'day').toDate());
      
      return { hasPrevious, hasNext };
    }
    
    // Fallback to legacy logic for single-day events or old data
    const currentDate = moment(date);
    const prevDate = currentDate.clone().subtract(1, 'day');
    const nextDate = currentDate.clone().add(1, 'day');
    
    const prevEvents = getEventsForDate(prevDate.toDate());
    const nextEvents = getEventsForDate(nextDate.toDate());
    
    const hasPrevious = prevEvents.some(e => 
      e.employeeId === event.employeeId && 
      e.leaveType === event.leaveType &&
      !isWeekend(prevDate.toDate()) // Don't connect over weekends
    );
    
    const hasNext = nextEvents.some(e => 
      e.employeeId === event.employeeId && 
      e.leaveType === event.leaveType &&
      !isWeekend(nextDate.toDate()) // Don't connect over weekends
    );
    
    return { hasPrevious, hasNext };
  };

  const handleCreateEvent = () => {
    if (selectedDateRange.length > 1) {
      // Create event for date range
      onCreateEvent(selectedDateRange[0], selectedDateRange);
    } else if (selectedPopoverDate) {
      onCreateEvent(selectedPopoverDate);
    }
    clearSelection();
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
            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">
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
            <div key={day} className={`p-1 sm:p-2 text-center text-xs font-medium rounded ${
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
                const isHighlighted = highlightedDates.includes(moment(date).format('YYYY-MM-DD'));

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

                  // Highlight styling (overrides other styling when highlighted)
                  if (isHighlighted && !isOtherMonth) {
                    bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
                    borderColor = 'border-yellow-400 dark:border-yellow-600 ring-1 ring-yellow-300 dark:ring-yellow-700';
                  }
                }

                const dayContent = (
                  <div
                    key={`${weekIndex}-${index}`}
                    className={`
                      min-h-[45px] sm:min-h-[60px] md:min-h-[75px] lg:min-h-[90px] 
                      p-0.5 sm:p-1 border rounded cursor-pointer transition-all duration-200 select-none
                      hover:shadow-sm hover:scale-[1.01] transform
                      ${!isOtherMonth ? 'hover:bg-blue-50 dark:hover:bg-gray-800/30 hover:border-blue-300 dark:hover:border-gray-500' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}
                      ${isDateInSelectedRange(date) || isDateInHoverRange(date) ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 ring-2 ring-blue-200 dark:ring-blue-700' : bgColor} ${textColor} ${!(isDateInSelectedRange(date) || isDateInHoverRange(date)) ? borderColor : ''}
                    `}
                    onClick={() => handleDateClick(date)}
                    onMouseDown={() => handleMouseDown(date)}
                    onMouseEnter={() => handleMouseEnter(date)}
                    onMouseUp={handleMouseUp}
                  >
                        <div className={`text-xs font-medium mb-0.5 ${isTodayDate && !isOtherMonth ? 'dark:text-white' : ''}`}>
                          {moment(date).date()}{thaiHoliday && !isOtherMonth ? '*' : ''}
                        </div>
                    
                    {/* Only show events if it's not a weekend and not a company holiday */}
                    {!weekend && !companyHoliday && (
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, maxVisibleEvents).map((event, eventIndex) => {
                          const employeeName = getEmployeeName(event.employeeId);
                          const { hasPrevious, hasNext } = getEventContinuity(event, date);
                          
                          // Determine border radius based on continuity
                          let borderRadius = 'rounded';
                          if (hasPrevious && hasNext) {
                            borderRadius = 'rounded-none';
                          } else if (hasPrevious && !hasNext) {
                            borderRadius = 'rounded-l-none rounded-r';
                          } else if (!hasPrevious && hasNext) {
                            borderRadius = 'rounded-l rounded-r-none';
                          }
                          
                          // Display text formatting - add dashes for middle days
                          let displayText = employeeName;
                          if (hasPrevious && hasNext) {
                            displayText = `- ${employeeName} -`;
                          }
                          
                          // Z-index based on sorted position to ensure proper layering
                          // Events that appear first in sorted order get lower z-index (appear below)
                          const zIndex = hasPrevious || hasNext ? 10 + eventIndex : 1 + eventIndex;
                          
                          return (
                            <div
                              key={event.id}
                              className={`
                                text-xs py-0.5 ${borderRadius} border text-center font-normal
                                ${LEAVE_TYPE_COLORS[event.leaveType as keyof typeof LEAVE_TYPE_COLORS] || LEAVE_TYPE_COLORS.other}
                                ${hasPrevious ? 'border-l-0' : 'px-0.5 sm:px-1'}
                                ${hasNext ? 'border-r-0' : 'px-0.5 sm:px-1'}
                                ${hasPrevious ? '-ml-1 sm:-ml-2 pl-1 sm:pl-2' : ''}
                                ${hasNext ? '-mr-1 sm:-mr-2 pr-1 sm:pr-2' : ''}
                                relative overflow-visible
                              `}
                              style={{ zIndex }}
                              title={`${employeeName} - ${LEAVE_TYPE_LABELS[event.leaveType as keyof typeof LEAVE_TYPE_LABELS] || event.leaveType}`}
                            >
                              <span className="sm:inline truncate block">
                                {displayText.length > 12 ? displayText.substring(0, 12) + '...' : displayText}
                              </span>
                              <span className="sm:hidden truncate block">
                                {hasPrevious && hasNext 
                                  ? `- ${(employeeName.split(' ')[0] || employeeName).substring(0, 4)} -`
                                  : (employeeName.split(' ')[0] || employeeName).substring(0, 6)
                                }
                              </span>
                            </div>
                          );
                        })}
                        {dayEvents.length > maxVisibleEvents && (
                          <div className="text-xs text-gray-600 text-center font-normal">
                            +{dayEvents.length - maxVisibleEvents}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Show holidays after events (lower priority) */}
                    {companyHoliday && !isOtherMonth && (
                      <div className="text-xs bg-red-200 dark:bg-red-600 text-black dark:text-red-100 px-1 py-0.5 rounded mb-0.5 font-normal leading-tight cursor-pointer">
                        <div className="break-words overflow-hidden leading-tight" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {companyHoliday.name}
                        </div>
                      </div>
                    )}
                    
                  </div>
                );

                const dayElement = (thaiHoliday || companyHoliday) && !isOtherMonth ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {dayContent}
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <div className="space-y-1">
                        {thaiHoliday && (
                          <div className="text-sm">
                            วันหยุดไทย: {thaiHoliday.name}
                          </div>
                        )}
                        {companyHoliday && (
                          <div className="text-sm">
                            วันหยุดบริษัท: {companyHoliday.name}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ) : dayContent;

                // Check if this date should show the popover for multi-day selection
                const shouldShowPopover = popoverOpen && selectedPopoverDate && (
                  moment(selectedPopoverDate).isSame(moment(date), 'day') ||
                  (selectedDateRange.length > 1 && isDateInSelectedRange(date) && moment(selectedDateRange[0]).isSame(moment(date), 'day')) ||
                  (hoverDateRange.length > 1 && selectedDateRange.length === 0 && isDateInHoverRange(date) && moment(hoverDateRange[0]).isSame(moment(date), 'day'))
                );

                // For multi-day selection, show popover even if the date has events
                const isMultiDaySelection = (selectedDateRange.length > 1) || (hoverDateRange.length > 1);
                
                const isEmptyDate = !hasEvents && !companyHoliday && !thaiHoliday;
                const isThisDateSelected = selectedPopoverDate && moment(selectedPopoverDate).isSame(moment(date), 'day');
                const isPopoverOpenForThisDate = shouldShowPopover || 
                  (isEmptyDate && popoverOpen && isThisDateSelected);
                
                // Only render popover for the specific date that should show it
                const shouldUsePopover = isPopoverOpenForThisDate;
                
                
                return shouldUsePopover ? (
                  <CreateEventPopover
                    key={`${weekIndex}-${index}`}
                    isOpen={isPopoverOpenForThisDate}
                    onOpenChange={(open) => {
                      // Prevent immediate close only if just opened
                      if (!open && popoverJustOpened) {
                        return;
                      }
                      setPopoverOpen(open);
                      if (!open) {
                        setSelectedPopoverDate(null);
                        setPopoverJustOpened(false);
                        if (isMultiDaySelection) {
                          clearSelection();
                        }
                      }
                    }}
                    onCreateEvent={handleCreateEvent}
                    onHolidayAdded={handleHolidayAdded}
                    selectedDate={selectedPopoverDate}
                    triggerElement={dayElement}
                    isRangeSelection={isMultiDaySelection}
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
