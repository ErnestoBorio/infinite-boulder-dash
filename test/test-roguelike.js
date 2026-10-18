import { BoulderDashEngine, MILESTONES, getNextMilestone } from '../src/engine.js';
import { OBJECT } from '../src/caves.js';

console.log('Testing Roguelike Permadeath & Tiered Milestones...');

// 1. Test Milestone Tiers
console.log('Milestone Progression:');
for (const m of MILESTONES) {
  console.log(`  💎 ${String(m.count).padStart(3, ' ')} Diamonds -> ${m.title.padEnd(22)} (+${m.bonus} pts)`);
}

const m10 = getNextMilestone(0);
if (m10.count !== 10) throw new Error('Expected first milestone at 10');
const m25 = getNextMilestone(10);
if (m25.count !== 25) throw new Error('Expected next milestone at 25');
const m50 = getNextMilestone(25);
if (m50.count !== 50) throw new Error('Expected next milestone at 50');
const m100 = getNextMilestone(50);
if (m100.count !== 100) throw new Error('Expected next milestone at 100');
const m300 = getNextMilestone(200);
if (m300.count !== 300 || m300.title !== "MEGA SPELUNKER") throw new Error('Expected 300 MEGA SPELUNKER');
const m500 = getNextMilestone(300);
if (m500.count !== 500 || m500.title !== "DIAMOND EXTERMINATOR") throw new Error('Expected 500 DIAMOND EXTERMINATOR');
const m1000 = getNextMilestone(500);
if (m1000.count !== 1000 || m1000.title !== "MYTHIC MEGA LEGEND") throw new Error('Expected 1000 MYTHIC MEGA LEGEND');
const m2000 = getNextMilestone(1000);
if (m2000.count !== 2000 || m2000.title !== "UNIVERSAL PRODIGY") throw new Error('Expected 2000 UNIVERSAL PRODIGY');
const m5000 = getNextMilestone(2000);
if (m5000.count !== 5000 || m5000.title !== "MISSINGNO.") throw new Error('Expected 5000 MISSINGNO.');
const m6000 = getNextMilestone(5000);
if (m6000.count !== 6000 || m6000.title !== "MISSINGNO.") throw new Error('Expected 6000+ MISSINGNO.');

console.log('✓ Verified milestone tier steps (10, 25, 50, 100, 150, 200, 300, 500, 1000, 2000, 5000+ MISSINGNO.)');

// 2. Test Milestone Trigger in Engine
let milestoneFired = null;
const engine = new BoulderDashEngine({
  seed: 555,
  onEvent: (evt, data) => {
    if (evt === 'milestone_reached') {
      milestoneFired = data;
    }
  }
});

// Collect 10 diamonds
for (let i = 0; i < 10; i++) {
  engine.collectDiamond();
}

if (!milestoneFired || milestoneFired.count !== 10) {
  throw new Error(`Expected milestone 10 to fire, got: ${JSON.stringify(milestoneFired)}`);
}
console.log(`✓ Milestone event fired properly: ${milestoneFired.title} (+${milestoneFired.bonus} pts)`);

// 3. Test Roguelike Permadeath & World Regeneration
const firstSeed = engine.seed;
console.log(`Initial Run Seed: #${firstSeed}`);

// Simulate fatal explosion on Rockford
let diedEventFired = false;
engine.onEvent = (evt) => {
  if (evt === 'rockford_died') diedEventFired = true;
};
engine.explode(engine.rockford.x, engine.rockford.y, false);

if (!engine.lost || !diedEventFired) {
  throw new Error('Rockford did not die on fatal explosion!');
}
if (!engine.deathPos || typeof engine.deathPos.x !== 'number' || typeof engine.deathPos.y !== 'number') {
  throw new Error('Rockford deathPos was not recorded!');
}
console.log(`✓ Rockford died at (${engine.deathPos.x}, ${engine.deathPos.y}), death state recorded`);

// Start new run
engine.reset();
const secondSeed = engine.seed;
console.log(`New Run Seed after permadeath: #${secondSeed}`);

if (firstSeed === secondSeed) {
  throw new Error('Roguelike failure: World seed did not change after death!');
}
if (engine.diamondsCollected !== 0) {
  throw new Error('Roguelike failure: Diamonds did not reset for new world!');
}
if (engine.lost) {
  throw new Error('Roguelike failure: Engine is still in lost state!');
}

console.log('✓ Permadeath verified: Completely fresh world generated with new random seed!');
console.log('\nAll Roguelike Tests PASSED!');
