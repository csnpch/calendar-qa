
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Textarea } from '@/components/ui/textarea';
import { Event } from '@/services/apiDatabase';
import { LEAVE_TYPE_LABELS, formatDate } from '@/lib/utils';
import moment from 'moment';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: {
    employeeId: number;
    employeeName: string;
    leaveType: string;
    date: string;
    description?: string;
  }) => void;
  selectedDate: Date | null;
  employees: { id: number; name: string }[];
  editingEvent?: Event | null;
}

const LEAVE_TYPES = Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => ({
  value,
  label
}));

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedDate,
  employees,
  editingEvent
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [leaveType, setLeaveType] = useState('');
  const [description, setDescription] = useState('');

  // Initialize form with editing event data
  useEffect(() => {
    if (editingEvent) {
      setSelectedEmployeeId(editingEvent.employeeId);
      setLeaveType(editingEvent.leaveType);
      setDescription(editingEvent.description || '');
    } else {
      setSelectedEmployeeId(null);
      setLeaveType('');
      setDescription('');
    }
  }, [editingEvent, isOpen]);

  const handleSave = () => {
    if (!selectedEmployeeId || !leaveType || !selectedDate) return;
    if (!Array.isArray(employees)) return;

    const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
    if (!selectedEmployee) return;

    onSave({
      employeeId: selectedEmployeeId,
      employeeName: selectedEmployee.name,
      leaveType,
      date: moment(selectedDate).format('YYYY-MM-DD'),
      description
    });

    // Reset form
    setSelectedEmployeeId(null);
    setLeaveType('');
    setDescription('');
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

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-xs sm:max-w-sm md:max-w-md transform transition-all max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200 dark:border-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600 dark:text-gray-200" />
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">
                {editingEvent ? 'แก้ไขเหตุการณ์' : 'สร้างเหตุการณ์ใหม่'}
              </h3>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 sm:h-8 sm:w-8 p-0">
              <X className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 sm:mt-2">
            {formatDate(selectedDate)}
          </p>
        </div>

        {/* Form */}
        <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          {/* Employee Selection */}
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="employee" className="flex items-center space-x-2 text-xs sm:text-sm">
              <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
              <span>ชื่อพนักงาน</span>
            </Label>
            <Combobox
              options={employees.map(emp => ({ value: emp.id.toString(), label: emp.name }))}
              value={selectedEmployeeId?.toString() || ''}
              onValueChange={(value) => setSelectedEmployeeId(value ? parseInt(value) : null)}
              placeholder="รายชื่อพนักงาน"
              searchPlaceholder="ค้นหาพนักงาน..."
              emptyMessage="ไม่พบพนักงาน"
              className="h-8 sm:h-9 text-xs sm:text-sm"
            />
          </div>

          {/* Event Type */}
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="leaveType" className="flex items-center space-x-2 text-xs sm:text-sm">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
              <span>ประเภทเหตุการณ์</span>
            </Label>
            <Combobox
              options={LEAVE_TYPES.map(type => ({ value: type.value, label: type.label }))}
              value={leaveType}
              onValueChange={setLeaveType}
              placeholder="เลือกประเภทเหตุการณ์"
              searchPlaceholder="ค้นหาประเภท..."
              emptyMessage="ไม่พบประเภทเหตุการณ์"
              className="h-8 sm:h-9 text-xs sm:text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="description" className="text-xs sm:text-sm">หมายเหตุ (ไม่บังคับ)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เพิ่มรายละเอียดเพิ่มเติม..."
              rows={3}
              className="text-xs sm:text-sm resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 md:p-6 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Button variant="outline" onClick={onClose} className="flex-1 text-xs sm:text-sm h-8 sm:h-9">
            ยกเลิก
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!selectedEmployeeId || !leaveType}
            className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-gray-700 dark:hover:bg-gray-800 text-white text-xs sm:text-sm h-8 sm:h-9"
          >
            {editingEvent ? 'อัพเดท' : 'บันทึก'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
