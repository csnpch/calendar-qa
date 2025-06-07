import { Database } from 'bun:sqlite';
import { join } from 'path';

class DatabaseConnection {
  private static instance: Database | null = null;

  static getInstance(): Database {
    if (!this.instance) {
      // Create database file in backend directory
      const dbPath = join(process.cwd(), 'calendar.db');
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

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_events_employee_id ON events(employee_id);
        CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
        CREATE INDEX IF NOT EXISTS idx_events_leave_type ON events(leave_type);

        -- Insert default employees
        INSERT OR IGNORE INTO employees (id, name) VALUES 
        (1, 'John Smith'),
        (2, 'Sarah Johnson'),
        (3, 'Michael Brown'),
        (4, 'Emily Davis'),
        (5, 'David Wilson');
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