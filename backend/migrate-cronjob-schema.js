#!/usr/bin/env node

const { Database } = require('bun:sqlite');
const { join } = require('path');

// Migration script to add missing columns to cronjob_config table
function migrateCronjobSchema() {
  const dbPath = join(process.cwd(), 'data', 'calendar.db');
  const db = new Database(dbPath);
  
  try {
    console.log('Starting cronjob_config table migration...');
    
    // Check if columns already exist
    const tableInfo = db.prepare("PRAGMA table_info(cronjob_config)").all();
    const existingColumns = tableInfo.map(col => col.name);
    
    console.log('Existing columns:', existingColumns);
    
    // Add missing columns if they don't exist
    if (!existingColumns.includes('notification_type')) {
      console.log('Adding notification_type column...');
      db.exec("ALTER TABLE cronjob_config ADD COLUMN notification_type TEXT NOT NULL DEFAULT 'daily' CHECK (notification_type IN ('daily', 'weekly'))");
    }
    
    if (!existingColumns.includes('weekly_days')) {
      console.log('Adding weekly_days column...');
      db.exec("ALTER TABLE cronjob_config ADD COLUMN weekly_days TEXT");
    }
    
    if (!existingColumns.includes('weekly_scope')) {
      console.log('Adding weekly_scope column...');
      db.exec("ALTER TABLE cronjob_config ADD COLUMN weekly_scope TEXT DEFAULT 'current_week' CHECK (weekly_scope IN ('current_week', 'next_week'))");
    }
    
    console.log('Migration completed successfully!');
    
    // Verify the migration
    const updatedTableInfo = db.prepare("PRAGMA table_info(cronjob_config)").all();
    console.log('Updated table structure:');
    updatedTableInfo.forEach(col => {
      console.log(`  ${col.name} (${col.type}) - Default: ${col.dflt_value || 'NULL'}`);
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

migrateCronjobSchema();