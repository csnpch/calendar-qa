import { Elysia, t } from 'elysia';
import { CompanyHolidayService } from '../services/companyHolidayService';

const companyHolidayService = new CompanyHolidayService();

export const companyHolidaysRoutes = new Elysia({ prefix: '/company-holidays' })
  .get('/', async () => {
    return await companyHolidayService.getAllCompanyHolidays();
  })

  .get('/:year', async ({ params: { year } }) => {
    return await companyHolidayService.getCompanyHolidaysByYear(Number(year));
  }, {
    params: t.Object({
      year: t.String()
    })
  })

  .get('/holiday/:id', async ({ params: { id } }) => {
    const holiday = await companyHolidayService.getCompanyHolidayById(Number(id));
    if (!holiday) {
      throw new Error('Company holiday not found');
    }
    return holiday;
  }, {
    params: t.Object({
      id: t.String()
    })
  })

  .post('/', async ({ body }) => {
    return await companyHolidayService.createCompanyHoliday(body);
  }, {
    body: t.Object({
      name: t.String(),
      date: t.String(),
      description: t.Optional(t.String())
    })
  })

  .post('/bulk', async ({ body }) => {
    return await companyHolidayService.createMultipleCompanyHolidays(body.holidays);
  }, {
    body: t.Object({
      holidays: t.Array(t.Object({
        name: t.String(),
        date: t.String(),
        description: t.Optional(t.String())
      }))
    })
  })

  .put('/:id', async ({ params: { id }, body }) => {
    return await companyHolidayService.updateCompanyHoliday(Number(id), body);
  }, {
    params: t.Object({
      id: t.String()
    }),
    body: t.Object({
      name: t.Optional(t.String()),
      date: t.Optional(t.String()),
      description: t.Optional(t.String())
    })
  })

  .delete('/:id', async ({ params: { id } }) => {
    return await companyHolidayService.deleteCompanyHoliday(Number(id));
  }, {
    params: t.Object({
      id: t.String()
    })
  })

  .get('/range/:startDate/:endDate', async ({ params: { startDate, endDate } }) => {
    return await companyHolidayService.getCompanyHolidaysForDateRange(startDate, endDate);
  }, {
    params: t.Object({
      startDate: t.String(),
      endDate: t.String()
    })
  })

  .get('/check/:date', async ({ params: { date } }) => {
    const isHoliday = await companyHolidayService.isCompanyHoliday(date);
    return { date, isHoliday };
  }, {
    params: t.Object({
      date: t.String()
    })
  })

  .delete('/clear-all', async () => {
    return await companyHolidayService.deleteAllCompanyHolidays();
  });