import { BoulderDashEngine } from '../src/engine.js';
import { OBJECT, DIR } from '../src/caves.js';

console.log('Testing Boulder Dash Physics Engine...');

const engine = new BoulderDashEngine({ caveIndex: 0, difficulty: 0 });

console.log(`Initial state: ${engine.state}`);
// Step until Rockford spawns (birth stages 1 to 4)
for (let i = 0; i < 20; i++) {
  engine.update();
  if (engine.state === 'PLAYING') break;
}

if (engine.state !== 'PLAYING') {
  console.error('Rockford failed to spawn!');
  process.exit(1);
}
console.log(`✓ Rockford spawned at (${engine.rockford.x}, ${engine.rockford.y})`);

// Test moving Rockford
const startPos = { ...engine.rockford };
engine.moving.dir = DIR.RIGHT;
engine.update();
console.log(`Rockford moved to (${engine.rockford.x}, ${engine.rockford.y})`);

if (engine.rockford.x === startPos.x && engine.rockford.y === startPos.y) {
  console.error('Rockford did not move!');
  process.exit(1);
}
console.log('✓ Rockford movement verified');

// Test diamond collection score
const initScore = engine.score;
const initDiamonds = engine.diamondsCollected;
// Simulate putting diamond in front of Rockford and moving into it
const targetX = engine.rockford.x + 1;
const targetY = engine.rockford.y;
engine.set(targetX, targetY, OBJECT.DIAMOND);
engine.moving.dir = DIR.RIGHT;
engine.update();

if (engine.diamondsCollected !== initDiamonds + 1) {
  console.error(`Diamond count mismatch: ${engine.diamondsCollected}`);
  process.exit(1);
}
if (engine.score <= initScore) {
  console.error(`Score did not increase: ${engine.score}`);
  process.exit(1);
}
console.log(`✓ Diamond collection verified: diamonds=${engine.diamondsCollected}, score=${engine.score}`);

// Test boulder falling physics
const testEngine = new BoulderDashEngine({ caveIndex: 0, difficulty: 0 });
testEngine.set(10, 5, OBJECT.BOULDER);
testEngine.set(10, 6, OBJECT.SPACE);
testEngine.set(10, 7, OBJECT.STEELWALL);
testEngine.update(); // Boulder enters BOULDERFALLING
testEngine.update(); // Boulder falls into (10, 6)

const objBelow = testEngine.get(10, 6);
if (objBelow !== OBJECT.BOULDER && objBelow !== OBJECT.BOULDERFALLING) {
  console.error(`Boulder did not fall: got ${objBelow.name}`);
  process.exit(1);
}
console.log(`✓ Boulder gravity verified`);

console.log('\nAll Physics Engine Tests PASSED!');
