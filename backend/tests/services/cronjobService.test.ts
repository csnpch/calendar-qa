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
        INSERT INTO cronjob_config (name, enabled, schedule_time, webhook_url, notification_days)
        VALUES ('Test Invalid Webhook', 1, '09:00', 'https://google.com/', 1)
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
      
      // Verify fetch was not called for non-existent config
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});

describe('CronjobService - Weekly Notification Tests', () => {
  let cronjobService: CronjobService;

  beforeEach(() => {
    // Reset fetch mock before each test
    mockFetch.mockReset();
    
    // Create fresh service instance
    cronjobService = new CronjobService(global.mockDatabase as any);
    
    // Clear existing data (events and cronjobs are cleared by global setup)
    // Just ensure we have test employees
    global.mockDatabase.exec('DELETE FROM employees');
    global.mockDatabase.exec(`
      INSERT INTO employees (id, name) VALUES 
      (1, 'John Doe'),
      (2, 'Jane Smith'),
      (3, 'Bob Johnson')
    `);
  });

  describe('Weekly Notification - Current Week', () => {
    beforeEach(() => {
      // Mock successful webhook response
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('1')
      });
    });

    it('should create weekly current week configuration correctly', async () => {
      const config = {
        name: 'Weekly Current Week Test',
        enabled: true,
        schedule_time: '09:00',
        webhook_url: 'https://hooks.slack.com/test',
        notification_days: 0,
        notification_type: 'weekly' as const,
        weekly_days: [1, 2, 3, 4, 5], // Monday to Friday
        weekly_scope: 'current_week' as const
      };

      const createdConfig = cronjobService.createConfig(config);
      
      expect(createdConfig.notification_type).toBe('weekly');
      expect(createdConfig.weekly_days).toEqual([1, 2, 3, 4, 5]);
      expect(createdConfig.weekly_scope).toBe('current_week');
    });

    it('should test current week notification', async () => {
      // Create weekly config for current week using the service
      const config = cronjobService.createConfig({
        name: 'Weekly Current Week',
        enabled: true,
        schedule_time: '09:00',
        webhook_url: 'https://hooks.slack.com/test',
        notification_days: 0,
        notification_type: 'weekly',
        weekly_days: [1, 2, 3, 4, 5],
        weekly_scope: 'current_week'
      });

      // Add events within a realistic date range
      const today = new Date();
      const currentWeekDates = [];
      
      // Get dates for this week
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - today.getDay() + i);
        currentWeekDates.push(date.toISOString().split('T')[0]);
      }

      global.mockDatabase.exec(`
        INSERT INTO events (employee_id, employee_name, leave_type, date, description)
        VALUES 
        (1, 'John Doe', 'vacation', '${currentWeekDates[1]}', 'Current week vacation'),
        (2, 'Jane Smith', 'sick', '${currentWeekDates[3]}', 'Current week sick leave'),
        (3, 'Bob Johnson', 'personal', '${currentWeekDates[5]}', 'Current week personal')
      `);

      const result = await cronjobService.testNotification(config.id);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('สัปดาห์นี้')
        })
      );
    });

    it('should handle empty current week events gracefully', async () => {
      const config = cronjobService.createConfig({
        name: 'Weekly Empty Current Week',
        enabled: true,
        schedule_time: '09:00',
        webhook_url: 'https://hooks.slack.com/test',
        notification_days: 0,
        notification_type: 'weekly',
        weekly_days: [5],
        weekly_scope: 'current_week'
      });

      const result = await cronjobService.testNotification(config.id);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('สัปดาห์นี้')
        })
      );

      // Verify the payload indicates no events
      const callArgs = mockFetch.mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);
      const bodyText = JSON.stringify(payload);
      expect(bodyText).toContain('ไม่มีเหตุการณ์สัปดาห์นี้');
    });
  });

  describe('Weekly Notification - Next Week', () => {
    beforeEach(() => {
      // Mock successful webhook response
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('1')
      });
    });

    it('should create weekly next week configuration correctly', async () => {
      const config = {
        name: 'Weekly Next Week Test',
        enabled: true,
        schedule_time: '17:30',
        webhook_url: 'https://hooks.slack.com/test',
        notification_days: 0,
        notification_type: 'weekly' as const,
        weekly_days: [5], // Friday only
        weekly_scope: 'next_week' as const
      };

      const createdConfig = cronjobService.createConfig(config);
      
      expect(createdConfig.notification_type).toBe('weekly');
      expect(createdConfig.weekly_days).toEqual([5]);
      expect(createdConfig.weekly_scope).toBe('next_week');
    });

    it('should test next week notification', async () => {
      const config = cronjobService.createConfig({
        name: 'Weekly Next Week Notification',
        enabled: true,
        schedule_time: '17:30',
        webhook_url: 'https://hooks.slack.com/test',
        notification_days: 0,
        notification_type: 'weekly',
        weekly_days: [5],
        weekly_scope: 'next_week'
      });

      // Add events for next week
      const today = new Date();
      const nextWeekDates = [];
      
      // Get dates for next week
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - today.getDay() + 7 + i); // Next week
        nextWeekDates.push(date.toISOString().split('T')[0]);
      }

      global.mockDatabase.exec(`
        INSERT INTO events (employee_id, employee_name, leave_type, date, description)
        VALUES 
        (1, 'John Doe', 'vacation', '${nextWeekDates[1]}', 'Next week vacation'),
        (2, 'Jane Smith', 'personal', '${nextWeekDates[3]}', 'Next week personal'),
        (1, 'John Doe', 'sick', '${nextWeekDates[5]}', 'Next week sick')
      `);

      const result = await cronjobService.testNotification(config.id);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('สัปดาห์หน้า')
        })
      );

      // Verify the payload contains next week events
      const callArgs = mockFetch.mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);
      const bodyText = JSON.stringify(payload);
      expect(bodyText).toContain('3 เหตุการณ์');
    });

    it('should handle multiple notification days for next week', async () => {
      const config = cronjobService.createConfig({
        name: 'Weekly Mon-Fri Next Week',
        enabled: true,
        schedule_time: '09:00',
        webhook_url: 'https://hooks.slack.com/test',
        notification_days: 0,
        notification_type: 'weekly',
        weekly_days: [1, 2, 3, 4, 5],
        weekly_scope: 'next_week'
      });

      const result = await cronjobService.testNotification(config.id);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('สัปดาห์หน้า')
        })
      );
    });

    it('should handle webhook failure for weekly notifications', async () => {
      const config = cronjobService.createConfig({
        name: 'Weekly Failing Webhook',
        enabled: true,
        schedule_time: '09:00',
        webhook_url: 'https://invalid-webhook.com',
        notification_days: 0,
        notification_type: 'weekly',
        weekly_days: [5],
        weekly_scope: 'next_week'
      });

      // Mock webhook failure
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('Not Found')
      });

      const result = await cronjobService.testNotification(config.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not found');
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Weekly Notification - Configuration Management', () => {
    it('should update weekly configuration correctly', async () => {
      // First create a daily config
      const dailyConfig = cronjobService.createConfig({
        name: 'Daily to Weekly Test',
        enabled: true,
        schedule_time: '09:00',
        webhook_url: 'https://hooks.slack.com/test',
        notification_days: 1,
        notification_type: 'daily'
      });

      // Then update to weekly
      const updatedConfig = cronjobService.updateConfig(dailyConfig.id, {
        notification_type: 'weekly',
        weekly_days: [1, 3, 5],
        weekly_scope: 'next_week'
      });

      expect(updatedConfig?.notification_type).toBe('weekly');
      expect(updatedConfig?.weekly_days).toEqual([1, 3, 5]);
      expect(updatedConfig?.weekly_scope).toBe('next_week');
    });

    it('should retrieve all weekly configurations', async () => {
      // Create multiple configs
      cronjobService.createConfig({
        name: 'Daily Config',
        enabled: true,
        schedule_time: '09:00',
        webhook_url: 'https://hooks.slack.com/test',
        notification_days: 1,
        notification_type: 'daily'
      });

      cronjobService.createConfig({
        name: 'Weekly Current',
        enabled: true,
        schedule_time: '10:00',
        webhook_url: 'https://hooks.slack.com/test',
        notification_days: 0,
        notification_type: 'weekly',
        weekly_days: [1, 2, 3, 4, 5],
        weekly_scope: 'current_week'
      });

      cronjobService.createConfig({
        name: 'Weekly Next',
        enabled: true,
        schedule_time: '17:30',
        webhook_url: 'https://hooks.slack.com/test',
        notification_days: 0,
        notification_type: 'weekly',
        weekly_days: [5],
        weekly_scope: 'next_week'
      });

      const allConfigs = cronjobService.getAllConfigs();
      const weeklyConfigs = allConfigs.filter(c => c.notification_type === 'weekly');
      
      expect(allConfigs).toHaveLength(3);
      expect(weeklyConfigs).toHaveLength(2);
      
      const currentWeekConfig = weeklyConfigs.find(c => c.weekly_scope === 'current_week');
      const nextWeekConfig = weeklyConfigs.find(c => c.weekly_scope === 'next_week');
      
      expect(currentWeekConfig?.weekly_days).toEqual([1, 2, 3, 4, 5]);
      expect(nextWeekConfig?.weekly_days).toEqual([5]);
    });
  });
});