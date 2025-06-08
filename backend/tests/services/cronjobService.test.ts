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