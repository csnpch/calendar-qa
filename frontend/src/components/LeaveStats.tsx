
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Event } from '@/services/apiDatabase';
import { BarChart3, TrendingUp } from 'lucide-react';
import { LEAVE_TYPE_LABELS } from '@/lib/utils';

interface LeaveStatsProps {
  events: Event[];
  currentDate: Date;
}

const LEAVE_TYPE_COLORS = {
  'vacation': 'bg-blue-500',
  'personal': 'bg-green-500',
  'sick': 'bg-red-500',
  'other': 'bg-purple-500'
};

export const LeaveStats: React.FC<LeaveStatsProps> = ({ events, currentDate }) => {
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const currentMonthEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
  });

  const getLeaveTypeStats = () => {
    const stats = {
      vacation: 0,
      personal: 0,
      sick: 0,
      other: 0
    };

    currentMonthEvents.forEach(event => {
      if (event.leaveType in stats) {
        stats[event.leaveType as keyof typeof stats]++;
      }
    });

    return stats;
  };

  const stats = getLeaveTypeStats();
  const totalLeaves = Object.values(stats).reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-3 sm:p-4 md:p-6">
      <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4 md:mb-6">
        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600 dark:text-gray-400" />
        <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">สถิติเหตุการณ์ประจำเดือน</h3>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900/30 dark:to-gray-700/30 rounded-lg border border-blue-100 dark:border-gray-700">
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 dark:text-gray-400">{totalLeaves}</div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">เหตุการณ์รวม</div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {Object.entries(stats).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-600 border border-gray-100 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${LEAVE_TYPE_COLORS[type as keyof typeof LEAVE_TYPE_COLORS]}`} />
                <span className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-200 font-medium">
                  {LEAVE_TYPE_LABELS[type as keyof typeof LEAVE_TYPE_LABELS]}
                </span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{count}</span>
            </div>
          ))}
        </div>

        {totalLeaves > 0 && (
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg border border-green-100 dark:border-green-700">
            <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">สถิติของเดือนนี้</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
