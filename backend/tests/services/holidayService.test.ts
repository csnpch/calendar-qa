import { HolidayService } from '../../src/services/holidayService';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('HolidayService', () => {
  let holidayService: HolidayService;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    holidayService = new HolidayService();
    jest.clearAllMocks();
    // Suppress console.error during tests
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('fetchThaiHolidays', () => {
    it('should fetch holidays from API successfully', async () => {
      const mockApiResponse = [
        {
          date: '2025-01-01',
          localName: 'วันขึ้นปีใหม่',
          name: 'New Year\'s Day',
          countryCode: 'TH',
          fixed: true,
          global: true,
          counties: null,
          launchYear: null,
          types: ['Public']
        },
        {
          date: '2025-04-13',
          localName: 'วันสงกรานต์',
          name: 'Songkran Festival',
          countryCode: 'TH',
          fixed: false,
          global: true,
          counties: null,
          launchYear: null,
          types: ['Public']
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      } as any);

      const holidays = await holidayService.fetchThaiHolidays(2025);

      expect(mockFetch).toHaveBeenCalledWith('https://date.nager.at/api/v3/PublicHolidays/2025/TH');
      expect(holidays).toHaveLength(2);
      expect(holidays[0]!).toEqual({
        date: '2025-01-01',
        name: 'วันขึ้นปีใหม่',
        type: 'public'
      });
      expect(holidays[1]).toEqual({
        date: '2025-04-13',
        name: 'วันสงกรานต์',
        type: 'public'
      });
    });

    it('should use local name when available', async () => {
      const mockApiResponse = [
        {
          date: '2025-01-01',
          localName: 'วันขึ้นปีใหม่',
          name: 'New Year\'s Day',
          countryCode: 'TH',
          fixed: true,
          global: true,
          counties: null,
          launchYear: null,
          types: ['Public']
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      } as any);

      const holidays = await holidayService.fetchThaiHolidays(2025);

      expect(holidays[0]!.name).toBe('วันขึ้นปีใหม่');
    });

    it('should fall back to english name when local name is not available', async () => {
      const mockApiResponse = [
        {
          date: '2025-01-01',
          localName: '',
          name: 'New Year\'s Day',
          countryCode: 'TH',
          fixed: true,
          global: true,
          counties: null,
          launchYear: null,
          types: ['Public']
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      } as any);

      const holidays = await holidayService.fetchThaiHolidays(2025);

      expect(holidays[0]!.name).toBe('New Year\'s Day');
    });

    it('should handle religious holidays', async () => {
      const mockApiResponse = [
        {
          date: '2025-05-12',
          localName: 'วิสาขบูชา',
          name: 'Vesak Day',
          countryCode: 'TH',
          fixed: false,
          global: true,
          counties: null,
          launchYear: null,
          types: ['Religious']
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      } as any);

      const holidays = await holidayService.fetchThaiHolidays(2025);

      expect(holidays[0]!.type).toBe('religious');
    });

    it('should return default holidays when API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const holidays = await holidayService.fetchThaiHolidays(2025);

      expect(holidays).toHaveLength(8); // Default holidays count
      expect(holidays[0]!).toEqual({
        date: '2025-01-01',
        name: 'วันขึ้นปีใหม่',
        type: 'public'
      });
      expect(holidays.some(h => h.date === '2025-04-13')).toBe(true);
      expect(holidays.some(h => h.date === '2025-12-31')).toBe(true);
    });

    it('should return default holidays when API returns non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const holidays = await holidayService.fetchThaiHolidays(2025);

      expect(holidays).toHaveLength(8);
      expect(holidays[0]!.date).toBe('2025-01-01');
    });
  });

  describe('getHolidaysForDateRange', () => {
    it('should return holidays within date range for same year', async () => {
      const mockApiResponse = [
        {
          date: '2025-01-01',
          localName: 'วันขึ้นปีใหม่',
          name: 'New Year\'s Day',
          countryCode: 'TH',
          fixed: true,
          global: true,
          counties: null,
          launchYear: null,
          types: ['Public']
        },
        {
          date: '2025-04-13',
          localName: 'วันสงกรานต์',
          name: 'Songkran Festival',
          countryCode: 'TH',
          fixed: false,
          global: true,
          counties: null,
          launchYear: null,
          types: ['Public']
        },
        {
          date: '2025-12-31',
          localName: 'วันสิ้นปี',
          name: 'New Year\'s Eve',
          countryCode: 'TH',
          fixed: true,
          global: true,
          counties: null,
          launchYear: null,
          types: ['Public']
        }
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      });

      const holidays = await holidayService.getHolidaysForDateRange('2025-04-01', '2025-05-01');

      expect(holidays).toHaveLength(1);
      expect(holidays[0]!.date).toBe('2025-04-13');
    });

    it('should handle date range spanning multiple years', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            {
              date: '2024-12-31',
              localName: 'วันสิ้นปี',
              name: 'New Year\'s Eve',
              countryCode: 'TH',
              fixed: true,
              global: true,
              counties: null,
              launchYear: null,
              types: ['Public']
            }
          ],
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            {
              date: '2025-01-01',
              localName: 'วันขึ้นปีใหม่',
              name: 'New Year\'s Day',
              countryCode: 'TH',
              fixed: true,
              global: true,
              counties: null,
              launchYear: null,
              types: ['Public']
            }
          ],
        } as any);

      const holidays = await holidayService.getHolidaysForDateRange('2024-12-01', '2025-01-31');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(1, 'https://date.nager.at/api/v3/PublicHolidays/2024/TH');
      expect(mockFetch).toHaveBeenNthCalledWith(2, 'https://date.nager.at/api/v3/PublicHolidays/2025/TH');
      expect(holidays).toHaveLength(2);
      expect(holidays.some(h => h.date === '2024-12-31')).toBe(true);
      expect(holidays.some(h => h.date === '2025-01-01')).toBe(true);
    });
  });

  describe('isHoliday', () => {
    it('should return true for holiday date', async () => {
      const mockApiResponse = [
        {
          date: '2025-01-01',
          localName: 'วันขึ้นปีใหม่',
          name: 'New Year\'s Day',
          countryCode: 'TH',
          fixed: true,
          global: true,
          counties: null,
          launchYear: null,
          types: ['Public']
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      } as any);

      const result = await holidayService.isHoliday('2025-01-01');

      expect(result).toBe(true);
    });

    it('should return false for non-holiday date', async () => {
      const mockApiResponse = [
        {
          date: '2025-01-01',
          localName: 'วันขึ้นปีใหม่',
          name: 'New Year\'s Day',
          countryCode: 'TH',
          fixed: true,
          global: true,
          counties: null,
          launchYear: null,
          types: ['Public']
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      } as any);

      const result = await holidayService.isHoliday('2025-01-02');

      expect(result).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await holidayService.isHoliday('2025-01-01');

      // Should check against default holidays
      expect(result).toBe(true); // 2025-01-01 is in default holidays
    });
  });
});