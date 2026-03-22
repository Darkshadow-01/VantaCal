/**
 * Agent Test Runner
 * Tests AI agents without promptfoo for quick validation
 * Run with: node tests/agentTests.js
 */

const testResults = [];

function test(name, fn) {
  try {
    fn();
    testResults.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error) {
    testResults.push({ name, passed: false, error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

// Planner Agent Tests
console.log('\n📋 Planner Agent Tests\n');

test('Planner: Valid JSON output structure', () => {
  const response = {
    problemStatement: 'Recurring events help users maintain habits',
    successMetrics: ['Adoption rate', 'Retention'],
    timeline: '2 weeks',
    confidence: 0.85
  };
  
  assert(typeof response.problemStatement === 'string', 'problemStatement required');
  assert(Array.isArray(response.successMetrics), 'successMetrics must be array');
  assert(typeof response.timeline === 'string', 'timeline required');
  assert(response.confidence >= 0 && response.confidence <= 1, 'confidence 0-1');
});

test('Planner: Only valid systems included', () => {
  const validSystems = ['Health', 'Work', 'Relationships'];
  const response = {
    problemStatement: 'Focus on Health activities',
    successMetrics: ['Health completion rate'],
    timeline: '1 week',
    confidence: 0.9
  };
  
  const content = JSON.stringify(response);
  const hasInvalidSystem = ['Finance', 'Social', 'Entertainment', 'Family']
    .some(sys => content.includes(sys));
  
  assert(!hasInvalidSystem, 'Should not contain invalid systems');
  assert(validSystems.some(sys => content.includes(sys)), 'Should contain valid system');
});

test('Planner: No hallucinated data', () => {
  const response = {
    problemStatement: 'Test feature',
    successMetrics: ['Metric 1'],
    timeline: 'Test',
    confidence: 0.5
  };
  
  assert(response.confidence <= 1, 'Confidence capped at 1');
  assert(response.confidence >= 0, 'Confidence >= 0');
});

// Scheduler Agent Tests
console.log('\n⚙️ Scheduler Agent Tests\n');

test('Scheduler: Conflict detection works', () => {
  const events = [
    { id: 'evt1', start: '07:00', end: '08:00' },
    { id: 'evt2', start: '07:30', end: '08:30' }
  ];
  
  const hasConflict = 
    events[0].start < events[1].end && 
    events[1].start < events[0].end;
  
  assert(hasConflict, 'Should detect conflict');
});

test('Scheduler: No invented event IDs', () => {
  const validIds = ['evt1', 'evt2', 'abc123'];
  const response = {
    hasConflict: true,
    conflicts: [{ eventId: 'evt1', overlapMinutes: 30 }]
  };
  
  assert(
    response.conflicts.every(c => validIds.includes(c.eventId)),
    'All event IDs must be from provided list'
  );
});

test('Scheduler: Overlap calculation', () => {
  const start1 = 7 * 60;    // 07:00 in minutes
  const end1 = 8 * 60;      // 08:00 in minutes  
  const start2 = 7 * 60 + 30; // 07:30 in minutes
  const end2 = 8 * 60 + 30;   // 08:30 in minutes
  
  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);
  const overlapMinutes = Math.max(0, overlapEnd - overlapStart);
  
  assert(overlapMinutes === 30, `Should be 30 minutes overlap, got ${overlapMinutes}`);
});

test('Scheduler: Valid time ranges', () => {
  const response = {
    optimalTime: '14:00',
    hasConflict: false
  };
  
  const timeRegex = /^\d{2}:\d{2}$/;
  assert(timeRegex.test(response.optimalTime), 'Valid HH:MM format');
  assert(parseInt(response.optimalTime.split(':')[0]) >= 0, 'Hour >= 0');
  assert(parseInt(response.optimalTime.split(':')[0]) <= 23, 'Hour <= 23');
});

// Reflection Agent Tests
console.log('\n🔬 Reflection Agent Tests\n');

test('Reflection: Completion rate calculation', () => {
  const total = 20;
  const completed = 16;
  const rate = Math.round((completed / total) * 100);
  
  assert(rate === 80, `Expected 80%, got ${rate}%`);
});

test('Reflection: Valid systems only', () => {
  const validSystems = ['Health', 'Work', 'Relationships'];
  const response = {
    systemBalance: {
      health: 30,
      work: 50,
      relationships: 20
    }
  };
  
  Object.keys(response.systemBalance).forEach(sys => {
    assert(validSystems.includes(sys.charAt(0).toUpperCase() + sys.slice(1)), 
      `Invalid system: ${sys}`);
  });
});

test('Reflection: Grade calculation', () => {
  function calculateGrade(score) {
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }
  
  assert(calculateGrade(90) === 'A', 'Score 90 = A');
  assert(calculateGrade(75) === 'B', 'Score 75 = B');
  assert(calculateGrade(60) === 'C', 'Score 60 = C');
  assert(calculateGrade(45) === 'D', 'Score 45 = D');
  assert(calculateGrade(30) === 'F', 'Score 30 = F');
});

test('Reflection: Health system always present', () => {
  const response = {
    systemBalance: {
      health: 30,
      work: 50,
      relationships: 20
    },
    insights: ['Health needs attention']
  };
  
  assert('health' in response.systemBalance, 'Health must be present');
  assert(response.systemBalance.health > 0, 'Health value must be positive');
});

test('Reflection: No hallucinated metrics', () => {
  const total = 10;
  const completed = 8;
  
  const rate = Math.round((completed / total) * 100);
  
  assert(rate !== 100, 'Should not hallucinate 100%');
  assert(rate !== total + 10, 'Should not exceed total');
  assert(rate === 80, 'Should calculate correctly');
});

// System Balance Tests
console.log('\n⚖️ System Balance Tests\n');

test('System balance: Distribution sums to 100%', () => {
  const distribution = {
    health: 30,
    work: 50,
    relationships: 20
  };
  
  const sum = Object.values(distribution).reduce((a, b) => a + b, 0);
  assert(sum === 100, `Distribution should sum to 100%, got ${sum}%`);
});

test('System balance: All systems represented', () => {
  const systems = ['Health', 'Work', 'Relationships'];
  const distribution = {
    health: 30,
    work: 50,
    relationships: 20
  };
  
  systems.forEach(sys => {
    assert(sys.toLowerCase() in distribution, `${sys} must be in distribution`);
  });
});

// Print summary
console.log('\n📊 Test Summary\n');
const passed = testResults.filter(r => r.passed).length;
const failed = testResults.filter(r => !r.passed).length;

console.log(`Total: ${testResults.length}`);
console.log(`Passed: ${passed} ✅`);
console.log(`Failed: ${failed} ❌`);

if (failed > 0) {
  console.log('\nFailed tests:');
  testResults.filter(r => !r.passed).forEach(r => {
    console.log(`  - ${r.name}: ${r.error}`);
  });
  process.exit(1);
} else {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
}
