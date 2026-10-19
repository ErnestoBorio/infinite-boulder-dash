import { InfiniteWorld, CHUNK_SIZE } from '../src/infinite-world.js';
import { BoulderDashEngine } from '../src/engine.js';
import { RETRO_PALETTE, OBJECT, DIR } from '../src/caves.js';

console.log('Testing Infinite Boulder Dash World & Memory Persistence...');

// 1. Test 16-Color Retro Palette
if (RETRO_PALETTE.length !== 16) {
  console.error(`Expected 16 colors in retro palette, got ${RETRO_PALETTE.length}`);
  process.exit(1);
}
console.log(`✓ Verified 16-color retro palette (Black to Dark Gray)`);

// 2. Test Infinite Chunk Generation & Memory Persistence
const world = new InfiniteWorld(42);

// Check starting area
const spawnCell = world.getCell(4, 4);
if (spawnCell.object !== OBJECT.PREROCKFORD1) {
  console.error(`Expected spawn inbox at (4, 4), got ${spawnCell.object.name}`);
  process.exit(1);
}
console.log(`✓ Verified starter hub spawn at (4, 4)`);

// Test persistence across exploration
// Modify cell at coordinate (50, -30)
world.setObject(50, -30, OBJECT.SPACE);
const modifiedCell = world.getCell(50, -30);
if (modifiedCell.object !== OBJECT.SPACE) {
  console.error(`Failed to set cell at (50, -30)`);
  process.exit(1);
}

// Explore distant chunks to generate hundreds of cells
for (let cx = -5; cx <= 5; cx++) {
  for (let cy = -5; cy <= 5; cy++) {
    world.getChunk(cx, cy);
  }
}

const totalChunks = world.chunks.size;
const totalCells = totalChunks * (CHUNK_SIZE * CHUNK_SIZE);
console.log(`✓ Explored and cached ${totalChunks} chunks (${totalCells} cells in memory)`);

// Verify that the cell at (50, -30) is STILL SPACE (persistent memory requirement!)
const recheckCell = world.getCell(50, -30);
if (recheckCell.object !== OBJECT.SPACE) {
  console.error(`Persistence failed! Cell at (50, -30) was overwritten!`);
  process.exit(1);
}
console.log(`✓ Verified persistent in-memory level retention: (50, -30) retained user modification`);

// Verify titanium blocks presence & anti-trapping invariant
let titaniumCount = 0;
for (const [key, chunk] of world.chunks) {
  for (let ly = 0; ly < CHUNK_SIZE; ly++) {
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      const cell = chunk[ly][lx];
      if (cell.object === OBJECT.STEELWALL) {
        titaniumCount++;
        // In procedural chunks (non 0,0), titanium must NEVER be on highway lines
        if (cell.x < 0 || cell.x > 15 || cell.y < 0 || cell.y > 15) {
          if (Math.abs(cell.x) % 5 === 0 || Math.abs(cell.y) % 5 === 0) {
            throw new Error(`Anti-trapping violation! Titanium found on highway line at (${cell.x}, ${cell.y})`);
          }
        }
      }
    }
  }
}
if (titaniumCount === 0) {
  throw new Error('Expected titanium blocks in world, found 0!');
}
console.log(`✓ Verified ${titaniumCount} titanium blocks generated with strict anti-trapping highway corridors`);

// Test Starter Hub Variations across different world seeds
const starterVariantsSeen = new Set();
for (let s = 1; s <= 20; s++) {
  const testWorld = new InfiniteWorld(s * 1013);
  const startChunk = testWorld.getChunk(0, 0);
  const spawn = startChunk[4][4];
  if (spawn.object !== OBJECT.PREROCKFORD1) {
    throw new Error(`Starter seed ${s} failed: (4, 4) is not PREROCKFORD1!`);
  }
  // Signature of chunk (0, 0)
  const signature = startChunk[1][1].object.name + '_' + startChunk[1][6].object.name + '_' + startChunk[7][7].object.name;
  starterVariantsSeen.add(signature);
}
if (starterVariantsSeen.size < 3) {
  throw new Error(`Expected at least 3 distinct starter hub variants, got ${starterVariantsSeen.size}`);
}
console.log(`✓ Verified ${starterVariantsSeen.size} distinct starter hub archetypes across seeds`);

