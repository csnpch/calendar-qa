import React from 'react';

const LEAVE_TYPE_COLORS = {
  'vacation': 'bg-sky-100 dark:bg-sky-800/40 text-sky-800 dark:text-sky-200 border-sky-200 dark:border-sky-600',
  'personal': 'bg-green-100 dark:bg-green-800/40 text-green-800 dark:text-green-200 border-green-200 dark:border-green-600',
  'sick': 'bg-red-100 dark:bg-red-800/40 text-red-800 dark:text-red-200 border-red-200 dark:border-red-600',
  'absent': 'bg-red-100 dark:bg-red-800/40 text-red-800 dark:text-red-200 border-red-200 dark:border-red-600',
  'maternity': 'bg-pink-100 dark:bg-pink-800/40 text-pink-800 dark:text-pink-200 border-pink-200 dark:border-pink-600',
  'bereavement': 'bg-stone-100 dark:bg-stone-800/40 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-600',
  'study': 'bg-orange-100 dark:bg-orange-800/40 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-600',
  'military': 'bg-teal-100 dark:bg-teal-800/40 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-600',
  'sabbatical': 'bg-indigo-100 dark:bg-indigo-800/40 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-600',
  'unpaid': 'bg-neutral-100 dark:bg-neutral-800/40 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-600',
  'compensatory': 'bg-emerald-100 dark:bg-emerald-800/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-600',
  'other': 'bg-purple-100 dark:bg-purple-800/40 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-600'
};

const LEAVE_TYPE_LABELS = {
  'vacation': 'ลาพักร้อน',
  'personal': 'ลากิจ',
  'sick': 'ลาป่วย',
  'absent': 'ขาดงาน',
  'maternity': 'ลาคลอด',
  'bereavement': 'ลาฌาปนกิจ',
  'study': 'ลาศึกษา',
  'military': 'ลาทหาร',
  'sabbatical': 'ลาพักผ่อนพิเศษ',
  'unpaid': 'ลาไม่ได้รับเงินเดือน',
  'compensatory': 'ลาชดเชย',
  'other': 'อื่นๆ'
};

export const EventTypeLegend: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">ประเภทการลา</h3>
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