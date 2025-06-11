const Database = require('better-sqlite3');
const path = require('path');

function migrateRemoveEmployeeName() {
  const dbPath = path.join(__dirname, 'data', 'calendar.db');
  const db = new Database(dbPath);

  try {
    console.log('Starting migration to remove employee_name column...');

    // Check if employee_name column exists
    const tableInfo = db.prepare("PRAGMA table_info(events)").all();
    const hasEmployeeName = tableInfo.some(col => col.name === 'employee_name');

    if (!hasEmployeeName) {
      console.log('employee_name column does not exist. Migration not needed.');
      return;
    }

    // Start transaction
    db.exec('BEGIN TRANSACTION');

    // Create new events table without employee_name column
    db.exec(`
      CREATE TABLE events_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        leave_type TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
      )
    `);

    // Copy data from old table to new table (excluding employee_name)
    db.exec(`
      INSERT INTO events_new (id, employee_id, leave_type, date, description, created_at, updated_at)
      SELECT id, employee_id, leave_type, date, description, created_at, updated_at
      FROM events
    `);

    // Drop old table
    db.exec('DROP TABLE events');

    // Rename new table to original name
    db.exec('ALTER TABLE events_new RENAME TO events');

    // Recreate indexes
    db.exec('CREATE INDEX idx_events_employee_id ON events (employee_id)');
    db.exec('CREATE INDEX idx_events_date ON events (date)');
    db.exec('CREATE INDEX idx_events_leave_type ON events (leave_type)');

    // Commit transaction
    db.exec('COMMIT');

    console.log('✅ Successfully removed employee_name column from events table');
    console.log('✅ All data preserved, only employee_name column removed');
    console.log('✅ Indexes recreated');

  } catch (error) {
    // Rollback on error
    try {
      db.exec('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateRemoveEmployeeName();
}

module.exports = { migrateRemoveEmployeeName };