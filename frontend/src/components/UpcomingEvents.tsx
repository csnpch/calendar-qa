import React from 'react';
import { Event, Employee } from '@/services/apiDatabase';
import moment from 'moment';
import 'moment/locale/th';

interface UpcomingEventsProps {
  events: Event[];
  employees: Employee[];
  onNavigateToMonth?: (year: number, month: number) => void;
  onEventHover?: (startDate: string, endDate: string) => void;
  onEventHoverEnd?: () => void;
}

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ events, employees, onNavigateToMonth, onEventHover, onEventHoverEnd }) => {
  moment.locale('th');
  
  // กรองเหตุการณ์ที่จะเกิดขึ้นในอนาคต
  const upcomingEvents = events
    .filter(event => {
      const today = moment().startOf('day');
      
      // Check both legacy date field and new range fields
      if (event.startDate && event.endDate) {
        // For range events, check if event end date is after today (future only)
        const endDate = moment(event.endDate);
        return endDate.isAfter(today);
      } else if (event.date) {
        // For legacy single-day events, check if date is today or later
        const eventDate = moment(event.date);
        return eventDate.isSameOrAfter(today);
      }
      
      return false;
    })
    .sort((a, b) => {
      // Sort by start date (either startDate or date)
      const aStart = moment(a.startDate || a.date);
      const bStart = moment(b.startDate || b.date);
      return aStart.diff(bStart);
    })
    .slice(0, 20); // Show more items since they're compact

  // ฟังก์ชันหาชื่อพนักงานจาก ID
  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'ไม่พบข้อมูลพนักงาน';
  };

  // ฟังก์ชันแปลงประเภทการลาเป็นภาษาไทย (แบบสั้น)
  const getLeaveTypeText = (leaveType: string) => {
    const leaveTypes: { [key: string]: string } = {
      'sick': 'ป่วย',
      'vacation': 'พักร้อน',
      'personal': 'กิจ',
      'maternity': 'คลอด',
      'paternity': 'คลอด',
      'annual': 'พักร้อน',
      'other': 'อื่นๆ'
    };
    return leaveTypes[leaveType] || leaveType;
  };

  // ฟังก์ชันกำหนดสีตามประเภทการลา (แบบเล็ก)
  const getLeaveTypeColor = (leaveType: string) => {
    const colors: { [key: string]: string } = {
      'vacation': 'bg-blue-50 text-blue-600 border-blue-200',
      'personal': 'bg-stone-50 text-stone-600 border-stone-200',
      'sick': 'bg-purple-50 text-purple-600 border-purple-200',
      'other': 'bg-gray-50 text-gray-600 border-gray-200'
    };
    return colors[leaveType] || colors['other'];
  };

  if (upcomingEvents.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          ลำดับเหตุการณ์
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
          ไม่มีเหตุการณ์ที่จะเกิดขึ้น
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
        ลำดับเหตุการณ์ ({upcomingEvents.length})
      </h3>
      <div className="space-y-1">
        {upcomingEvents.map((event, index) => {
          const startDate = event.startDate || event.date;
          const endDate = event.endDate || event.date;
          const isMultiDay = startDate !== endDate;
          
          const handleClick = () => {
            if (onNavigateToMonth) {
              const eventMoment = moment(startDate);
              onNavigateToMonth(eventMoment.year(), eventMoment.month());
            }
          };
          
          const handleMouseEnter = () => {
            if (onEventHover) {
              onEventHover(startDate, endDate);
            }
          };
          
          const handleMouseLeave = () => {
            if (onEventHoverEnd) {
              onEventHoverEnd();
            }
          };
          
          return (
            <div
              key={event.id}
              className="flex items-center gap-2 p-1.5 hover:bg-green-50 dark:hover:bg-green-900/30 rounded text-xs transition-colors cursor-pointer"
              onClick={handleClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {/* Number */}
              <div className="flex-shrink-0 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-medium">
                {index + 1}
              </div>
              
              {/* Employee Name */}
              <div className="flex-shrink-0 font-medium text-gray-900 dark:text-white min-w-0 max-w-32 truncate" title={getEmployeeName(event.employeeId)}>
                {getEmployeeName(event.employeeId)}
              </div>
              
              {/* Leave Type Badge */}
              <div className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium border ${getLeaveTypeColor(event.leaveType)}`}>
                {getLeaveTypeText(event.leaveType)}
              </div>
              
              {/* Date */}
              <div className="flex-shrink-0 text-gray-600 dark:text-gray-400">
                {isMultiDay ? (
                  <span>{moment(startDate).format('DD/MM')} - {moment(endDate).format('DD/MM')}</span>
                ) : (
                  <span>{moment(startDate).format('DD/MM')}</span>
                )}
              </div>
              
              {/* Year if not current year */}
              <div className="flex-shrink-0 text-gray-500 dark:text-gray-500 text-[10px]">
                {moment(startDate).year() !== moment().year() ? moment(startDate).format('YYYY') : ''}
              </div>
              
              {/* Description */}
              {event.description && (
                <div className="flex-1 text-gray-500 dark:text-gray-400 truncate min-w-0">
                  {event.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingEvents;