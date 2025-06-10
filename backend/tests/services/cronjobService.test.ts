import { CronjobService } from '../../src/services/cronjobService';

// Mock the database connection
jest.mock('../../src/database/connection', () => ({
  getDatabase: () => global.mockDatabase,
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('CronjobService - Invalid Webhook URL Tests', () => {
  let cronjobService: CronjobService;

  beforeEach(() => {
    // Reset fetch mock before each test
    mockFetch.mockReset();
    
    // Create fresh service instance
    cronjobService = new CronjobService(global.mockDatabase as any);
  });

  describe('testNotification - Invalid Webhook URL Cases', () => {
    it('should return error for 405 Method Not Allowed (google.com case)', async () => {
      // Create test cronjob config with invalid webhook URL (google.com)
      global.mockDatabase.exec(`
        INSERT INTO cronjob_config (name, enabled, schedule_time, webhook_url, notification_days, notification_type, weekly_days, weekly_scope)
        VALUES ('Test Invalid Webhook', 1, '09:00', 'https://google.com/', 1, 'daily', NULL, 'current_week')
      `);

      // Mock Google's 405 response (exactly what google.com returns)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 405,
        statusText: 'Method Not Allowed',
        text: () => Promise.resolve(`<!DOCTYPE html>
<html lang=en>
  <meta charset=utf-8>
  <title>Error 405 (Method Not Allowed)!!1</title>
  <p><b>405.</b> <ins>That's an error.</ins>
  <p>The request method <code>POST</code> is inappropriate for the URL <code>/</code>.  <ins>That's all we know.</ins>`)
      });

      const result = await cronjobService.testNotification(1);

      // Verify it returns an error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Method not allowed: https://google.com/ does not accept POST requests (405 Method Not Allowed)');
      
      // Verify fetch was called with correct webhook URL
      expect(mockFetch).toHaveBeenCalledWith(
        'https://google.com/',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.any(String)
        })
      );
    });

    it('should return error for non-existent cronjob config', async () => {
      const result = await cronjobService.testNotification(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cronjob configuration 999 not found');
    });
  });

  describe('Weekly notification configuration tests', () => {
    beforeEach(() => {
      // Reset all mocks
      mockFetch.mockReset();
      cronjobService = new CronjobService(global.mockDatabase as any);
    });

    it('should create weekly notification configuration correctly', () => {
      const configData = {
        name: 'Weekly Test Notification',
        enabled: true,
        schedule_time: '09:00',
        webhook_url: 'https://webhook.test/endpoint',
        notification_days: 0,
        notification_type: 'weekly' as const,
        weekly_days: [1, 2, 3, 4, 5], // Monday to Friday
        weekly_scope: 'current_week' as const
      };

      const createdConfig = cronjobService.createConfig(configData);

      expect(createdConfig.notification_type).toBe('weekly');
      expect(createdConfig.weekly_days).toEqual([1, 2, 3, 4, 5]);
      expect(createdConfig.weekly_scope).toBe('current_week');
    });

    it('should test weekly notification successfully with valid webhook', async () => {
      // Create a weekly config
      const config = cronjobService.createConfig({
        name: 'Weekly Test',
        enabled: true,
        schedule_time: '09:00',
        webhook_url: 'https://webhook.test/endpoint',
        notification_days: 0,
        notification_type: 'weekly',
        weekly_days: [5], // Friday only
        weekly_scope: 'next_week'
      });

      // Mock successful webhook response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('Success')
      });

      const result = await cronjobService.testNotification(config.id);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://webhook.test/endpoint',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('สัปดาห์หน้า')
        })
      );
    });

    it('should handle weekly notification with invalid webhook URL', async () => {
      // Create a weekly config with invalid URL
      const config = cronjobService.createConfig({
        name: 'Weekly Test Invalid',
        enabled: true,
        schedule_time: '09:00',
        webhook_url: 'https://invalid.webhook.url/',
        notification_days: 0,
        notification_type: 'weekly',
        weekly_days: [1, 3, 5],
        weekly_scope: 'current_week'
      });

      // Mock console.error to suppress logs
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock failed webhook response
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await cronjobService.testNotification(config.id);
      
      // Restore console.error
      consoleSpy.mockRestore();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle daily notification with invalid webhook URL', async () => {
      // Create a daily config with invalid URL
      const config = cronjobService.createConfig({
        name: 'Daily Test Invalid',
        enabled: true,
        schedule_time: '17:30',
        webhook_url: 'https://invalid.webhook.url/',
        notification_days: 1,
        notification_type: 'daily',
        weekly_days: undefined,
        weekly_scope: 'current_week'
      });

      // Mock console.error to suppress logs
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock failed webhook response
      mockFetch.mockRejectedValueOnce(new Error('Connection timeout'));

      const result = await cronjobService.testNotification(config.id);
      
      // Restore console.error
      consoleSpy.mockRestore();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection timeout');
    });

    it('should handle another invalid webhook URL case', async () => {
      // Create config with another invalid URL
      const config = cronjobService.createConfig({
        name: 'Another Test Invalid',
        enabled: true,
        schedule_time: '12:00',
        webhook_url: 'https://another.invalid.url/',
        notification_days: 0,
        notification_type: 'daily',
        weekly_days: undefined,
        weekly_scope: 'current_week'
      });

      // Mock HTTP error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('Endpoint not found')
      });

      const result = await cronjobService.testNotification(config.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('404');
    });

    it('should convert daily cronjob to weekly configuration', () => {
      // Create initial daily config
      const dailyConfig = cronjobService.createConfig({
        name: 'Daily Config',
        enabled: true,
        schedule_time: '09:00',
        webhook_url: 'https://webhook.test/endpoint',
        notification_days: 1,
        notification_type: 'daily',
        weekly_days: undefined,
        weekly_scope: 'current_week'
      });

      // Update to convert to weekly
      const updatedConfig = cronjobService.updateConfig(dailyConfig.id, {
        notification_type: 'weekly',
        weekly_days: [1, 3, 5],
        weekly_scope: 'next_week'
      });

      expect(updatedConfig?.notification_type).toBe('weekly');
      expect(updatedConfig?.weekly_days).toEqual([1, 3, 5]);
      expect(updatedConfig?.weekly_scope).toBe('next_week');
    });
  });

  describe('getAllConfigs with weekly configurations', () => {
    it('should return all configurations including weekly ones', () => {
      // Create multiple configs
      cronjobService.createConfig({
        name: 'Daily Morning',
        enabled: true,
        schedule_time: '09:00',
        webhook_url: 'https://webhook.test/morning',
        notification_days: 1,
        notification_type: 'daily',
        weekly_days: undefined,
        weekly_scope: 'current_week'
      });

      cronjobService.createConfig({
        name: 'Weekly Friday',
        enabled: true,
        schedule_time: '17:00',
        webhook_url: 'https://webhook.test/weekly',
        notification_days: 0,
        notification_type: 'weekly',
        weekly_days: [5],
        weekly_scope: 'current_week'
      });

      cronjobService.createConfig({
        name: 'Weekly Next Week',
        enabled: true,
        schedule_time: '10:00',
        webhook_url: 'https://webhook.test/next',
        notification_days: 0,
        notification_type: 'weekly',
        weekly_days: [1, 5],
        weekly_scope: 'next_week'
      });

      const allConfigs = cronjobService.getAllConfigs();
      const weeklyConfigs = allConfigs.filter(c => c.notification_type === 'weekly');

      expect(allConfigs.length).toBeGreaterThanOrEqual(3);
      expect(weeklyConfigs).toHaveLength(2);

      const currentWeekConfig = weeklyConfigs.find(c => c.weekly_scope === 'current_week');
      const nextWeekConfig = weeklyConfigs.find(c => c.weekly_scope === 'next_week');

      expect(currentWeekConfig).toBeDefined();
      expect(currentWeekConfig?.weekly_days).toEqual([5]);
      expect(nextWeekConfig).toBeDefined();
      expect(nextWeekConfig?.weekly_days).toEqual([1, 5]);
    });
  });
});