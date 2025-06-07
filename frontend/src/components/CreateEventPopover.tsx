
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface CreateEventPopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateEvent: () => void;
  selectedDate: Date | null;
  triggerElement: React.ReactNode;
}

export const CreateEventPopover: React.FC<CreateEventPopoverProps> = ({
  isOpen,
  onOpenChange,
  onCreateEvent,
  selectedDate,
  triggerElement
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
    onOpenChange(false);
  };

  return (
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
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
