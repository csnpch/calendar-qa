import type { Database } from 'bun:sqlite';
import { Event } from '../types';
import { NotificationService } from './notificationService';

export interface CronjobConfig {
  id: number;
  name: string;
  enabled: boolean;
  schedule_time: string;
  webhook_url: string;
  notification_days: number;
  created_at: string;
  updated_at: string;
}

export class CronjobService {
  private db: Database;
  private lastExecutionTimes: Map<number, string> = new Map(); // Track last execution time per config ID

  constructor(db: Database) {
    this.db = db;
  }

  // Get all cronjob configurations
  getAllConfigs(): CronjobConfig[] {
    const stmt = this.db.prepare('SELECT * FROM cronjob_config ORDER BY schedule_time');
    return stmt.all() as CronjobConfig[];
  }

  // Get enabled cronjob configurations
  getEnabledConfigs(): CronjobConfig[] {
    const stmt = this.db.prepare('SELECT * FROM cronjob_config WHERE enabled = 1 ORDER BY schedule_time');
    return stmt.all() as CronjobConfig[];
  }

  // Get cronjob configuration by ID
  getConfigById(id: number): CronjobConfig | null {
    const stmt = this.db.prepare('SELECT * FROM cronjob_config WHERE id = ?');
    return stmt.get(id) as CronjobConfig | null;
  }

  // Create new cronjob configuration
  createConfig(config: Omit<CronjobConfig, 'id' | 'created_at' | 'updated_at'>): CronjobConfig {
    const stmt = this.db.prepare(`
      INSERT INTO cronjob_config (name, enabled, schedule_time, webhook_url, notification_days)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      config.name,
      config.enabled ? 1 : 0,
      config.schedule_time,
      config.webhook_url,
      config.notification_days
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
    const stmt = this.db.prepare('SELECT * FROM events WHERE date = ? ORDER BY employee_name');
    return stmt.all(dateString) as Event[];
  }

  // Get date string for notification (today or tomorrow based on config)
  private getNotificationDate(notificationDays: number): string {
    const date = new Date();
    date.setDate(date.getDate() + notificationDays);
    return date.toISOString().split('T')[0];
  }

  // Execute cronjob notification
  async executeNotification(config: CronjobConfig): Promise<void> {
    try {
      console.log(`Executing cronjob: ${config.name} at ${new Date().toISOString()}`);
      
      const notificationDate = this.getNotificationDate(config.notification_days);
      const events = this.getEventsForDate(notificationDate);
      
      console.log(`Found ${events.length} events for ${notificationDate}`);
      
      if (events.length > 0 || config.notification_days === 0) {
        // Send notification for events or daily summary
        const success = await NotificationService.sendEventsNotification(
          events,
          config.webhook_url,
          notificationDate,
          config.notification_days === 0
        );
        
        if (success) {
          console.log(`Notification sent successfully for ${config.name}`);
        } else {
          console.error(`Failed to send notification for ${config.name}`);
        }
      } else {
        console.log(`No events found for ${notificationDate}, skipping notification`);
      }
    } catch (error) {
      console.error(`Error executing cronjob ${config.name}:`, error);
    }
  }

  // Test notification (for testing purposes)
  async testNotification(id: number): Promise<boolean> {
    const config = this.getConfigById(id);
    if (!config) {
      console.error(`Cronjob config ${id} not found`);
      return false;
    }

    console.log(`Testing notification for ${config.name}`);
    await this.executeNotification(config);
    return true;
  }

  // Execute all enabled notifications (called by cron jobs)
  async executeAllEnabledNotifications(): Promise<void> {
    const configs = this.getEnabledConfigs();
    
    for (const config of configs) {
      await this.executeNotification(config);
    }
  }

  // Execute notifications for specific time (called by cron jobs)
  async executeNotificationsForTime(time: string): Promise<void> {
    const configs = this.getEnabledConfigs().filter(config => config.schedule_time === time);
    
    for (const config of configs) {
      await this.executeNotification(config);
    }
  }

  // Check current time and execute any scheduled notifications
  async checkAndExecuteScheduledNotifications(): Promise<void> {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Asia/Bangkok'
    }); // Format: HH:MM
    
    const currentDateTimeKey = `${now.toDateString()}-${currentTime}`; // Include date to reset daily
    
    // Get all enabled configs that match current time
    const configs = this.getEnabledConfigs().filter(config => {
      const lastExecution = this.lastExecutionTimes.get(config.id);
      return config.schedule_time === currentTime && lastExecution !== currentDateTimeKey;
    });
    
    if (configs.length > 0) {
      console.log(`Found ${configs.length} scheduled notifications for ${currentTime}`);
      
      for (const config of configs) {
        console.log(`Executing scheduled notification: ${config.name}`);
        await this.executeNotification(config);
        
        // Mark as executed for this minute
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