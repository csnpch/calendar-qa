import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { cron } from '@elysiajs/cron';

import { employeesRoutes } from './routes/employees';
import { eventsRoutes } from './routes/events';
import { holidaysRoutes } from './routes/holidays';
import { companyHolidaysRoutes } from './routes/companyHolidays';
import { cronjobRoutes } from './routes/cronjobs';
import { loggerMiddleware } from './middleware/logger';
import { CronjobService } from './services/cronjobService';
import { getDatabase } from './database/connection';
import Logger from './utils/logger';

// Initialize cronjob service
const db = getDatabase();
const cronjobService = new CronjobService(db);

const app = new Elysia()
  .use(loggerMiddleware)
  .use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }))
  .use(swagger({
    documentation: {
      info: {
        title: 'Calendar API',
        version: '1.0.0',
        description: 'API for Calendar Employee Leave Management System'
      },
      tags: [
        { name: 'employees', description: 'Employee management endpoints' },
        { name: 'events', description: 'Event management endpoints' },
        { name: 'holidays', description: 'Holiday information endpoints' },
        { name: 'company-holidays', description: 'Company holiday management endpoints' },
        { name: 'Cronjobs', description: 'Cronjob management and notifications' }
      ]
    }
  }))
  .use(cron({
    name: 'dynamic-notification-checker',
    pattern: '* * * * *', // Every minute
    timezone: 'Asia/Bangkok',
    run() {
      cronjobService.checkAndExecuteScheduledNotifications();
    }
  }))
  .get('/', () => ({ message: 'Calendar API is running!' }))
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .use(employeesRoutes)
  .use(eventsRoutes)
  .use(holidaysRoutes)
  .use(companyHolidaysRoutes)
  .use(cronjobRoutes)
  .listen(3001);

Logger.info(`🚀 Calendar API is running at http://localhost:3001`);
Logger.info(`📚 API Documentation available at http://localhost:3001/swagger`);
Logger.info(`⏰ Elysia Cron scheduler initialized with dynamic notification checking every minute`);

export type App = typeof app;