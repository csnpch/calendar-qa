import { Database } from 'bun:sqlite';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

class DatabaseConnection {
  private static instance: Database | null = null;

  static getInstance(): Database {
    if (!this.instance) {
      // Ensure data directory exists
      const dataDir = join(process.cwd(), 'data');
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }
      
      // Create database file in data directory
      const dbPath = join(dataDir, 'calendar.db');
      this.instance = new Database(dbPath);
      
      // Enable foreign keys
      this.instance.exec('PRAGMA foreign_keys = ON;');
      
      // Initialize schema
      this.initializeSchema();
    }
    return this.instance;
  }

  private static initializeSchema(): void {
    if (!this.instance) return;
    
    try {
      // Create schema directly instead of reading from file for now
      const schema = `
        -- Employees table
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Events table
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            employee_name TEXT NOT NULL,
            leave_type TEXT NOT NULL CHECK (leave_type IN ('vacation', 'personal', 'sick', 'absent', 'maternity', 'paternity', 'bereavement', 'study', 'military', 'sabbatical', 'unpaid', 'compensatory', 'other')),
            date TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
        );

        -- Cronjob configuration table
        CREATE TABLE IF NOT EXISTS cronjob_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            enabled BOOLEAN NOT NULL DEFAULT 1,
            schedule_time TEXT NOT NULL, -- Format: "HH:MM"
            webhook_url TEXT NOT NULL,
            notification_days INTEGER NOT NULL DEFAULT 1, -- Days ahead to notify (0=today, 1=tomorrow)
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_events_employee_id ON events(employee_id);
        CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
        CREATE INDEX IF NOT EXISTS idx_events_leave_type ON events(leave_type);
        CREATE INDEX IF NOT EXISTS idx_cronjob_config_enabled ON cronjob_config(enabled);

        -- Insert default employees
        INSERT OR IGNORE INTO employees (id, name) VALUES 
        (1, 'John Smith'),
        (2, 'Sarah Johnson'),
        (3, 'Michael Brown'),
        (4, 'Emily Davis'),
        (5, 'David Wilson');

        -- Insert default cronjob configurations
        INSERT OR IGNORE INTO cronjob_config (id, name, enabled, schedule_time, webhook_url, notification_days) VALUES 
        (1, 'Morning Notification', 1, '09:00', 'https://prod-56.southeastasia.logic.azure.com:443/workflows/8f1f48a580794efeb7f5363a94366e20/triggers/manual/paths/invoke?api-version=2016-06-01', 1),
        (2, 'Evening Notification', 1, '17:30', 'https://prod-56.southeastasia.logic.azure.com:443/workflows/8f1f48a580794efeb7f5363a94366e20/triggers/manual/paths/invoke?api-version=2016-06-01', 0);
      `;
      
      this.instance.exec(schema);
      console.log('Database schema initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database schema:', error);
      throw error;
    }
  }

  static close(): void {
    if (this.instance) {
      this.instance.close(false);
      this.instance = null;
    }
  }
}

export const getDatabase = () => DatabaseConnection.getInstance();
export default DatabaseConnection;