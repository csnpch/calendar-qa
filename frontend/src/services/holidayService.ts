
import { apiClient } from './api';
import axios from 'axios';

interface ThaiHoliday {
  date: string;
  name: string;
  type: 'public' | 'religious' | 'substitution';
}

// Commented out translation function - keeping for future use
// const translateToThai = async (englishName: string): Promise<string> => {
//   try {
//     // Use Google Translate via axios
//     const response = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=th&dt=t&q=${encodeURIComponent(englishName)}`);
//     
//     const translated = response.data[0][0][0];
//     
//     console.log(`✅ Translated: "${englishName}" -> "${translated}"`);
//     return translated || englishName;
//     
//   } catch (error) {
//     console.warn('Translation failed for:', englishName, error);
//     return englishName;
//   }
// };

export const fetchThaiHolidays = async (year: number): Promise<ThaiHoliday[]> => {
  try {
    const holidays = await apiClient.get<ThaiHoliday[]>(`/holidays/${year}`);
    
    // Return holidays without translation
    return holidays;
    
    // Commented out translation logic - keeping for future use
    // const translatedHolidays = await Promise.all(
    //   holidays.map(async (holiday) => {
    //     // Check if the name is already in Thai (contains Thai characters)
    //     const isAlreadyThai = /[\u0E00-\u0E7F]/.test(holiday.name);
    //     
    //     if (isAlreadyThai) {
    //       return holiday;
    //     }
    //     
    //     // Translate English name to Thai
    //     const translatedName = await translateToThai(holiday.name);
    //     return {
    //       ...holiday,
    //       name: translatedName
    //     };
    //   })
    // );
    // 
    // return translatedHolidays;
  } catch (error) {
    console.error('Error fetching Thai holidays from API:', error);
    // Fallback to basic Thai holidays (limited compared to backend comprehensive list)
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
};

export const getHolidaysForDateRange = async (startDate: string, endDate: string): Promise<ThaiHoliday[]> => {
  try {
    return await apiClient.get<ThaiHoliday[]>(`/holidays/range/${startDate}/${endDate}`);
  } catch (error) {
    console.error('Error fetching holidays for date range:', error);
    return [];
  }
};

export const isHoliday = async (date: string): Promise<boolean> => {
  try {
    const result = await apiClient.get<{ date: string; isHoliday: boolean }>(`/holidays/check/${date}`);
    return result.isHoliday;
  } catch (error) {
    console.error('Error checking if date is holiday:', error);
    return false;
  }
};
