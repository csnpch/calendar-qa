import { Elysia, t } from 'elysia';
import { HolidayService } from '../services/holidayService';

const holidayService = new HolidayService();

export const holidaysRoutes = new Elysia({ prefix: '/holidays' })
  .get('/:year', async ({ params: { year } }) => {
    return await holidayService.fetchThaiHolidays(Number(year));
  }, {
    params: t.Object({
      year: t.String()
    })
  })
  
  .get('/range/:startDate/:endDate', async ({ params: { startDate, endDate } }) => {
    return await holidayService.getHolidaysForDateRange(startDate, endDate);
  }, {
    params: t.Object({
      startDate: t.String(),
      endDate: t.String()
    })
  })
  
  .get('/check/:date', async ({ params: { date } }) => {
    const isHoliday = await holidayService.isHoliday(date);
    return { date, isHoliday };
  }, {
    params: t.Object({
      date: t.String()
    })
  });