import Database from 'better-sqlite3';

declare global {
  var mockDatabase: Database.Database;
}