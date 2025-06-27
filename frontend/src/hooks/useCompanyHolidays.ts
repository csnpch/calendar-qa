import { useState, useEffect } from 'react';
import { fetchCompanyHolidaysByYear, type CompanyHoliday } from '@/services/companyHolidayService';

export const useCompanyHolidays = (year: number) => {
  const [holidays, setHolidays] = useState<CompanyHoliday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadHolidays = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const holidayData = await fetchCompanyHolidaysByYear(year);
      setHolidays(holidayData);
    } catch (err) {
      setError('Failed to load company holidays');
      console.error('Error loading company holidays:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, [year, refreshTrigger]);

  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const isCompanyHoliday = (date: Date): CompanyHoliday | null => {
    if (!Array.isArray(holidays)) return null;
    // Use local date components to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return holidays.find(holiday => holiday.date === dateString) || null;
  };

  return {
    holidays,
    loading,
    error,
    isCompanyHoliday,
    refresh
  };
};