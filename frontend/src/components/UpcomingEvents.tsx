import React from 'react';
import { Event, Employee } from '@/services/apiDatabase';
import moment from 'moment';
import 'moment/locale/th';

interface UpcomingEventsProps {
  events: Event[];
  employees: Employee[];
}

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ events, employees }) => {
  moment.locale('th');
  
  // กรองเหตุการณ์ที่จะเกิดขึ้นหลังจากวันปัจจุบัน และเรียงลำดับตามวันที่
  const upcomingEvents = events
    .filter(event => {
      const eventDate = moment(event.date);
      const today = moment().startOf('day');
      return eventDate.isAfter(today);
    })
    .sort((a, b) => moment(a.date).diff(moment(b.date)))
    .slice(0, 10);

  // ฟังก์ชันหาชื่อพนักงานจาก ID
  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'ไม่พบข้อมูลพนักงาน';
  };

  // ฟังก์ชันแปลงประเภทการลาเป็นภาษาไทย
  const getLeaveTypeText = (leaveType: string) => {
    const leaveTypes: { [key: string]: string } = {
      'sick': 'ลาป่วย',
      'vacation': 'ลาพักร้อน',
      'personal': 'ลากิจ',
      'maternity': 'ลาคลอด',
      'paternity': 'ลาคลอด (บิดา)',
      'annual': 'ลาพักร้อนประจำปี',
      'other': 'อื่นๆ'
    };
    return leaveTypes[leaveType] || leaveType;
  };

  // ฟังก์ชันกำหนดสีตามประเภทการลา
  const getLeaveTypeColor = (leaveType: string) => {
    const colors: { [key: string]: string } = {
      'sick': 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300',
      'vacation': 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300',
      'personal': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300',
      'maternity': 'bg-pink-100 text-pink-800 dark:bg-pink-800/30 dark:text-pink-300',
      'paternity': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-800/30 dark:text-cyan-300',
      'annual': 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300',
      'other': 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300'
    };
    return colors[leaveType] || colors['other'];
  };

  if (upcomingEvents.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          เหตุการณ์ที่จะเกิดขึ้น
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          ไม่มีเหตุการณ์ที่จะเกิดขึ้นในอนาคต
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-md font-medium text-gray-900 dark:text-white mb-4">
        เหตุการณ์ที่จะเกิดขึ้นในอนาคต
      </h2>
      <div className="space-y-3">
        {upcomingEvents.map((event, index) => (
          <div
            key={event.id}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-normal">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-normal text-gray-900 dark:text-white truncate">
                      {getEmployeeName(event.employeeId)}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-normal ${getLeaveTypeColor(event.leaveType)}`}>
                      {getLeaveTypeText(event.leaveType)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{moment(event.date).format('dddd, D MMMM YYYY')}</span>
                    <span>•</span>
                    <span>อีก {moment(event.date).fromNow()}</span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingEvents;