import type { Database } from 'bun:sqlite';
import type { Event, CronjobConfig } from '../types';
import { NotificationService } from './notificationService';
import moment from 'moment';

export class CronjobService {
  private db: Database;
  private lastExecutionTimes: Map<number, string> = new Map(); // Track last execution time per config ID

  constructor(db: Database) {
    this.db = db;
  }

  // Get all cronjob configurations
  getAllConfigs(): CronjobConfig[] {
    const stmt = this.db.prepare('SELECT * FROM cronjob_config ORDER BY schedule_time');
    const configs = stmt.all() as any[];
    return configs.map(config => ({
      ...config,
      weekly_days: config.weekly_days ? JSON.parse(config.weekly_days) : undefined,
      enabled: Boolean(config.enabled)
    }));
  }

  // Get enabled cronjob configurations
  getEnabledConfigs(): CronjobConfig[] {
    const stmt = this.db.prepare('SELECT * FROM cronjob_config WHERE enabled = 1 ORDER BY schedule_time');
    const configs = stmt.all() as any[];
    return configs.map(config => ({
      ...config,
      weekly_days: config.weekly_days ? JSON.parse(config.weekly_days) : undefined,
      enabled: Boolean(config.enabled)
    }));
  }

  // Get cronjob configuration by ID
  getConfigById(id: number): CronjobConfig | null {
    const stmt = this.db.prepare('SELECT * FROM cronjob_config WHERE id = ?');
    const config = stmt.get(id) as any;
    if (!config) return null;
    return {
      ...config,
      weekly_days: config.weekly_days ? JSON.parse(config.weekly_days) : undefined,
      enabled: Boolean(config.enabled)
    };
  }

  // Create new cronjob configuration
  createConfig(config: Omit<CronjobConfig, 'id' | 'created_at' | 'updated_at'>): CronjobConfig {
    const stmt = this.db.prepare(`
      INSERT INTO cronjob_config (name, enabled, schedule_time, webhook_url, notification_days, notification_type, weekly_days, weekly_scope)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      config.name,
      config.enabled ? 1 : 0,
      config.schedule_time,
      config.webhook_url,
      config.notification_days,
      config.notification_type || 'daily',
      config.weekly_days ? JSON.stringify(config.weekly_days) : null,
      config.weekly_scope || 'current'
    );

    return this.getConfigById(Number(result.lastInsertRowid))!;
  }

  // Update cronjob configuration
  updateConfig(id: number, updates: Partial<Omit<CronjobConfig, 'id' | 'created_at' | 'updated_at'>>): CronjobConfig | null {
    const current = this.getConfigById(id);
    if (!current) return null;

    const fields = [];
    const values = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.enabled !== undefined) {
      fields.push('enabled = ?');
      values.push(updates.enabled ? 1 : 0);
    }
    if (updates.schedule_time !== undefined) {
      fields.push('schedule_time = ?');
      values.push(updates.schedule_time);
    }
    if (updates.webhook_url !== undefined) {
      fields.push('webhook_url = ?');
      values.push(updates.webhook_url);
    }
    if (updates.notification_days !== undefined) {
      fields.push('notification_days = ?');
      values.push(updates.notification_days);
    }
    if (updates.notification_type !== undefined) {
      fields.push('notification_type = ?');
      values.push(updates.notification_type);
    }
    if (updates.weekly_days !== undefined) {
      fields.push('weekly_days = ?');
      values.push(updates.weekly_days ? JSON.stringify(updates.weekly_days) : null);
    }
    if (updates.weekly_scope !== undefined) {
      fields.push('weekly_scope = ?');
      values.push(updates.weekly_scope);
    }

    if (fields.length === 0) return current;

    fields.push('updated_at = datetime(\'now\')');
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE cronjob_config 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...values);
    
    // If schedule changed, restart the job
    if (updates.schedule_time !== undefined || updates.enabled !== undefined) {
      this.restartJob(id);
    }

    return this.getConfigById(id);
  }

  // Delete cronjob configuration
  deleteConfig(id: number): boolean {
    this.stopJob(id);
    const stmt = this.db.prepare('DELETE FROM cronjob_config WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Get events for a specific date
  private getEventsForDate(dateString: string): Event[] {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        employee_id as employeeId,
        employee_name as employeeName,
        leave_type as leaveType,
        date,
        description,
        created_at as createdAt,
        updated_at as updatedAt
      FROM events 
      WHERE date = ? 
      ORDER BY employee_name
    `);
    return stmt.all(dateString) as Event[];
  }

  // Get date string for notification (today or advance days based on config)
  private getNotificationDate(notificationDays: number): string {
    // notification_days = 0 means today's events
    // notification_days = 1 means tomorrow's events (1 day advance notification)
    return moment().utcOffset('+07:00').add(notificationDays, 'days').format('YYYY-MM-DD');
  }

  // Get events for a date range (for weekly notifications)
  private getEventsForDateRange(startDate: string, endDate: string): Event[] {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        employee_id as employeeId,
        employee_name as employeeName,
        leave_type as leaveType,
        date,
        description,
        created_at as createdAt,
        updated_at as updatedAt
      FROM events 
      WHERE date >= ? AND date <= ?
      ORDER BY date, employee_name
    `);
    return stmt.all(startDate, endDate) as Event[];
  }

  // Get week date range based on scope
  private getWeekDateRange(scope: 'current' | 'next'): { startDate: string, endDate: string } {
    const now = moment().utcOffset('+07:00');
    
    let weekStart: moment.Moment;
    if (scope === 'current') {
      weekStart = now.clone().startOf('week');
    } else {
      weekStart = now.clone().add(1, 'week').startOf('week');
    }
    
    const weekEnd = weekStart.clone().endOf('week');
    
    return {
      startDate: weekStart.format('YYYY-MM-DD'),
      endDate: weekEnd.format('YYYY-MM-DD')
    };
  }

  // Check if today matches any of the configured weekly notification days
  private shouldSendWeeklyNotification(weeklyDays: number[]): boolean {
    const today = moment().utcOffset('+07:00').day(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    return weeklyDays.includes(today);
  }

  // Execute cronjob notification
  async executeNotification(config: CronjobConfig): Promise<boolean> {
    try {
      console.log(`Executing cronjob: ${config.name} at ${moment().utcOffset('+07:00').format()}`);
      
      if (config.notification_type === 'weekly') {
        return await this.executeWeeklyNotification(config);
      } else {
        return await this.executeDailyNotification(config);
      }
    } catch (error) {
      console.error(`Error executing cronjob ${config.name}:`, error);
      return false;
    }
  }

  // Execute daily notification
  private async executeDailyNotification(config: CronjobConfig): Promise<boolean> {
    const notificationDate = this.getNotificationDate(config.notification_days);
    const events = this.getEventsForDate(notificationDate);
    
    console.log(`Found ${events.length} events for ${notificationDate}`);
    
    if (events.length > 0) {
      const success = await NotificationService.sendEventsNotification(
        events,
        config.webhook_url,
        notificationDate,
        config.notification_days
      );
      console.log('Notification success:', success);
      
      if (success) {
        console.log(`Notification sent successfully for ${config.name}`);
        return true;
      } else {
        console.error(`Failed to send notification for ${config.name}`);
        return false;
      }
    } else {
      console.log(`No events found for ${notificationDate}, skipping notification`);
      return true;
    }
  }

  // Execute weekly notification
  private async executeWeeklyNotification(config: CronjobConfig): Promise<boolean> {
    // Check if today is one of the configured notification days
    if (!config.weekly_days || !this.shouldSendWeeklyNotification(config.weekly_days)) {
      console.log(`Today is not a configured notification day for ${config.name}, skipping`);
      return true;
    }

    const scope = config.weekly_scope || 'current';
    const { startDate, endDate } = this.getWeekDateRange(scope);
    const events = this.getEventsForDateRange(startDate, endDate);
    
    console.log(`Found ${events.length} events for ${scope} (${startDate} to ${endDate})`);
    
    if (events.length > 0) {
      const success = await NotificationService.sendWeeklyEventsNotification(
        events,
        config.webhook_url,
        startDate,
        endDate,
        scope
      );
      console.log('Weekly notification success:', success);
      
      if (success) {
        console.log(`Weekly notification sent successfully for ${config.name}`);
        return true;
      } else {
        console.error(`Failed to send weekly notification for ${config.name}`);
        return false;
      }
    } else {
      console.log(`No events found for ${scope}, skipping notification`);
      return true;
    }
  }

  // Execute cronjob notification with detailed error reporting
  async executeNotificationWithError(config: CronjobConfig): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Executing cronjob: ${config.name} at ${moment().utcOffset('+07:00').format()}`);
      
      if (config.notification_type === 'weekly') {
        return await this.executeWeeklyNotificationWithError(config);
      } else {
        return await this.executeDailyNotificationWithError(config);
      }
    } catch (error) {
      console.error(`Error executing cronjob ${config.name}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Execute daily notification with error reporting
  private async executeDailyNotificationWithError(config: CronjobConfig): Promise<{ success: boolean; error?: string }> {
    const notificationDate = this.getNotificationDate(config.notification_days);
    const events = this.getEventsForDate(notificationDate);
    
    console.log(`Found ${events.length} events for ${notificationDate}`);
    
    if (events.length > 0) {
      const result = await NotificationService.sendEventsNotificationWithError(
        events,
        config.webhook_url,
        notificationDate,
        config.notification_days
      );
      console.log('Notification result:', result);
      
      if (result.success) {
        console.log(`Notification sent successfully for ${config.name}`);
        return { success: true };
      } else {
        console.error(`Failed to send notification for ${config.name}:`, result.error);
        return { success: false, error: result.error };
      }
    } else {
      console.log(`No events found for ${notificationDate}, skipping notification`);
      return { success: true };
    }
  }

  // Execute weekly notification with error reporting
  private async executeWeeklyNotificationWithError(config: CronjobConfig): Promise<{ success: boolean; error?: string }> {
    // Check if today is one of the configured notification days
    if (!config.weekly_days || !this.shouldSendWeeklyNotification(config.weekly_days)) {
      console.log(`Today is not a configured notification day for ${config.name}, skipping`);
      return { success: true };
    }

    const scope = config.weekly_scope || 'current';
    const { startDate, endDate } = this.getWeekDateRange(scope);
    const events = this.getEventsForDateRange(startDate, endDate);
    
    console.log(`Found ${events.length} events for ${scope} (${startDate} to ${endDate})`);
    
    if (events.length > 0) {
      const result = await NotificationService.sendWeeklyEventsNotificationWithError(
        events,
        config.webhook_url,
        startDate,
        endDate,
        scope
      );
      console.log('Weekly notification result:', result);
      
      if (result.success) {
        console.log(`Weekly notification sent successfully for ${config.name}`);
        return { success: true };
      } else {
        console.error(`Failed to send weekly notification for ${config.name}:`, result.error);
        return { success: false, error: result.error };
      }
    } else {
      console.log(`No events found for ${scope}, skipping notification`);
      return { success: true };
    }
  }

  // Test notification (for testing purposes)
  async testNotification(id: number): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfigById(id);
    if (!config) {
      return { success: false, error: `Cronjob configuration ${id} not found` };
    }

    // For testing, always send a notification regardless of events
    // This ensures the webhook URL is validated even when no events exist
    if (config.notification_type === 'weekly') {
      const scope = config.weekly_scope || 'current';
      const { startDate, endDate } = this.getWeekDateRange(scope);
      const events = this.getEventsForDateRange(startDate, endDate);
      
      // Always send test notification (even with 0 events) to validate webhook
      const result = await NotificationService.sendWeeklyEventsNotificationWithError(
        events,
        config.webhook_url,
        startDate,
        endDate,
        scope
      );
      return result;
    } else {
      const notificationDate = this.getNotificationDate(config.notification_days);
      const events = this.getEventsForDate(notificationDate);
      
      // Always send test notification (even with 0 events) to validate webhook
      const result = await NotificationService.sendEventsNotificationWithError(
        events,
        config.webhook_url,
        notificationDate,
        config.notification_days
      );
      return result;
    }
  }

  // Execute all enabled notifications (called by cron jobs)
  async executeAllEnabledNotifications(): Promise<void> {
    const configs = this.getEnabledConfigs();
    
    for (const config of configs) {
      const success = await this.executeNotification(config);
      console.log(`Notification for ${config.name}: ${success ? 'success' : 'failed'}`);
    }
  }

  // Execute notifications for specific time (called by cron jobs)
  async executeNotificationsForTime(time: string): Promise<void> {
    const configs = this.getEnabledConfigs().filter(config => config.schedule_time === time);
    
    for (const config of configs) {
      const success = await this.executeNotification(config);
      console.log(`Notification for ${config.name} at ${time}: ${success ? 'success' : 'failed'}`);
    }
  }

  // Check current time and execute any scheduled notifications
  async checkAndExecuteScheduledNotifications(): Promise<void> {
    const now = moment().utcOffset('+07:00');
    const currentTime = now.format('HH:mm'); // Format: HH:MM
    
    const currentDateTimeKey = `${now.format('YYYY-MM-DD')}-${currentTime}`; // Include date to reset daily
    
    // Get all enabled configs that match current time
    const configs = this.getEnabledConfigs().filter(config => {
      const lastExecution = this.lastExecutionTimes.get(config.id);
      return config.schedule_time === currentTime && lastExecution !== currentDateTimeKey;
    });
    
    if (configs.length > 0) {
      console.log(`Found ${configs.length} scheduled notifications for ${currentTime}`);
      
      for (const config of configs) {
        console.log(`Executing scheduled notification: ${config.name}`);
        const success = await this.executeNotification(config);
        console.log(`Scheduled notification for ${config.name}: ${success ? 'success' : 'failed'}`);
        
        // Mark as executed for this minute regardless of success
        this.lastExecutionTimes.set(config.id, currentDateTimeKey);
      }
    }
  }

  // Stop a specific cronjob (placeholder for future implementation)
  private stopJob(id: number): void {
    console.log(`Stopping cronjob ${id}`);
    // Note: With Elysia Cron, jobs are managed globally
    // Individual job stopping would require additional implementation
  }

  // Restart a specific cronjob (placeholder for future implementation)
  private restartJob(id: number): void {
    console.log(`Restarting cronjob ${id}`);
    // Note: With Elysia Cron, jobs are managed globally
    // Individual job restarting would require additional implementation
  }
}