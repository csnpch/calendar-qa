
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Calendar, FileText, CalendarDays } from 'lucide-react';
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
    startDate: string;
    endDate: string;
    description?: string;
  }) => void;
  selectedDate: Date | null;
  selectedDateRange?: Date[];
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
  selectedDateRange,
  employees,
  editingEvent
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [leaveType, setLeaveType] = useState('');
  const [description, setDescription] = useState('');
  
  // Date range states
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [useCustomDates, setUseCustomDates] = useState(false);

  // Initialize form with editing event data
  useEffect(() => {
    if (editingEvent) {
      setSelectedEmployeeId(editingEvent.employeeId);
      setLeaveType(editingEvent.leaveType);
      setDescription(editingEvent.description || '');
      setUseCustomDates(false);
    } else {
      setSelectedEmployeeId(null);
      setLeaveType('');
      setDescription('');
      
      // Initialize custom dates if we have a date range
      if (selectedDateRange && selectedDateRange.length > 1) {
        setCustomStartDate(moment(selectedDateRange[0]).format('YYYY-MM-DD'));
        setCustomEndDate(moment(selectedDateRange[selectedDateRange.length - 1]).format('YYYY-MM-DD'));
        setUseCustomDates(true); // Always show date inputs for multi-day events
      } else {
        setCustomStartDate('');
        setCustomEndDate('');
        setUseCustomDates(false);
      }
    }
  }, [editingEvent, isOpen, selectedDateRange]);

  const generateDateRange = (startDate: string, endDate: string): Date[] => {
    const dates = [];
    let current = moment(startDate);
    const end = moment(endDate);
    
    while (current.isSameOrBefore(end)) {
      dates.push(current.toDate());
      current = current.clone().add(1, 'day');
    }
    
    return dates;
  };

  const handleSave = () => {
    if (!selectedEmployeeId || !leaveType) return;
    if (!Array.isArray(employees)) return;
    
    // Validate custom dates if they're being used
    if (useCustomDates && (!customStartDate || !customEndDate)) {
      alert('กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด');
      return;
    }
    
    // Validate that we have either selectedDate or custom dates
    if (!selectedDate && (!useCustomDates || !customStartDate)) return;

    const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
    if (!selectedEmployee) return;

    let startDate: string;
    let endDate: string;

    // Determine start and end dates
    if (useCustomDates && customStartDate && customEndDate) {
      // Use custom date range
      startDate = customStartDate;
      endDate = customEndDate;
    } else if (selectedDateRange && selectedDateRange.length > 1) {
      // Use original selected date range
      startDate = moment(selectedDateRange[0]).format('YYYY-MM-DD');
      endDate = moment(selectedDateRange[selectedDateRange.length - 1]).format('YYYY-MM-DD');
    } else if (selectedDate) {
      // Single date event
      startDate = moment(selectedDate).format('YYYY-MM-DD');
      endDate = moment(selectedDate).format('YYYY-MM-DD');
    } else {
      return; // No valid dates
    }

    // Auto-generate description for multi-day events
    let finalDescription = description;
    
    // If it's a multi-day event (different start and end dates), add date range info to description
    if (startDate !== endDate) {
      const startFormatted = moment(startDate).format('DD/MM/YYYY');
      const endFormatted = moment(endDate).format('DD/MM/YYYY');
      const dateRangeInfo = `ช่วงวันที่: ${startFormatted} - ${endFormatted}`;
      
      if (description.trim()) {
        finalDescription = `${dateRangeInfo} - ${description}`;
      } else {
        finalDescription = dateRangeInfo;
      }
    }

    // Create a single multi-day event
    onSave({
      employeeId: selectedEmployeeId,
      employeeName: selectedEmployee.name,
      leaveType,
      startDate,
      endDate,
      description: finalDescription
    });

    // Reset form
    setSelectedEmployeeId(null);
    setLeaveType('');
    setDescription('');
    setCustomStartDate('');
    setCustomEndDate('');
    setUseCustomDates(false);
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
            {selectedDateRange && selectedDateRange.length > 1 
              ? `${formatDate(selectedDateRange[0])} - ${formatDate(selectedDateRange[selectedDateRange.length - 1])} (${selectedDateRange.length} วัน)`
              : formatDate(selectedDate)
            }
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

          {/* Date Range Section - Only show for multi-day events */}
          {(selectedDateRange && selectedDateRange.length > 1) && (
            <div className="space-y-2 sm:space-y-3 p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center space-x-2">
                <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <Label className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">
                  ช่วงวันที่เหตุการณ์ ({selectedDateRange.length} วัน)
                </Label>
              </div>
              
              <div className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                เริ่มต้น: {formatDate(selectedDateRange[0])} - สิ้นสุด: {formatDate(selectedDateRange[selectedDateRange.length - 1])}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-600 dark:text-gray-400">วันเริ่มต้น</Label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="text-xs sm:text-sm h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 dark:text-gray-400">วันสิ้นสุด</Label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    min={customStartDate}
                    className="text-xs sm:text-sm h-8"
                  />
                </div>
              </div>
            </div>
          )}

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
