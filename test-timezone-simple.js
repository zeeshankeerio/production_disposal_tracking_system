// Simple timezone test for US Eastern Time
console.log('=== US Eastern Timezone Test ===\n');

// Test current time
const now = new Date();
console.log('Current UTC time:', now.toISOString());
console.log('Current Eastern time:', now.toLocaleString('en-US', { timeZone: 'America/New_York' }));

// Test winter date (EST)
const winterDate = new Date('2024-01-15T10:30:00Z');
console.log('\nWinter date (Jan 15, 2024):');
console.log('UTC:', winterDate.toISOString());
console.log('Eastern:', winterDate.toLocaleString('en-US', { timeZone: 'America/New_York' }));

// Test summer date (EDT)
const summerDate = new Date('2024-07-15T10:30:00Z');
console.log('\nSummer date (Jul 15, 2024):');
console.log('UTC:', summerDate.toISOString());
console.log('Eastern:', summerDate.toLocaleString('en-US', { timeZone: 'America/New_York' }));

// Test DST transitions
const springForward = new Date('2024-03-10T06:30:00Z');
const fallBack = new Date('2024-11-03T06:30:00Z');

console.log('\nDST Transition Tests:');
console.log('Spring Forward (Mar 10):', springForward.toLocaleString('en-US', { timeZone: 'America/New_York' }));
console.log('Fall Back (Nov 3):', fallBack.toLocaleString('en-US', { timeZone: 'America/New_York' }));

// Test database format
const dbFormat = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
console.log('\nDatabase format:', dbFormat);

console.log('\n✅ Timezone test completed successfully!'); 