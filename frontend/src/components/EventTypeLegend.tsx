import React from 'react';
import { LEAVE_TYPE_COLORS, LEAVE_TYPE_LABELS } from '@/lib/utils';

export const EventTypeLegend: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">ประเภทการลา</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {Object.entries(LEAVE_TYPE_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded border ${LEAVE_TYPE_COLORS[type as keyof typeof LEAVE_TYPE_COLORS]}`}
            />
            <span className="text-xs text-gray-700 dark:text-gray-300">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};