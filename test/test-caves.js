import { decodeCave, CAVE_NAMES, OBJECT, bdrandom } from '../src/caves.js';

console.log('Testing Commodore 64 Boulder Dash Cave Decoder...');

// Test PRNG determinism
const seeds1 = [0, 3];
const rand1 = bdrandom(seeds1);
const seeds2 = [0, 3];
const rand2 = bdrandom(seeds2);

if (rand1 !== rand2) {
  console.error(`PRNG determinism failed: ${rand1} !== ${rand2}`);
  process.exit(1);
}
console.log(`✓ PRNG determinism verified (seed 3 -> byte ${rand1})`);

// Test decoding all 20 caves across all 5 difficulty levels
let totalCells = 0;
for (let c = 0; c < 20; c++) {
  for (let diff = 0; diff < 5; diff++) {
    const cave = decodeCave(c, diff);
    if (cave.width !== 40 || cave.height !== 22) {
      console.error(`Cave ${CAVE_NAMES[c]} dimension mismatch: ${cave.width}x${cave.height}`);
      process.exit(1);
    }
    if (cave.grid.length !== 22 || cave.grid[0].length !== 40) {
      console.error(`Cave ${CAVE_NAMES[c]} grid array shape mismatch`);
      process.exit(1);
    }
    totalCells += 40 * 22;
  }
}
console.log(`✓ Decoded all 20 caves x 5 difficulties (100 combinations, ${totalCells} cells total)`);

// Test Cave A specific features
const caveA = decodeCave(0, 0);
console.log(`\n--- Cave A Analysis ---`);
console.log(`Name: ${caveA.name}`);
console.log(`Required diamonds: ${caveA.diamondsNeeded}`);
console.log(`Cave time: ${caveA.caveTime} seconds`);
console.log(`Colors: Dirt=${caveA.colors.color1.name}, Steel=${caveA.colors.color2.name}`);

// Count elements
const counts = {};
let foundInbox = false;
let foundExit = false;

for (let y = 0; y < caveA.height; y++) {
  for (let x = 0; x < caveA.width; x++) {
    const obj = caveA.grid[y][x];
    counts[obj.name] = (counts[obj.name] || 0) + 1;
    if (obj === OBJECT.PREROCKFORD1) foundInbox = true;
    if (obj === OBJECT.PREOUTBOX) foundExit = true;
  }
}

console.log('Object counts in Cave A:');
for (const [k, v] of Object.entries(counts)) {
  console.log(`  ${k.padEnd(15)}: ${v}`);
}

if (!foundInbox) {
  console.error('Expected inbox in Cave A!');
  process.exit(1);
}
if (!foundExit) {
  console.error('Expected exit in Cave A!');
  process.exit(1);
}

// Check perimeter steel wall
for (let x = 0; x < 40; x++) {
  if (caveA.grid[0][x] !== OBJECT.STEELWALL || caveA.grid[21][x] !== OBJECT.STEELWALL) {
    console.error(`Perimeter steel wall broken at column ${x}`);
    process.exit(1);
  }
}
for (let y = 0; y < 22; y++) {
  if (caveA.grid[y][0] !== OBJECT.STEELWALL || caveA.grid[y][39] !== OBJECT.STEELWALL) {
    console.error(`Perimeter steel wall broken at row ${y}`);
    process.exit(1);
  }
}
console.log('✓ Perimeter steel wall intact around all 4 borders');
console.log('✓ Inbox and Exit placed correctly');
console.log('\nAll Cave Decoder Tests PASSED!');
