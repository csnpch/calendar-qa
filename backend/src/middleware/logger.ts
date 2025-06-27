import { Elysia } from 'elysia';
import Logger from '../utils/logger';
import moment from 'moment';

export const loggerMiddleware = new Elysia({ name: 'logger' })
  .derive(({ request }) => {
    const start = moment().valueOf();
    const method = request.method;
    const url = request.url;
    
    Logger.http(`${method} ${url} - Request started`);
    
    return { startTime: start };
  })
  .onAfterHandle(({ request, startTime, set }) => {
    const duration = moment().valueOf() - startTime;
    const method = request.method;
    const url = request.url;
    const status = set.status || 200;
    
    Logger.http(`${method} ${url} - ${status} (${duration}ms)`);
  })
  .onError(({ error, request, set }) => {
    const method = request.method;
    const url = request.url;
    const status = set.status || 500;
    
    Logger.error(`${method} ${url} - ${status} ERROR: ${error.message}`);
    Logger.error(`Stack trace: ${error.stack}`);
    
    return {
      error: 'Internal Server Error',
      message: error.message,
      timestamp: moment().utcOffset('+07:00').toISOString(),
      path: url,
      method: method
    };
  });