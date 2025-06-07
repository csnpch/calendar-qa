import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';

import { employeesRoutes } from './routes/employees';
import { eventsRoutes } from './routes/events';
import { holidaysRoutes } from './routes/holidays';
import { loggerMiddleware } from './middleware/logger';
import Logger from './utils/logger';

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
        { name: 'holidays', description: 'Holiday information endpoints' }
      ]
    }
  }))
  .get('/', () => ({ message: 'Calendar API is running!' }))
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .use(employeesRoutes)
  .use(eventsRoutes)
  .use(holidaysRoutes)
  .listen(3001);

Logger.info(`🚀 Calendar API is running at http://localhost:3001`);
Logger.info(`📚 API Documentation available at http://localhost:3001/swagger`);

export type App = typeof app;