// Test script to verify created_at timestamps for entries
console.log('=== Testing Entries and Created_at Timestamps ===\n');

// Simulate the createEasternTimestamp function
function createEasternTimestamp() {
  const now = new Date();
  return now.toLocaleString('en-US', { timeZone: 'America/New_York' });
}

// Simulate the formatDate function
function formatDate(date, format) {
  if (!date) return "N/A";
  
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    return "Invalid Date";
  }
}

// Test 1: Generate timestamps for new entries
console.log('1. Testing timestamp generation for new entries:');
const entry1Timestamp = createEasternTimestamp();
const entry2Timestamp = createEasternTimestamp();
const entry3Timestamp = createEasternTimestamp();

console.log('Entry 1 created_at:', entry1Timestamp);
console.log('Entry 2 created_at:', entry2Timestamp);
console.log('Entry 3 created_at:', entry3Timestamp);

// Test 2: Format timestamps for display
console.log('\n2. Testing timestamp formatting for display:');
console.log('Entry 1 formatted:', formatDate(entry1Timestamp, 'PPpp'));
console.log('Entry 2 formatted:', formatDate(entry2Timestamp, 'PPpp'));
console.log('Entry 3 formatted:', formatDate(entry3Timestamp, 'PPpp'));

// Test 3: Verify timezone consistency
console.log('\n3. Verifying timezone consistency:');
const now = new Date();
const currentEastern = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
console.log('Current system time (UTC):', now.toISOString());
console.log('Current Eastern time:', currentEastern);

// Test 4: Simulate database storage and retrieval
console.log('\n4. Testing database storage and retrieval:');
const timestamps = [entry1Timestamp, entry2Timestamp, entry3Timestamp];

timestamps.forEach((timestamp, index) => {
  console.log(`Entry ${index + 1}:`);
  console.log(`  Stored in DB: "${timestamp}"`);
  console.log(`  Retrieved and formatted: ${formatDate(timestamp, 'PPpp')}`);
  console.log(`  UTC equivalent: ${new Date(timestamp).toISOString()}`);
  console.log('');
});

// Test 5: Test different date scenarios
console.log('5. Testing different date scenarios:');
const testDates = [
  new Date('2024-01-15T10:30:00Z'), // Winter (EST)
  new Date('2024-07-15T10:30:00Z'), // Summer (EDT)
  new Date('2024-03-10T06:30:00Z'), // DST transition
  new Date('2024-11-03T06:30:00Z')  // DST transition
];

testDates.forEach((date, index) => {
  const easternTime = date.toLocaleString('en-US', { timeZone: 'America/New_York' });
  console.log(`Scenario ${index + 1}:`);
  console.log(`  UTC: ${date.toISOString()}`);
  console.log(`  Eastern: ${easternTime}`);
  console.log(`  Formatted: ${formatDate(easternTime, 'PPpp')}`);
  console.log('');
});

console.log('✅ Entries and created_at timestamp test completed!');
console.log('\n📝 Next steps:');
console.log('1. Open http://localhost:3001 in your browser');
console.log('2. Go to /production or /disposal');
console.log('3. Create a new entry');
console.log('4. Check that the created_at timestamp shows current US Eastern time');
console.log('5. View the entry details to verify the timestamp display'); 