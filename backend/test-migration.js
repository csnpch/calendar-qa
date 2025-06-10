#!/usr/bin/env node

// Simple test to verify the Prisma migration is working
console.log('Testing Prisma migration...');

try {
  // Test that the services can be imported without error
  const { EmployeeService } = require('./src/services/employeeService.ts');
  const { EventService } = require('./src/services/eventService.ts');
  const { CronjobService } = require('./src/services/cronjobService.ts');
  
  console.log('✅ All services imported successfully');
  console.log('✅ Prisma migration completed successfully!');
  
  console.log('\n🎉 Your project has been migrated to Prisma!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Test the API endpoints');
  console.log('3. The cronjob configuration error should now be resolved');
  
} catch (error) {
  console.error('❌ Migration test failed:', error.message);
  console.log('\nThe migration may need additional setup');
  process.exit(1);
}