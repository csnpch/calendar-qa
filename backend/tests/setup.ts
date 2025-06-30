import Database from 'better-sqlite3';

// Mock database for testing
global.mockDatabase = new Database(':memory:');

// Create test schema
global.mockDatabase.exec(`
  CREATE TABLE employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    employee_name TEXT NOT NULL,
    leave_type TEXT NOT NULL,
    date TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees (id)
  );

  CREATE TABLE holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    type TEXT DEFAULT 'public'
  );

  CREATE TABLE cronjob_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    schedule_time TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    notification_days INTEGER NOT NULL DEFAULT 0,
    notification_type TEXT NOT NULL DEFAULT 'daily' CHECK (notification_type IN ('daily', 'weekly')),
    weekly_days TEXT,
    weekly_scope TEXT DEFAULT 'current' CHECK (weekly_scope IN ('current', 'next')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Insert test data  
global.mockDatabase.exec(`
  INSERT INTO employees (name) VALUES 
    ('John Smith'),
    ('Jane Doe');
    
  INSERT INTO holidays (name, date) VALUES 
    ('วันปีใหม่', '2025-01-01'),
    ('วันลอยกระทง', '2025-11-15');
`);


beforeEach(() => {
  // Clean all tables before each test
  global.mockDatabase.exec('DELETE FROM events');
  global.mockDatabase.exec('DELETE FROM cronjob_config');
  global.mockDatabase.exec('DELETE FROM employees');
  
  // Reset auto-increment
  global.mockDatabase.exec("DELETE FROM sqlite_sequence WHERE name='employees'");
  
  // Re-insert test data
  global.mockDatabase.exec(`
    INSERT INTO employees (name) VALUES 
      ('John Smith'),
      ('Jane Doe');
  `);
});

afterAll(() => {
  global.mockDatabase.close();
});