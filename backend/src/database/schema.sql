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
    leave_type TEXT NOT NULL CHECK (leave_type IN ('vacation', 'personal', 'sick', 'absent', 'maternity', 'bereavement', 'study', 'military', 'sabbatical', 'unpaid', 'compensatory', 'other')),
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
    notification_type TEXT NOT NULL DEFAULT 'daily' CHECK (notification_type IN ('daily', 'weekly')), -- daily or weekly
    weekly_days TEXT, -- JSON array of weekday numbers (0=Sunday, 1=Monday, ..., 6=Saturday) for weekly notifications
    weekly_scope TEXT DEFAULT 'current_week' CHECK (weekly_scope IN ('current_week', 'next_week')), -- current or next week events
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