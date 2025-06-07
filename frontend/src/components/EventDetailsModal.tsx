
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, User, FileText, Clock, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Event } from '@/services/apiDatabase';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEvent: () => void;
  onEditEvent?: (event: Event) => void;
  onDeleteEvent?: (eventId: number) => void;
  events: Event[];
  selectedDate: Date | null;
}

const LEAVE_TYPE_LABELS = {
  'vacation': 'ลาพักร้อน',
  'personal': 'ลากิจ',
  'sick': 'ลาป่วย',
  'absent': 'ขาดงาน',
  'maternity': 'ลาคลอด',
  'paternity': 'ลาบิดา',
  'bereavement': 'ลาฌาปนกิจ',
  'study': 'ลาศึกษา',
  'military': 'ลาทหาร',
  'sabbatical': 'ลาพักผ่อนพิเศษ',
  'unpaid': 'ลาไม่ได้รับเงินเดือน',
  'compensatory': 'ลาชดเชย',
  'other': 'อื่นๆ'
};

const LEAVE_TYPE_COLORS = {
  'vacation': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
  'personal': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
  'sick': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
  'absent': 'bg-red-200 text-red-900 border-red-300 dark:bg-red-800 dark:text-red-100 dark:border-red-600',
  'maternity': 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-700',
  'paternity': 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-200 dark:border-cyan-700',
  'bereavement': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600',
  'study': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',
  'military': 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900 dark:text-teal-200 dark:border-teal-700',
  'sabbatical': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-700',
  'unpaid': 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600',
  'compensatory': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700',
  'other': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700'
};

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  onClose,
  onCreateEvent,
  onEditEvent,
  onDeleteEvent,
  events,
  selectedDate
}) => {
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const handleCreateEvent = () => {
    onCreateEvent();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen || !selectedDate) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-600 rounded-xl shadow-2xl w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg transform transition-all max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200 dark:border-gray-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-500 dark:to-gray-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">เหตุการณ์ในวันนี้</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 sm:h-8 sm:w-8 p-0">
              <X className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 sm:mt-2">
            {formatDate(selectedDate)}
          </p>
        </div>

        {/* Events List */}
        <div className="p-3 sm:p-4 md:p-6 max-h-60 sm:max-h-80 overflow-y-auto">
          {events.length > 0 ? (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border transition-all hover:shadow-sm ${LEAVE_TYPE_COLORS[event.leaveType as keyof typeof LEAVE_TYPE_COLORS] || LEAVE_TYPE_COLORS.other}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{event.employeeName}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-1">
                        <FileText className="w-3 h-3 flex-shrink-0" />
                        <span className="text-xs">{LEAVE_TYPE_LABELS[event.leaveType as keyof typeof LEAVE_TYPE_LABELS]}</span>
                      </div>

                      {event.description && (
                        <div className="flex items-start space-x-2">
                          <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{event.description}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-1 ml-2">
                      {onEditEvent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditEvent(event)}
                          className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      )}
                      {onDeleteEvent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteEvent(event.id)}
                          className="h-7 w-7 p-0 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 sm:py-6 md:py-8 text-gray-500 dark:text-gray-400">
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto mb-2 sm:mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-xs sm:text-sm md:text-base">ไม่มีเหตุการณ์ในวันนี้</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 md:p-6 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Button 
            onClick={handleCreateEvent}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-xs sm:text-sm h-8 sm:h-9"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            สร้างเหตุการณ์ใหม่
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full text-xs sm:text-sm h-8 sm:h-9">
            ปิด
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
