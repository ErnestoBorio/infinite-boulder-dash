/**
 * Infinite Boulder Dash - Infinite Procedural World Manager
 * Generates and permanently persists cave chunks in memory as Rockford explores.
 */

import { OBJECT, DIR } from './caves.js';

export const CHUNK_SIZE = 16;

/**
 * High-quality 32-bit integer hash function for procedural generation.
 */
function hashCoords(x, y, seed = 1337) {
  let h = (seed + x * 374761393 + y * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

function randFloat(x, y, seed = 1337) {
  return (hashCoords(x, y, seed) >>> 0) / 4294967296.0;
}

export class InfiniteWorld {
  constructor(seed = 42) {
    this.seed = seed;
    // Map of chunkKey -> Array of cells [y][x]
    this.chunks = new Map();
  }

  getChunkKey(cx, cy) {
    return `${cx},${cy}`;
  }

  getChunk(cx, cy) {
    const key = this.getChunkKey(cx, cy);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = this.generateChunk(cx, cy);
      this.chunks.set(key, chunk);
    }
    return chunk;
  }

  generateChunk(cx, cy) {
    const chunk = [];
    const originX = cx * CHUNK_SIZE;
    const originY = cy * CHUNK_SIZE;

    // 1. Generate base procedural cave matrix
    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      chunk[ly] = [];
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const gx = originX + lx;
        const gy = originY + ly;

        let obj = OBJECT.DIRT;

        const r = randFloat(gx, gy, this.seed);
        const rStructure = randFloat(gx, gy, this.seed + 101);
        const rEntity = randFloat(gx, gy, this.seed + 202);

        // Titanium blocks (STEELWALL): Indestructible bedrock pillars and seams
        // Anti-trapping invariant: Titanium is strictly forbidden on orthogonal highway lines
        const isTitaniumForbidden = (Math.abs(gx) % 5 === 0) || (Math.abs(gy) % 5 === 0);

        if (!isTitaniumForbidden && rStructure < 0.04) {
          obj = OBJECT.STEELWALL;
        } else if (rStructure < 0.07) {
          obj = OBJECT.BRICKWALL;
        } else if (rStructure < 0.08) {
          obj = OBJECT.MAGICWALL;
        } else if (r < 0.16) {
          obj = OBJECT.BOULDER;
        } else if (r < 0.25) {
          obj = OBJECT.DIAMOND;
        } else if (r < 0.35) {
          if (rEntity < 0.03) {
            obj = OBJECT.FIREFLY1;
          } else if (rEntity < 0.06) {
            obj = OBJECT.BUTTERFLY1;
          } else if (rEntity < 0.07) {
            obj = OBJECT.AMOEBA;
          } else {
            obj = OBJECT.SPACE;
          }
        } else {
          obj = OBJECT.DIRT;
        }

        chunk[ly][lx] = {
          x: gx,
          y: gy,
          object: obj,
          scanned: false,
          invalid: true
        };
      }
    }

    // 2. Origin Chunk (0, 0): Apply one of 5 varied Starter Hub archetypes
    if (cx === 0 && cy === 0) {
      this.applyStarterHub(chunk, this.seed);
    } else {
      // 3. Procedural Chunks: Apply structure clusters (tunnels, labyrinths, buildings, vaults, pillar halls)
      this.applyClusterIfPresent(chunk, cx, cy);
    }

    return chunk;
  }

  /**
   * Helper to safely set a cell inside chunk boundaries, strictly adhering to anti-trapping rules.
   */
  setChunkCell(chunk, lx, ly, obj) {
    if (lx < 0 || lx >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_SIZE) return;
    const cell = chunk[ly][lx];
    // Anti-trapping rule: never place titanium on highway coordinates
    if (obj === OBJECT.STEELWALL && (Math.abs(cell.x) % 5 === 0 || Math.abs(cell.y) % 5 === 0)) {
      cell.object = OBJECT.BRICKWALL;
    } else {
      cell.object = obj;
    }
  }

  /**
   * Generates varied starter hubs based on world seed.
   * Rockford always spawns safely at (4, 4) with guaranteed exits.
   */
  applyStarterHub(chunk, seed) {
    const variant = Math.abs(hashCoords(0, 0, seed)) % 5;

    // Base clear of spawn room around (4, 4)
    for (let ly = 1; ly <= 7; ly++) {
      for (let lx = 1; lx <= 7; lx++) {
        this.setChunkCell(chunk, lx, ly, OBJECT.DIRT);
      }
    }

    switch (variant) {
      case 0:
        // Variant 0: The Quad-Gate Fortress (Classic fortified outpost)
        for (let i = 1; i <= 14; i++) {
          const isDoorway = (i >= 6 && i <= 8);
          const wallObj = isDoorway ? OBJECT.SPACE : OBJECT.STEELWALL;
          this.setChunkCell(chunk, i, 1, wallObj);
          this.setChunkCell(chunk, i, 14, wallObj);
          this.setChunkCell(chunk, 1, i, wallObj);
          this.setChunkCell(chunk, 14, i, wallObj);
        }
        break;

      case 1:
        // Variant 1: The Crossroad Nexus (Grand open cross intersection with corner vaults)
        // Clear horizontal and vertical cross-avenues
        for (let i = 0; i < CHUNK_SIZE; i++) {
          for (let w = 3; w <= 6; w++) {
            this.setChunkCell(chunk, i, w, randFloat(i, w, seed) < 0.6 ? OBJECT.SPACE : OBJECT.DIRT);
            this.setChunkCell(chunk, w, i, randFloat(w, i, seed) < 0.6 ? OBJECT.SPACE : OBJECT.DIRT);
          }
        }
        // Corner protective brick walls with diamond caches
        this.setChunkCell(chunk, 11, 3, OBJECT.DIAMOND);
        this.setChunkCell(chunk, 12, 3, OBJECT.DIAMOND);
        this.setChunkCell(chunk, 11, 4, OBJECT.BRICKWALL);
        this.setChunkCell(chunk, 12, 4, OBJECT.BRICKWALL);
        this.setChunkCell(chunk, 3, 11, OBJECT.DIAMOND);
        this.setChunkCell(chunk, 4, 11, OBJECT.DIAMOND);
        this.setChunkCell(chunk, 3, 12, OBJECT.BRICKWALL);
        break;

      case 2:
        // Variant 2: The Ancient Pillar Sanctuary (Open perimeter hall with 4 megalithic pillars)
        const pillars = [[2, 2], [11, 2], [2, 11], [11, 11]];
        for (const [px, py] of pillars) {
          for (let dy = 0; dy <= 2; dy++) {
            for (let dx = 0; dx <= 2; dx++) {
              this.setChunkCell(chunk, px + dx, py + dy, OBJECT.STEELWALL);
            }
          }
        }
        // Diamonds on pedestals between pillars
        this.setChunkCell(chunk, 7, 2, OBJECT.DIAMOND);
        this.setChunkCell(chunk, 7, 13, OBJECT.DIAMOND);
        this.setChunkCell(chunk, 2, 7, OBJECT.DIAMOND);
        this.setChunkCell(chunk, 13, 7, OBJECT.DIAMOND);
        break;

      case 3:
        // Variant 3: The Twin Mining Shafts (Parallel vertical exploratory galleries with crosswalk)
        for (let y = 1; y <= 14; y++) {
          // West shaft (contains spawn at x=4)
          this.setChunkCell(chunk, 2, y, OBJECT.BRICKWALL);
          this.setChunkCell(chunk, 6, y, OBJECT.BRICKWALL);
          // East shaft
          this.setChunkCell(chunk, 9, y, OBJECT.BRICKWALL);
          this.setChunkCell(chunk, 13, y, OBJECT.BRICKWALL);
          // Space inside shafts
          this.setChunkCell(chunk, 3, y, OBJECT.SPACE);
          this.setChunkCell(chunk, 4, y, OBJECT.SPACE);
          this.setChunkCell(chunk, 5, y, OBJECT.SPACE);
          this.setChunkCell(chunk, 10, y, OBJECT.SPACE);
          this.setChunkCell(chunk, 11, y, OBJECT.SPACE);
          this.setChunkCell(chunk, 12, y, OBJECT.SPACE);
        }
        // Central connecting horizontal tunnel
        for (let x = 6; x <= 9; x++) {
          this.setChunkCell(chunk, x, 4, OBJECT.SPACE);
          this.setChunkCell(chunk, x, 5, OBJECT.SPACE);
        }
        // Diamonds in east shaft
        this.setChunkCell(chunk, 11, 4, OBJECT.DIAMOND);
        this.setChunkCell(chunk, 11, 5, OBJECT.DIAMOND);
        this.setChunkCell(chunk, 11, 6, OBJECT.DIAMOND);
        break;

      case 4:
        // Variant 4: The Diamond Grotto (Natural oval cavern clearing with scattered gems)
        for (let ly = 1; ly <= 14; ly++) {
          for (let lx = 1; lx <= 14; lx++) {
            const dist = Math.hypot(lx - 7.5, ly - 7.5);
            if (dist < 6.0) {
              const r = randFloat(lx, ly, seed + 333);
              if (r < 0.15) this.setChunkCell(chunk, lx, ly, OBJECT.DIAMOND);
              else if (r < 0.25) this.setChunkCell(chunk, lx, ly, OBJECT.BOULDER);
              else if (r < 0.55) this.setChunkCell(chunk, lx, ly, OBJECT.SPACE);
              else this.setChunkCell(chunk, lx, ly, OBJECT.DIRT);
            }
          }
        }
        break;
    }

    // Spawn invariant: Rockford always emerges safely at (4, 4)
    this.setChunkCell(chunk, 4, 4, OBJECT.PREROCKFORD1);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx !== 0 || dy !== 0) {
          this.setChunkCell(chunk, 4 + dx, 4 + dy, OBJECT.SPACE);
        }
      }
    }
  }

  /**
   * Applies procedural structure clusters (tunnels, labyrinths, buildings, vaults, pillar halls)
   * to non-starter chunks across the infinite world.
   */
  applyClusterIfPresent(chunk, cx, cy) {
    const clusterRoll = randFloat(cx, cy, this.seed + 777);
    if (clusterRoll >= 0.42) return; // ~42% of chunks contain a macro-structure cluster

    const clusterType = Math.abs(hashCoords(cx, cy, this.seed + 8888)) % 6;

    switch (clusterType) {
      case 0:
        // Cluster 0: Reinforced Mine Tunnels (Horizontal/Vertical)
        const isHorizontal = randFloat(cx, cy, this.seed + 121) < 0.5;
        if (isHorizontal) {
          const ty = 7;
          for (let lx = 2; lx <= 13; lx++) {
            this.setChunkCell(chunk, lx, ty, OBJECT.SPACE);
            this.setChunkCell(chunk, lx, ty + 1, OBJECT.SPACE);
            this.setChunkCell(chunk, lx, ty + 2, OBJECT.DIRT); // Mine track bed
            if (lx % 3 === 0) {
              this.setChunkCell(chunk, lx, ty - 1, OBJECT.BRICKWALL); // Ceiling support arch
              this.setChunkCell(chunk, lx, ty - 2, OBJECT.DIAMOND); // Hidden ore
            }
          }
        } else {
          const tx = 7;
          for (let ly = 2; ly <= 13; ly++) {
            this.setChunkCell(chunk, tx, ly, OBJECT.SPACE);
            this.setChunkCell(chunk, tx + 1, ly, OBJECT.SPACE);
            if (ly % 3 === 0) {
              this.setChunkCell(chunk, tx - 1, ly, OBJECT.BRICKWALL);
              this.setChunkCell(chunk, tx + 2, ly, OBJECT.BRICKWALL);
              this.setChunkCell(chunk, tx - 2, ly, OBJECT.DIAMOND);
            }
          }
        }
        break;

      case 1:
        // Cluster 1: Simple Labyrinth / Catacomb (Winding brick corridors with diamond pockets)
        // Outer boundary walls with doorways on all 4 faces
        for (let i = 3; i <= 12; i++) {
          const isGate = (i === 7 || i === 8);
          if (!isGate) {
            this.setChunkCell(chunk, i, 3, OBJECT.BRICKWALL);
            this.setChunkCell(chunk, i, 12, OBJECT.BRICKWALL);
            this.setChunkCell(chunk, 3, i, OBJECT.BRICKWALL);
            this.setChunkCell(chunk, 12, i, OBJECT.BRICKWALL);
          }
        }
        // Serpentine interior partitions
        for (let x = 4; x <= 10; x++) this.setChunkCell(chunk, x, 6, OBJECT.BRICKWALL);
        for (let x = 5; x <= 11; x++) this.setChunkCell(chunk, x, 9, OBJECT.BRICKWALL);
        // Clear corridors
        for (let x = 4; x <= 11; x++) {
          this.setChunkCell(chunk, x, 4, OBJECT.SPACE);
          this.setChunkCell(chunk, x, 5, OBJECT.SPACE);
          this.setChunkCell(chunk, x, 7, OBJECT.SPACE);
          this.setChunkCell(chunk, x, 8, OBJECT.SPACE);
          this.setChunkCell(chunk, x, 10, OBJECT.SPACE);
          this.setChunkCell(chunk, x, 11, OBJECT.SPACE);
        }
        // Treasure at maze dead ends
        this.setChunkCell(chunk, 11, 5, OBJECT.DIAMOND);
        this.setChunkCell(chunk, 4, 8, OBJECT.DIAMOND);
        this.setChunkCell(chunk, 11, 11, OBJECT.DIAMOND);
        break;

      case 2:
        // Cluster 2: Ancient Cavern Ruins / Subterranean Building (4-room dwelling with doorways)
        for (let ly = 3; ly <= 12; ly++) {
          for (let lx = 3; lx <= 12; lx++) {
            // Outer wall
            if (lx === 3 || lx === 12 || ly === 3 || ly === 12) {
              const isDoor = (lx >= 7 && lx <= 8) || (ly >= 7 && ly <= 8);
              this.setChunkCell(chunk, lx, ly, isDoor ? OBJECT.SPACE : OBJECT.BRICKWALL);
            }
            // Interior cross partition dividing into 4 rooms
            else if (lx === 7 || ly === 7) {
              const isInnerDoor = (lx === 5 || lx === 10 || ly === 5 || ly === 10);
              this.setChunkCell(chunk, lx, ly, isInnerDoor ? OBJECT.SPACE : OBJECT.BRICKWALL);
            }
            // Interior rooms
            else {
              this.setChunkCell(chunk, lx, ly, OBJECT.DIRT);
            }
          }
        }
        // Titanium foundation cornerstones
        this.setChunkCell(chunk, 3, 3, OBJECT.STEELWALL);
        this.setChunkCell(chunk, 12, 3, OBJECT.STEELWALL);
        this.setChunkCell(chunk, 3, 12, OBJECT.STEELWALL);
        this.setChunkCell(chunk, 12, 12, OBJECT.STEELWALL);
        // Diamonds inside the rooms
        this.setChunkCell(chunk, 5, 5, OBJECT.DIAMOND);
        this.setChunkCell(chunk, 10, 5, OBJECT.DIAMOND);
        this.setChunkCell(chunk, 5, 10, OBJECT.DIAMOND);
        this.setChunkCell(chunk, 10, 10, OBJECT.DIAMOND);
        break;

      case 3:
        // Cluster 3: Hypostyle Pillar Hall (Colonnade of titanium & brick pillars with open floor)
        // Clear hall area
        for (let ly = 3; ly <= 12; ly++) {
          for (let lx = 3; lx <= 12; lx++) {
            this.setChunkCell(chunk, lx, ly, OBJECT.SPACE);
          }
        }
        // 4 structural pillars
        const hallPillars = [[4, 4], [10, 4], [4, 10], [10, 10]];
        for (const [px, py] of hallPillars) {
          this.setChunkCell(chunk, px, py, OBJECT.STEELWALL);
          this.setChunkCell(chunk, px + 1, py, OBJECT.BRICKWALL);
          this.setChunkCell(chunk, px, py + 1, OBJECT.BRICKWALL);
          this.setChunkCell(chunk, px + 1, py + 1, OBJECT.STEELWALL);
          // Boulder resting on top
          this.setChunkCell(chunk, px, py - 1, OBJECT.BOULDER);
          this.setChunkCell(chunk, px + 1, py - 1, OBJECT.BOULDER);
        }
        // Diamonds on pedestals
        this.setChunkCell(chunk, 7, 7, OBJECT.DIAMOND);
        this.setChunkCell(chunk, 8, 7, OBJECT.DIAMOND);
        this.setChunkCell(chunk, 7, 8, OBJECT.DIAMOND);
        this.setChunkCell(chunk, 8, 8, OBJECT.DIAMOND);
        break;

      case 4:
        // Cluster 4: Fortified Diamond Vault (Treasure chamber with boulder roof puzzle)
        for (let ly = 4; ly <= 11; ly++) {
          for (let lx = 4; lx <= 11; lx++) {
            if (lx === 4 || lx === 11 || ly === 4 || ly === 11) {
              const isGate = (lx >= 7 && lx <= 8);
              this.setChunkCell(chunk, lx, ly, isGate ? OBJECT.SPACE : OBJECT.BRICKWALL);
            } else {
              this.setChunkCell(chunk, lx, ly, OBJECT.DIAMOND);
            }
          }
        }
        // Boulders perched on roof of vault
        this.setChunkCell(chunk, 5, 3, OBJECT.BOULDER);
        this.setChunkCell(chunk, 6, 3, OBJECT.BOULDER);
        this.setChunkCell(chunk, 9, 3, OBJECT.BOULDER);
        this.setChunkCell(chunk, 10, 3, OBJECT.BOULDER);
        break;

      case 5:
        // Cluster 5: Enchanted Alchemist Lab (Magic wall row with boulders primed above)
        // Clear room
        for (let ly = 4; ly <= 11; ly++) {
          for (let lx = 3; lx <= 12; lx++) {
            this.setChunkCell(chunk, lx, ly, OBJECT.SPACE);
          }
        }
        // Side retaining brick walls
        this.setChunkCell(chunk, 4, 5, OBJECT.BRICKWALL);
        this.setChunkCell(chunk, 4, 6, OBJECT.BRICKWALL);
        this.setChunkCell(chunk, 4, 7, OBJECT.BRICKWALL);
        this.setChunkCell(chunk, 11, 5, OBJECT.BRICKWALL);
        this.setChunkCell(chunk, 11, 6, OBJECT.BRICKWALL);
        this.setChunkCell(chunk, 11, 7, OBJECT.BRICKWALL);
        // Magic wall line at ly = 8
        for (let x = 5; x <= 10; x++) {
          this.setChunkCell(chunk, x, 8, OBJECT.MAGICWALL);
          // Stacked boulders ready to fall through magic wall!
          this.setChunkCell(chunk, x, 6, OBJECT.BOULDER);
          this.setChunkCell(chunk, x, 7, OBJECT.BOULDER);
          // Clear space below magic wall for transmuted diamonds
          this.setChunkCell(chunk, x, 9, OBJECT.SPACE);
          this.setChunkCell(chunk, x, 10, OBJECT.SPACE);
        }
        break;
    }
  }

  getCell(x, y) {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cy = Math.floor(y / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cy);

    let lx = x % CHUNK_SIZE;
    if (lx < 0) lx += CHUNK_SIZE;
    let ly = y % CHUNK_SIZE;
    if (ly < 0) ly += CHUNK_SIZE;

    return chunk[ly][lx];
  }

  getObject(x, y) {
    return this.getCell(x, y).object;
  }

  setObject(x, y, object) {
    const cell = this.getCell(x, y);
    cell.object = object;
    cell.invalid = true;
    cell.scanned = true;
  }

  /**
   * Retrieves all cells in a rectangular region [minX..maxX, minY..maxY].
   * Automatically generates any newly encountered chunks and stores them in memory.
   */
  getRegionCells(minX, maxX, minY, maxY) {
    const cells = [];
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        cells.push(this.getCell(x, y));
      }
    }
    return cells;
  }
}
