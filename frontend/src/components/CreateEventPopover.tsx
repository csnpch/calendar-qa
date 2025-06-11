
import React, { useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { createCompanyHoliday } from '@/services/companyHolidayService';
import { toast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

interface CreateEventPopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateEvent: () => void;
  onHolidayAdded?: () => void;
  selectedDate: Date | null;
  triggerElement: React.ReactNode;
}

export const CreateEventPopover: React.FC<CreateEventPopoverProps> = ({
  isOpen,
  onOpenChange,
  onCreateEvent,
  onHolidayAdded,
  selectedDate,
  triggerElement
}) => {
  const { isAdminAuthenticated } = useAuth();
  const [showHolidayDialog, setShowHolidayDialog] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDescription, setHolidayDescription] = useState('');
  const [holidayDate, setHolidayDate] = useState<Date | null>(null);

  const handleCreateEvent = () => {
    onCreateEvent();
    onOpenChange(false);
  };

  const handleAddHoliday = () => {
    console.log('Selected date for holiday:', selectedDate); // Debug log
    setHolidayDate(selectedDate); // Store the selected date
    setShowHolidayDialog(true);
    onOpenChange(false);
  };

  const formatDateForAPI = (date: Date): string => {
    // Use getFullYear, getMonth, getDate to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    console.log('Formatting date for API:', { 
      original: date, 
      year,
      month: date.getMonth() + 1,
      day: date.getDate(),
      formatted
    });
    return formatted;
  };

  const handleSaveHoliday = async () => {
    console.log('Saving holiday:', { holidayDate, holidayName: holidayName.trim() }); // Debug log
    
    if (!holidayDate) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่พบวันที่ที่เลือก",
        variant: "destructive",
      });
      return;
    }
    
    if (!holidayName.trim()) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณาใส่ชื่อวันหยุด",
        variant: "destructive",
      });
      return;
    }

    try {
      await createCompanyHoliday({
        name: holidayName.trim(),
        date: formatDateForAPI(holidayDate),
        description: holidayDescription.trim() || undefined
      });

      toast({
        title: "สำเร็จ",
        description: "เพิ่มวันหยุดบริษัทเรียบร้อยแล้ว",
      });

      setShowHolidayDialog(false);
      setHolidayName('');
      setHolidayDescription('');
      setHolidayDate(null);
      
      if (onHolidayAdded) {
        onHolidayAdded();
      }
    } catch (error) {
      console.error('Error creating holiday:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มวันหยุดบริษัทได้",
        variant: "destructive",
      });
    }
  };

  const handleCancelHoliday = () => {
    setShowHolidayDialog(false);
    setHolidayName('');
    setHolidayDescription('');
    setHolidayDate(null);
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          {triggerElement}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="center">
          <div className="p-4">
            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(selectedDate)}</p>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={handleCreateEvent}
                className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                variant="ghost"
              >
                <Plus className="w-4 h-4 mr-2" />
                สร้างเหตุการณ์ใหม่
              </Button>
              
              {isAdminAuthenticated && (
                <Button 
                  onClick={handleAddHoliday}
                  className="w-full justify-start text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
                  variant="ghost"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  เพิ่มเป็นวันหยุดบริษัท
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={showHolidayDialog} onOpenChange={setShowHolidayDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่มวันหยุดบริษัท</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              วันที่: {formatDate(holidayDate)}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="holiday-name">ชื่อวันหยุด *</Label>
              <Input
                id="holiday-name"
                placeholder="ระบุชื่อวันหยุด"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="holiday-description">หมายเหตุ</Label>
              <Input
                id="holiday-description"
                placeholder="หมายเหตุ (ไม่บังคับ)"
                value={holidayDescription}
                onChange={(e) => setHolidayDescription(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                onClick={handleCancelHoliday} 
                variant="outline"
              >
                ยกเลิก
              </Button>
              <Button 
                onClick={handleSaveHoliday}
                disabled={!holidayName.trim()}
              >
                เพิ่ม
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
