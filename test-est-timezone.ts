import {
  toLocalTime,
  formatDate,
  createTimestamp,
  formatDateForDatabase,
  parseDateFromDatabase
} from '@/lib/date-utils';

async function runTests() {
  console.log('=== US Eastern Timezone Test Results ===\n');

  // Test current time
  const now = new Date();
  console.log('Current time (system):', now.toISOString());
  console.log('Current time (Eastern):', toLocalTime(now).toLocaleString('en-US', { timeZone: 'America/New_York' }));

  // Test specific date (non-DST)
  const winterDate = new Date('2024-01-15T10:30:00Z'); // January (EST)
  console.log('\nWinter date test (non-DST):');
  console.log('Input UTC:', winterDate.toISOString());
  console.log('Eastern formatted:', formatDate(winterDate, 'PPpp'));
  console.log('Database format:', formatDateForDatabase(winterDate));

  // Test specific date (DST)
  const summerDate = new Date('2024-07-15T10:30:00Z'); // July (EDT)
  console.log('\nSummer date test (DST):');
  console.log('Input UTC:', summerDate.toISOString());
  console.log('Eastern formatted:', formatDate(summerDate, 'PPpp'));
  console.log('Database format:', formatDateForDatabase(summerDate));

  // Test database storage and retrieval
  console.log('\nDatabase storage and retrieval test:');
  const timestamp = createTimestamp();
  console.log('Created timestamp:', timestamp);
  const parsedDate = parseDateFromDatabase(timestamp);
  console.log('Parsed from database:', formatDate(parsedDate, 'PPpp'));

  // Test edge cases around DST transitions
  const springForward = new Date('2024-03-10T06:30:00Z'); // Around spring DST
  const fallBack = new Date('2024-11-03T06:30:00Z'); // Around fall DST

  console.log('\nDST transition tests:');
  console.log('Spring forward (Mar 10):', formatDate(springForward, 'PPpp'));
  console.log('Fall back (Nov 3):', formatDate(fallBack, 'PPpp'));

  // Test form submission time
  const formDate = new Date();
  console.log('\nForm submission test:');
  console.log('Form date:', formDate.toISOString());
  console.log('Formatted for database:', formatDateForDatabase(formDate));
  console.log('Retrieved and displayed:', formatDate(parseDateFromDatabase(formatDateForDatabase(formDate)), 'PPpp'));
}

runTests().catch(console.error); 