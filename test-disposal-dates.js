import { toEastern, formatDate, createTimestamp } from './lib/date-utils.js';

console.log('🔍 DISPOSAL ENTRIES DATE VERIFICATION');
console.log('=====================================\n');

// Test current timestamp creation
console.log('1. Testing timestamp creation:');
const currentTimestamp = createTimestamp();
console.log('   Current timestamp:', currentTimestamp);
console.log('   Current Eastern time:', formatDate(new Date(), "PPP p"));
console.log('');

// Test date formatting
console.log('2. Testing date formatting:');
const testDate = new Date();
const easternDate = toEastern(testDate);
console.log('   Original date:', testDate.toISOString());
console.log('   Eastern date:', easternDate.toISOString());
console.log('   Formatted (medium):', formatDate(testDate, "medium"));
console.log('   Formatted (PPP p):', formatDate(testDate, "PPP p"));
console.log('');

// Test disposal entry creation simulation
console.log('3. Testing disposal entry creation:');
const disposalEntry = {
  id: 'test-123',
  product_name: 'Test Product',
  quantity: 50,
  date: new Date(), // Entry date
  shift: 'afternoon',
  reason: 'Expired',
  staff_name: 'Test User',
  notes: 'Test disposal entry',
  created_at: new Date() // Should be set when entry is created
};

console.log('   Entry date (original):', disposalEntry.date.toISOString());
console.log('   Entry date (Eastern):', toEastern(disposalEntry.date).toISOString());
console.log('   Entry date (formatted):', formatDate(disposalEntry.date, "medium"));
console.log('   Created at (original):', disposalEntry.created_at.toISOString());
console.log('   Created at (Eastern):', toEastern(disposalEntry.created_at).toISOString());
console.log('   Created at (formatted):', formatDate(disposalEntry.created_at, "PPP p"));
console.log('');

// Check if dates match (they should be very close, within a few seconds)
const dateDiff = Math.abs(disposalEntry.date.getTime() - disposalEntry.created_at.getTime());
console.log('4. Date comparison:');
console.log('   Time difference (ms):', dateDiff);
console.log('   Time difference (seconds):', Math.round(dateDiff / 1000));
console.log('   Dates match (within 5 seconds):', dateDiff <= 5000 ? '✅ YES' : '❌ NO');
console.log('');

// Test with specific date
console.log('5. Testing with specific date:');
const specificDate = new Date('2024-06-19T14:30:00Z');
const specificEastern = toEastern(specificDate);
console.log('   Specific date (UTC):', specificDate.toISOString());
console.log('   Specific date (Eastern):', specificEastern.toISOString());
console.log('   Formatted (medium):', formatDate(specificDate, "medium"));
console.log('   Formatted (PPP p):', formatDate(specificDate, "PPP p"));
console.log('');

console.log('✅ Date verification test completed!'); 