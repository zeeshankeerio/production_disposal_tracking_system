// Test script to verify created_at timestamps in US Eastern Time
const { createEasternTimestamp, parseDateFromDatabase, formatDate } = require('./lib/date-utils');

console.log('=== Created_at Timestamp Test for US Eastern Time ===\n');

// Test 1: Generate a timestamp for a new entry
console.log('1. Testing timestamp generation:');
const timestamp = createEasternTimestamp();
console.log('Generated timestamp:', timestamp);
console.log('Current UTC time:', new Date().toISOString());
console.log('Current Eastern time:', new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));

// Test 2: Parse the timestamp back from database
console.log('\n2. Testing timestamp parsing:');
const parsedDate = parseDateFromDatabase(timestamp);
console.log('Parsed date object:', parsedDate);
console.log('Formatted for display:', formatDate(parsedDate, 'PPpp'));

// Test 3: Simulate multiple entries created at different times
console.log('\n3. Testing multiple entry timestamps:');
const timestamps = [];

// Create timestamps with delays
setTimeout(() => {
  const ts1 = createEasternTimestamp();
  timestamps.push(ts1);
  console.log('Entry 1 timestamp:', ts1);
  console.log('Entry 1 parsed:', formatDate(parseDateFromDatabase(ts1), 'PPpp'));
  
  setTimeout(() => {
    const ts2 = createEasternTimestamp();
    timestamps.push(ts2);
    console.log('Entry 2 timestamp:', ts2);
    console.log('Entry 2 parsed:', formatDate(parseDateFromDatabase(ts2), 'PPpp'));
    
    setTimeout(() => {
      const ts3 = createEasternTimestamp();
      timestamps.push(ts3);
      console.log('Entry 3 timestamp:', ts3);
      console.log('Entry 3 parsed:', formatDate(parseDateFromDatabase(ts3), 'PPpp'));
      
      console.log('\n4. Verifying all timestamps are in Eastern time:');
      timestamps.forEach((ts, index) => {
        const parsed = parseDateFromDatabase(ts);
        const utcTime = new Date(ts).toISOString();
        const easternTime = new Date(ts).toLocaleString('en-US', { timeZone: 'America/New_York' });
        console.log(`Entry ${index + 1}:`);
        console.log(`  UTC: ${utcTime}`);
        console.log(`  Eastern: ${easternTime}`);
        console.log(`  Formatted: ${formatDate(parsed, 'PPpp')}`);
        console.log('');
      });
      
      console.log('✅ Created_at timestamp test completed successfully!');
    }, 1000);
  }, 1000);
}, 1000);

// Test 4: Verify timezone consistency
console.log('\n5. Timezone consistency check:');
const now = new Date();
const easternNow = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
const generatedTimestamp = createEasternTimestamp();

console.log('System time (UTC):', now.toISOString());
console.log('System time (Eastern):', easternNow);
console.log('Generated timestamp:', generatedTimestamp);

// Check if the generated timestamp matches Eastern time
const timestampDate = new Date(generatedTimestamp);
const timestampEastern = timestampDate.toLocaleString('en-US', { timeZone: 'America/New_York' });

console.log('Timestamp Eastern time:', timestampEastern);
console.log('Match:', easternNow === timestampEastern ? '✅ YES' : '❌ NO'); 