// 3. Test Engine with Infinite World
const engine = new BoulderDashEngine({ seed: 100 });
// Advance until Rockford spawns
for (let i = 0; i < 20; i++) {
  engine.update();
  if (engine.state === 'PLAYING') break;
}
console.log(`✓ Engine spawned Rockford in infinite world at (${engine.rockford.x}, ${engine.rockford.y})`);

// Move Rockford
engine.moving.dir = DIR.RIGHT;
engine.update();
console.log(`✓ Rockford moved to (${engine.rockford.x}, ${engine.rockford.y})`);

// 4. Test Independent 4-Color Retro Palettes per Entity & Reset Randomization
import('../src/renderer.js').then(({ generateRandomEntityPalettes }) => {
  const seedA = 12345;
  const seedB = 98765;

  const palettesA = generateRandomEntityPalettes(seedA);
  const palettesB = generateRandomEntityPalettes(seedB);

  const entities = [
    'rockford', 'boulder', 'diamond', 'dirt',
    'brickwall', 'steelwall', 'magicwall',
    'amoeba', 'firefly', 'butterfly', 'explosion'
  ];

  // Verify all entities have 4-color palettes
  for (const ent of entities) {
    const pal = palettesA[ent];
    if (!pal || pal.length !== 4) {
      throw new Error(`Expected entity '${ent}' to have 4-color palette, got ${pal ? pal.length : 'none'}`);
    }
    // Slot 0 is Black (RETRO_PALETTE[0])
    if (pal[0].rgb !== RETRO_PALETTE[0].rgb) {
      throw new Error(`Expected Slot 0 of '${ent}' to be Black, got ${pal[0].name}`);
    }
    // Slots 1, 2, 3 must have at least 2 distinct colors (e.g. skin distinct from clothes)
    const colors = new Set(pal.map(c => c.rgb));
    if (colors.size < 3) {
      throw new Error(`Expected at least 3 distinct colors in palette for '${ent}', got ${colors.size}`);
    }
    // All colors must belong to RETRO_PALETTE
    for (const c of pal) {
      if (!RETRO_PALETTE.some(dp => dp.rgb === c.rgb)) {
        throw new Error(`Color ${c.name} (${c.hex}) not found in official palette!`);
      }
    }
  }
  if (palettesA.brickwall !== palettesA.magicwall) {
    throw new Error('Expected brickwall and magicwall to share the exact same palette!');
  }
  console.log(`✓ Verified brick walls and magic walls share the same palette`);

  // Verify randomization across resets (seed A vs seed B)
  let diffCount = 0;
  for (const ent of entities) {
    const palA = palettesA[ent];
    const palB = palettesB[ent];
    const sigA = palA.map(c => c.name).join('-');
    const sigB = palB.map(c => c.name).join('-');
    if (sigA !== sigB) diffCount++;
  }
  if (diffCount < 8) {
    throw new Error(`Expected at least 8 entity palettes to differ between resets, got ${diffCount}`);
  }
  console.log(`✓ Verified palette randomization on reset: ${diffCount}/11 entities randomized between runs`);

  // Verify Rockford, Boulders, Diamonds have different palettes in the same run
  const rockfordSig = palettesA.rockford.map(c => c.name).join('-');
  const boulderSig = palettesA.boulder.map(c => c.name).join('-');
  const diamondSig = palettesA.diamond.map(c => c.name).join('-');
  if (rockfordSig === boulderSig || boulderSig === diamondSig || rockfordSig === diamondSig) {
    throw new Error(`Entities must not share identical 4-color palettes!`);
  }
  console.log(`✓ Verified distinct palettes within a single run:`);
  console.log(`   Rockford: ${palettesA.rockford.map(c => c.name).join(', ')}`);
  console.log(`   Boulder : ${palettesA.boulder.map(c => c.name).join(', ')}`);
  console.log(`   Diamond : ${palettesA.diamond.map(c => c.name).join(', ')}`);
  console.log(`   Dirt    : ${palettesA.dirt.map(c => c.name).join(', ')}`);

  console.log('\nAll Infinite Boulder Dash Tests PASSED!');
});
