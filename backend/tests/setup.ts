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
    date DATE NOT NULL,
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
  // Clean events table before each test
  global.mockDatabase.exec('DELETE FROM events');
});

afterAll(() => {
  global.mockDatabase.close();
});