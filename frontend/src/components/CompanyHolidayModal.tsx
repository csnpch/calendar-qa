import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';

interface CompanyHolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (holiday: {
    name: string;
    date: string;
    description?: string;
  }) => void;
  selectedDate: Date | null;
  editingHoliday?: { id: number; name: string; description?: string } | null;
}

export const CompanyHolidayModal: React.FC<CompanyHolidayModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedDate,
  editingHoliday
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingHoliday) {
        setName(editingHoliday.name);
        setDescription(editingHoliday.description || '');
      } else {
        setName('');
        setDescription('');
      }
    }
  }, [isOpen, editingHoliday]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !selectedDate) return;

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    onSave({
      name: name.trim(),
      date: dateString,
      description: description.trim() || undefined
    });

    setName('');
    setDescription('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-2 sm:p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-xs sm:max-w-sm md:max-w-md transform transition-all max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200 dark:border-gray-600 bg-gradient-to-r from-red-50 to-pink-50 dark:from-gray-700 dark:to-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-600 dark:text-gray-200" />
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-normal text-gray-900 dark:text-white">
                {editingHoliday ? 'แก้ไขวันหยุดบริษัท' : 'เพิ่มวันหยุดบริษัท'}
              </h3>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-7 w-7 sm:h-8 sm:w-8 p-0">
              <X className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 sm:mt-2">
            {formatDate(selectedDate)}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
          <div>
            <Label htmlFor="holiday-name" className="text-xs sm:text-sm font-normal text-gray-700 dark:text-gray-300">
              ชื่อวันหยุด *
            </Label>
            <Input
              id="holiday-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น วันหยุดประจำปี, วันหยุดพิเศษ"
              className="mt-1 text-xs sm:text-sm"
              required
            />
          </div>

          <div>
            <Label htmlFor="holiday-description" className="text-xs sm:text-sm font-normal text-gray-700 dark:text-gray-300">
              รายละเอียด
            </Label>
            <Textarea
              id="holiday-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
              className="mt-1 text-xs sm:text-sm"
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2 sm:pt-4">
            <Button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white text-xs sm:text-sm h-8 sm:h-9"
              disabled={!name.trim()}
            >
              {editingHoliday ? 'บันทึกการแก้ไข' : 'สร้างวันหยุด'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="w-full text-xs sm:text-sm h-8 sm:h-9"
            >
              ยกเลิก
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};