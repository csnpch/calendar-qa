import type { Holiday } from '../types';
import { prisma } from '../database/prisma';

interface NagerDateApiResponse {
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

interface CalendarificApiResponse {
  meta: {
    code: number;
    error_type?: string;
    error_detail?: string;
  };
  response: {
    holidays: Array<{
      name: string;
      description: string;
      country: {
        id: string;
        name: string;
      };
      date: {
        iso: string;
        datetime: {
          year: number;
          month: number;
          day: number;
        };
      };
      type: string[];
      primary_type: string;
      canonical_url: string;
      urlid: string;
      locations: string;
      states: string;
    }>;
  };
}

export class HolidayService {
  async fetchThaiHolidays(year: number): Promise<Holiday[]> {
    try {
      // First, try to get holidays from database cache
      const cachedHolidays = await this.getHolidaysFromDatabase(year);
      
      // Try to fetch fresh data from API
      console.log(`Trying Calendarific API for Thailand holidays ${year}`);
      const response = await fetch(
        `https://calendarific.com/api/v2/holidays?api_key=h7EPXfb9fLSkyeNUwai6DVfCbgaub1Re&country=TH&year=${year}`
      );
      
      if (!response.ok) {
        console.warn(`Calendarific API returned ${response.status}: ${response.statusText}`);
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json() as CalendarificApiResponse;
      
      if (data.meta.code !== 200 || data.meta.error_type) {
        console.warn(`Calendarific API error: ${data.meta.error_type} - ${data.meta.error_detail}`);
        throw new Error(`API error: ${data.meta.error_type}`);
      }
      
      if (!data.response.holidays || data.response.holidays.length === 0) {
        console.warn('Calendarific API returned no holidays');
        throw new Error('No holidays returned');
      }
      
      // Filter for actual holidays (not just observances)
      const relevantHolidays = data.response.holidays.filter(holiday => 
        holiday.primary_type === 'National holiday' || 
        holiday.primary_type === 'Public holiday' ||
        holiday.primary_type === 'Buddhist holiday' ||
        holiday.primary_type === 'Religious holiday'
      );
      
      const holidays = relevantHolidays.map(holiday => ({
        date: holiday.date.iso,
        name: holiday.name,
        type: holiday.primary_type.toLowerCase().includes('national') || 
              holiday.primary_type.toLowerCase().includes('public') ? 'public' as const : 'religious' as const
      }));
      
      console.log(`Successfully fetched ${holidays.length} holidays from Calendarific API`);
      
      // Save to database for caching
      await this.saveHolidaysToDatabase(holidays, year, 'api');
      
      return holidays;
      
    } catch (error) {
      console.error('Error fetching from Calendarific API:', error);
      
      // Try to get from database cache first
      const cachedHolidays = await this.getHolidaysFromDatabase(year);
      if (cachedHolidays.length > 0) {
        console.log(`Using ${cachedHolidays.length} cached holidays from database for ${year}`);
        return cachedHolidays;
      }
      
      // Final fallback to comprehensive default holidays
      console.warn('No cached data available, using comprehensive default holidays');
      const defaultHolidays = this.getDefaultThaiHolidays(year);
      
      // Save fallback holidays to database for future use
      await this.saveHolidaysToDatabase(defaultHolidays, year, 'fallback');
      
      return defaultHolidays;
    }
  }

  private async getHolidaysFromDatabase(year: number): Promise<Holiday[]> {
    try {
      const holidaysFromDb = await prisma.thaiHoliday.findMany({
        where: { year },
        orderBy: { date: 'asc' }
      });
      
      return holidaysFromDb.map(holiday => ({
        date: holiday.date,
        name: holiday.name,
        type: holiday.type as 'public' | 'religious' | 'substitution'
      }));
    } catch (error) {
      console.error('Error getting holidays from database:', error);
      return [];
    }
  }

  private async saveHolidaysToDatabase(holidays: Holiday[], year: number, source: string): Promise<void> {
    try {
      // Delete existing holidays for this year
      await prisma.thaiHoliday.deleteMany({
        where: { year }
      });
      
      // Insert new holidays
      await prisma.thaiHoliday.createMany({
        data: holidays.map(holiday => ({
          name: holiday.name,
          date: holiday.date,
          type: holiday.type,
          year,
          source
        }))
      });
      
      console.log(`Saved ${holidays.length} holidays to database for year ${year} (source: ${source})`);
    } catch (error) {
      console.error('Error saving holidays to database:', error);
    }
  }

  private getDefaultThaiHolidays(year: number): Holiday[] {
    const holidays: Holiday[] = [
      // Fixed public holidays
      { date: `${year}-01-01`, name: 'วันขึ้นปีใหม่', type: 'public' },
      { date: `${year}-02-26`, name: 'วันมาฆบูชา', type: 'religious' },
      { date: `${year}-04-06`, name: 'วันจักรี', type: 'public' },
      { date: `${year}-04-13`, name: 'วันสงกรานต์', type: 'public' },
      { date: `${year}-04-14`, name: 'วันสงกรานต์', type: 'public' },
      { date: `${year}-04-15`, name: 'วันสงกรานต์', type: 'public' },
      { date: `${year}-05-01`, name: 'วันแรงงานแห่งชาติ', type: 'public' },
      { date: `${year}-05-04`, name: 'วันฉัตรมงคล', type: 'public' },
      { date: `${year}-05-22`, name: 'วันวิสาขบูชา', type: 'religious' },
      { date: `${year}-06-03`, name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าสุทิดา', type: 'public' },
      { date: `${year}-07-20`, name: 'วันอาสาฬหบูชา', type: 'religious' },
      { date: `${year}-07-21`, name: 'วันเข้าพรรษา', type: 'religious' },
      { date: `${year}-07-28`, name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว', type: 'public' },
      { date: `${year}-08-12`, name: 'วันแม่แห่งชาติ', type: 'public' },
      { date: `${year}-10-13`, name: 'วันคล้ายวันสวรรคตพระบาทสมเด็จพระบรมชนกาธิเบศร มหาภูมิพลอดุลยเดชมหาราช วันที่ ๑๓ ตุลาคม', type: 'public' },
      { date: `${year}-10-23`, name: 'วันปิยมหาราช', type: 'public' },
      { date: `${year}-12-05`, name: 'วันพ่อแห่งชาติ', type: 'public' },
      { date: `${year}-12-10`, name: 'วันรัฐธรรมนูญ', type: 'public' },
      { date: `${year}-12-31`, name: 'วันสิ้นปี', type: 'public' }
    ];

    // Add year-specific adjustments
    if (year === 2024) {
      holidays.push(
        { date: `${year}-07-22`, name: 'วันหยุดชดเชยวันเข้าพรรษา', type: 'public' },
        { date: `${year}-12-30`, name: 'วันหยุดชดเชยวันสิ้นปี', type: 'public' }
      );
    }

    if (year === 2025) {
      holidays.push(
        { date: `${year}-01-02`, name: 'วันหยุดชดเชยวันขึ้นปีใหม่', type: 'public' },
        { date: `${year}-04-16`, name: 'วันหยุดชดเชยวันสงกรานต์', type: 'public' },
        { date: `${year}-05-02`, name: 'วันหยุดชดเชยวันแรงงานแห่งชาติ', type: 'public' },
        { date: `${year}-05-05`, name: 'วันหยุดชดเชยวันฉัตรมงคล', type: 'public' },
        { date: `${year}-10-14`, name: 'วันหยุดชดเชยวันคล้ายวันสวรรคตฯ', type: 'public' }
      );
    }

    return holidays.sort((a, b) => a.date.localeCompare(b.date));
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