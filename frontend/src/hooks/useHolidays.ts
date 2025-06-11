
import { useState, useEffect } from 'react';
import { fetchThaiHolidays } from '@/services/holidayService';

interface ThaiHoliday {
  date: string;
  name: string;
  type: 'public' | 'religious' | 'substitution';
}

export const useHolidays = (year: number) => {
  const [holidays, setHolidays] = useState<ThaiHoliday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHolidays = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const holidayData = await fetchThaiHolidays(year);
        setHolidays(holidayData);
      } catch (err) {
        setError('Failed to load holidays');
        console.error('Error loading holidays:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHolidays();
  }, [year]);

  const isHoliday = (date: Date): ThaiHoliday | null => {
    const dateString = date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0');
    return holidays.find(holiday => holiday.date === dateString) || null;
  };

  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  };

  return {
    holidays,
    loading,
    error,
    isHoliday,
    isWeekend
  };
};
