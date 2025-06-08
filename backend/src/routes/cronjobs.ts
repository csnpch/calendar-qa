import { Elysia, t } from 'elysia';
import type { Database } from 'bun:sqlite';
import { CronjobService } from '../services/cronjobService';
import { getDatabase } from '../database/connection';

const cronjobService = new CronjobService(getDatabase());

export const cronjobRoutes = new Elysia({ prefix: '/cronjobs' })
    // Get all cronjob configurations
    .get('/', () => {
      try {
        const configs = cronjobService.getAllConfigs();
        return {
          success: true,
          data: configs
        };
      } catch (error) {
        console.error('Error fetching cronjob configs:', error);
        return {
          success: false,
          error: 'Failed to fetch cronjob configurations'
        };
      }
    }, {
      detail: {
        summary: 'Get all cronjob configurations',
        tags: ['Cronjobs']
      }
    })

    // Get cronjob status
    .get('/status', () => {
      try {
        const configs = cronjobService.getAllConfigs();
        const status = configs.map(config => ({
          id: config.id,
          name: config.name,
          enabled: config.enabled,
          schedule_time: config.schedule_time,
          running: config.enabled === 1 // With Elysia Cron, if enabled, it's running
        }));
        return {
          success: true,
          data: status
        };
      } catch (error) {
        console.error('Error fetching cronjob status:', error);
        return {
          success: false,
          error: 'Failed to fetch cronjob status'
        };
      }
    }, {
      detail: {
        summary: 'Get status of all cronjobs',
        tags: ['Cronjobs']
      }
    })

    // Get specific cronjob configuration
    .get('/:id', ({ params }) => {
      try {
        const id = parseInt(params.id);
        const config = cronjobService.getConfigById(id);
        
        if (!config) {
          return {
            success: false,
            error: 'Cronjob configuration not found'
          };
        }

        return {
          success: true,
          data: config
        };
      } catch (error) {
        console.error('Error fetching cronjob config:', error);
        return {
          success: false,
          error: 'Failed to fetch cronjob configuration'
        };
      }
    }, {
      params: t.Object({
        id: t.String()
      }),
      detail: {
        summary: 'Get cronjob configuration by ID',
        tags: ['Cronjobs']
      }
    })

    // Create new cronjob configuration
    .post('/', ({ body }) => {
      try {
        const config = cronjobService.createConfig(body);

        return {
          success: true,
          data: config,
          message: 'Cronjob configuration created. Note: Elysia Cron schedules are fixed at 9:00 AM and 5:30 PM.'
        };
      } catch (error) {
        console.error('Error creating cronjob config:', error);
        return {
          success: false,
          error: 'Failed to create cronjob configuration'
        };
      }
    }, {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 100 }),
        enabled: t.Boolean(),
        schedule_time: t.String({ pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' }), // HH:MM format
        webhook_url: t.String({ 
          minLength: 1,
          pattern: '^https?:\\/\\/.+',
          error: 'webhook_url must be a valid HTTP or HTTPS URL'
        }),
        notification_days: t.Number({ minimum: -1, maximum: 7 })
      }),
      detail: {
        summary: 'Create new cronjob configuration',
        tags: ['Cronjobs']
      }
    })

    // Update cronjob configuration
    .put('/:id', ({ params, body }) => {
      try {
        const id = parseInt(params.id);
        const config = cronjobService.updateConfig(id, body);
        
        if (!config) {
          return {
            success: false,
            error: 'Cronjob configuration not found'
          };
        }

        return {
          success: true,
          data: config
        };
      } catch (error) {
        console.error('Error updating cronjob config:', error);
        return {
          success: false,
          error: 'Failed to update cronjob configuration'
        };
      }
    }, {
      params: t.Object({
        id: t.String()
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
        enabled: t.Optional(t.Boolean()),
        schedule_time: t.Optional(t.String({ pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' })),
        webhook_url: t.Optional(t.String({ 
          minLength: 1,
          pattern: '^https?:\\/\\/.+',
          error: 'webhook_url must be a valid HTTP or HTTPS URL'
        })),
        notification_days: t.Optional(t.Number({ minimum: -1, maximum: 7 }))
      }),
      detail: {
        summary: 'Update cronjob configuration',
        tags: ['Cronjobs']
      }
    })

    // Delete cronjob configuration
    .delete('/:id', ({ params }) => {
      try {
        const id = parseInt(params.id);
        const success = cronjobService.deleteConfig(id);
        
        if (!success) {
          return {
            success: false,
            error: 'Cronjob configuration not found'
          };
        }

        return {
          success: true,
          message: 'Cronjob configuration deleted successfully'
        };
      } catch (error) {
        console.error('Error deleting cronjob config:', error);
        return {
          success: false,
          error: 'Failed to delete cronjob configuration'
        };
      }
    }, {
      params: t.Object({
        id: t.String()
      }),
      detail: {
        summary: 'Delete cronjob configuration',
        tags: ['Cronjobs']
      }
    })

    // Test notification for specific cronjob
    .post('/:id/test', async ({ params }) => {
      try {
        const id = parseInt(params.id);
        const result = await cronjobService.testNotification(id);
        
        if (result.success) {
          return {
            success: true,
            message: 'Test notification sent successfully'
          };
        } else {
          return {
            success: false,
            error: result.error || 'Failed to send test notification'
          };
        }
      } catch (error) {
        console.error('Error testing cronjob notification:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to send test notification'
        };
      }
    }, {
      params: t.Object({
        id: t.String()
      }),
      detail: {
        summary: 'Send test notification for specific cronjob',
        tags: ['Cronjobs']
      }
    });