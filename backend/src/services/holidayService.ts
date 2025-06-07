import type { Holiday } from '../types';

interface ThaiHolidayApiResponse {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

export class HolidayService {
  async fetchThaiHolidays(year: number): Promise<Holiday[]> {
    try {
      const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/TH`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch holidays');
      }
      
      const holidays = await response.json() as ThaiHolidayApiResponse[] | null;
      
      // Check if the response is null or not an array
      if (!holidays || !Array.isArray(holidays)) {
        console.warn('API returned null or invalid data, using fallback holidays');
        return this.getDefaultThaiHolidays(year);
      }
      
      return holidays.map(holiday => ({
        date: holiday.date,
        name: holiday.localName || holiday.name,
        type: holiday.types.includes('Public') ? 'public' as const : 'religious' as const
      }));
    } catch (error) {
      console.error('Error fetching Thai holidays:', error);
      
      // Fallback to basic Thai holidays
      return this.getDefaultThaiHolidays(year);
    }
  }

  private getDefaultThaiHolidays(year: number): Holiday[] {
    return [
      { date: `${year}-01-01`, name: 'วันขึ้นปีใหม่', type: 'public' },
      { date: `${year}-04-13`, name: 'วันสงกรานต์', type: 'public' },
      { date: `${year}-04-14`, name: 'วันสงกรานต์', type: 'public' },
      { date: `${year}-04-15`, name: 'วันสงกรานต์', type: 'public' },
      { date: `${year}-05-01`, name: 'วันแรงงานแห่งชาติ', type: 'public' },
      { date: `${year}-12-05`, name: 'วันพ่อแห่งชาติ', type: 'public' },
      { date: `${year}-12-10`, name: 'วันรัฐธรรมนูญ', type: 'public' },
      { date: `${year}-12-31`, name: 'วันสิ้นปี', type: 'public' }
    ];
  }

  async getHolidaysForDateRange(startDate: string, endDate: string): Promise<Holiday[]> {
    const startYear = new Date(startDate).getFullYear();
    const endYear = new Date(endDate).getFullYear();
    
    const allHolidays: Holiday[] = [];
    
    for (let year = startYear; year <= endYear; year++) {
      const yearHolidays = await this.fetchThaiHolidays(year);
      allHolidays.push(...yearHolidays);
    }
    
    return allHolidays.filter(holiday => 
      holiday.date >= startDate && holiday.date <= endDate
    );
  }

  async isHoliday(date: string): Promise<boolean> {
    const year = new Date(date).getFullYear();
    const holidays = await this.fetchThaiHolidays(year);
    
    return holidays.some(holiday => holiday.date === date);
  }
}