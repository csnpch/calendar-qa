#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

// Initialize database
const dbPath = path.join(__dirname, 'calendar.db');
const db = new Database(dbPath);

console.log('Starting migration for multi-day events...');

try {
  // Begin transaction
  db.exec('BEGIN TRANSACTION');

  console.log('1. Adding start_date and end_date columns...');
  
  // Add new columns
  db.exec(`
    ALTER TABLE events ADD COLUMN start_date TEXT;
  `);
  
  db.exec(`
    ALTER TABLE events ADD COLUMN end_date TEXT;
  `);

  console.log('2. Migrating existing data...');
  
  // Migrate existing single-day events
  db.exec(`
    UPDATE events 
    SET start_date = date, end_date = date 
    WHERE start_date IS NULL;
  `);

  console.log('3. Creating new indexes...');
  
  // Create indexes for the new columns
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_events_end_date ON events(end_date);
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_events_date_range ON events(start_date, end_date);
  `);

  console.log('4. Verifying migration...');
  
  // Verify the migration
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM events WHERE start_date IS NOT NULL AND end_date IS NOT NULL
  `).get();
  
  console.log(`Migrated ${result.count} events successfully.`);

  // Commit transaction
  db.exec('COMMIT');
  
  console.log('Migration completed successfully!');
  
  console.log('\nNext steps:');
  console.log('1. Update Prisma schema');
  console.log('2. Update TypeScript types');
  console.log('3. Update event service logic');
  console.log('4. Update frontend to handle date ranges');

} catch (error) {
  console.error('Migration failed:', error);
  db.exec('ROLLBACK');
  process.exit(1);
} finally {
  db.close();
}