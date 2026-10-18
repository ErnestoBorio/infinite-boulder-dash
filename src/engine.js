/**
 * Infinite Boulder Dash - Core Roguelike Game Simulation Engine
 * Features permadeath procedural worlds, milestone progression, and infinite cave physics.
 */

import { OBJECT, DIR, DREAN_PALETTE } from './caves.js';
import { InfiniteWorld } from './infinite-world.js';

export const MILESTONES = [
  { count: 10,   title: "CAVE EXPLORER",        bonus: 500 },
  { count: 25,   title: "GEM HUNTER",           bonus: 1000 },
  { count: 50,   title: "PROSPECTOR",           bonus: 2500 },
  { count: 100,  title: "DIAMOND MASTER",       bonus: 5000 },
  { count: 150,  title: "DEEP DELVER",          bonus: 7500 },
  { count: 200,  title: "MYTHIC EXCAVATOR",     bonus: 10000 },
  { count: 300,  title: "MEGA SPELUNKER",       bonus: 15000 },
  { count: 500,  title: "DIAMOND EXTERMINATOR", bonus: 25000 },
  { count: 1000, title: "MYTHIC MEGA LEGEND",   bonus: 50000 },
  { count: 2000, title: "UNIVERSAL PRODIGY",    bonus: 100000 },
  { count: 5000, title: "MISSINGNO.",           bonus: 999999 }
];

export function getNextMilestone(count) {
  for (const m of MILESTONES) {
    if (count < m.count) return m;
  }
  // 5000+ MISSINGNO. tier repeats every 1000 diamonds beyond 5000
  const step = 1000;
  const nextCount = Math.floor(count / step + 1) * step;
  return { count: nextCount, title: "MISSINGNO.", bonus: 999999 };
}

export class BoulderDashEngine {
  constructor(options = {}) {
    this.seed = options.seed || Math.floor(Math.random() * 1000000);
    this.score = 0;
    this.lives = 3;
    this.fps = 10; // C64 physics ticks per second
    this.step = 1 / this.fps;

    this.onEvent = options.onEvent || (() => {});
    this.reset(this.seed);
  }

  /**
   * Resets the game. In roguelike mode, every new game / restart after death
   * rolls a completely new random seed and generates a fresh procedural world.
   */
  reset(seed = undefined) {
    // If no explicit seed provided, always roll a completely new random world seed!
    this.seed = (seed !== undefined) ? seed : Math.floor(Math.random() * 1000000);
    this.world = new InfiniteWorld(this.seed);

    this.diamondsCollected = 0;
    this.nextMilestone = getNextMilestone(0);
    this.diamondValue = 10;
    this.extraDiamondValue = 20;

    this.timeElapsed = 0;
    this.maxDepth = 0;

    this.magicWallActive = false;
    this.magicWallTime = 40 * this.fps;

    this.amoeba = {
      size: 0,
      maxSize: 200,
      slow: 30 * this.fps,
      enclosed: true,
      dead: null
    };

    // Rockford initial position at starter hub (4, 4)
    this.rockford = { x: 4, y: 4 };
    this.birthStage = 0;
    this.flashFrames = 0;

    this.state = 'STARTING'; // 'STARTING', 'PLAYING', 'LOST'
    this.frame = 0;
    this.lost = false;
    this.deathPos = null;
    this.score = 0;
    this.lives = 3;

    this.moving = {
      dir: null,
      grab: false,
      lastXDir: DIR.RIGHT
    };

    this.idle = {
      timer: 0,
      blink: false,
      tap: false
    };

    this.simRadiusX = 26;
    this.simRadiusY = 18;

    this.onEvent('level_loaded', {
      name: 'Infinite Caverns',
      seed: this.seed,
      palette: DREAN_PALETTE
    });
  }

  get(x, y) {
    return this.world.getObject(x, y);
  }

  set(x, y, object) {
    this.world.setObject(x, y, object);
  }

  move(fromX, fromY, toX, toY, object) {
    this.set(toX, toY, object);
    const fromCell = this.world.getCell(fromX, fromY);
    fromCell.object = OBJECT.SPACE;
    fromCell.invalid = true;
    fromCell.scanned = true;
  }

  getNeighborPos(x, y, dir) {
    const dx = [0, 1, 1, 1, 0, -1, -1, -1][dir] ?? 0;
    const dy = [-1, -1, 0, 1, 1, 1, 0, -1][dir] ?? 0;
    return { x: x + dx, y: y + dy };
  }

  getNeighbor(x, y, dir) {
    const p = this.getNeighborPos(x, y, dir);
    return this.get(p.x, p.y);
  }

  isRounded(x, y) {
    const obj = this.get(x, y);
    return obj === OBJECT.BOULDER || obj === OBJECT.DIAMOND || obj === OBJECT.BRICKWALL;
  }

  isExplodable(obj) {
    return obj.explodable || false;
  }

  isConsumable(obj) {
    return obj.consumable || false;
  }

  update() {
    this.frame++;

    const cx = this.rockford ? this.rockford.x : 4;
    const cy = this.rockford ? this.rockford.y : 4;

    // Track exploration depth (distance from origin spawn)
    const dist = Math.round(Math.hypot(cx - 4, cy - 4));
    if (dist > this.maxDepth) {
      this.maxDepth = dist;
    }

    const minX = cx - this.simRadiusX;
    const maxX = cx + this.simRadiusX;
    const minY = cy - this.simRadiusY;
    const maxY = cy + this.simRadiusY;

    // Reset scanned flags for cells in the active simulation window
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        this.world.getCell(x, y).scanned = false;
      }
    }

    if (this.amoeba.dead === null) {
      this.amoeba.size = 0;
      this.amoeba.enclosed = true;
    }

    // Scan loop from top to bottom, left to right
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const cell = this.world.getCell(x, y);
        if (cell.scanned) continue;

        const obj = cell.object;

        switch (obj) {
          case OBJECT.PREROCKFORD1:
          case OBJECT.PREROCKFORD2:
          case OBJECT.PREROCKFORD3:
          case OBJECT.PREROCKFORD4:
            this.updatePreRockford(x, y, obj);
            break;

          case OBJECT.ROCKFORD:
            this.rockford = { x, y };
            this.updateRockford(x, y);
            break;

          case OBJECT.BOULDER:
            this.updateBoulder(x, y);
            break;

          case OBJECT.BOULDERFALLING:
            this.updateBoulderFalling(x, y);
            break;

          case OBJECT.DIAMOND:
            this.updateDiamond(x, y);
            break;

          case OBJECT.DIAMONDFALLING:
            this.updateDiamondFalling(x, y);
            break;

          case OBJECT.FIREFLY1:
          case OBJECT.FIREFLY2:
          case OBJECT.FIREFLY3:
          case OBJECT.FIREFLY4:
            this.updateFirefly(x, y, obj);
            break;

          case OBJECT.BUTTERFLY1:
          case OBJECT.BUTTERFLY2:
          case OBJECT.BUTTERFLY3:
          case OBJECT.BUTTERFLY4:
            this.updateButterfly(x, y, obj);
            break;

          case OBJECT.AMOEBA:
            this.updateAmoeba(x, y);
            break;

          case OBJECT.EXPLODETOSPACE0:
          case OBJECT.EXPLODETOSPACE1:
          case OBJECT.EXPLODETOSPACE2:
          case OBJECT.EXPLODETOSPACE3:
          case OBJECT.EXPLODETOSPACE4:
            this.updateExplosionToSpace(x, y, obj);
            break;

          case OBJECT.EXPLODETODIAMOND0:
          case OBJECT.EXPLODETODIAMOND1:
          case OBJECT.EXPLODETODIAMOND2:
          case OBJECT.EXPLODETODIAMOND3:
          case OBJECT.EXPLODETODIAMOND4:
            this.updateExplosionToDiamond(x, y, obj);
            break;
        }
      }
    }

    // Post-scan Amoeba checks
    if (this.amoeba.dead === null && this.amoeba.size > 0) {
      if (this.amoeba.enclosed) {
        this.amoeba.dead = OBJECT.DIAMOND;
        this.onEvent('amoeba_suffocated');
      } else if (this.amoeba.size >= this.amoeba.maxSize) {
        this.amoeba.dead = OBJECT.BOULDER;
        this.onEvent('amoeba_overflow');
      } else if (this.amoeba.slow > 0) {
        this.amoeba.slow--;
      }
    }

    // Magic wall countdown
    if (this.magicWallActive) {
      this.magicWallTime--;
      if (this.magicWallTime <= 0) {
        this.magicWallActive = false;
      }
    }

    if (this.flashFrames > 0) {
      this.flashFrames--;
    }

    if (this.state === 'PLAYING') {
      this.timeElapsed += 1 / this.fps;
    }

    // Idle animation for Rockford
    if (this.moving.dir === null) {
      this.idle.timer++;
      if (this.idle.timer > 20) {
        this.idle.blink = (Math.floor(this.idle.timer / 4) % 2 === 0);
        this.idle.tap = (Math.floor(this.idle.timer / 8) % 2 === 0);
      }
    } else {
      this.idle.timer = 0;
      this.idle.blink = false;
      this.idle.tap = false;
    }
  }

  updatePreRockford(x, y, obj) {
    const sequence = [
      OBJECT.PREROCKFORD1,
      OBJECT.PREROCKFORD2,
      OBJECT.PREROCKFORD3,
      OBJECT.PREROCKFORD4,
      OBJECT.ROCKFORD
    ];
    const idx = sequence.indexOf(obj);
    if (this.frame % 3 === 0) {
      if (idx < sequence.length - 1) {
        this.set(x, y, sequence[idx + 1]);
        if (sequence[idx + 1] === OBJECT.ROCKFORD) {
          this.rockford = { x, y };
          this.state = 'PLAYING';
          this.onEvent('rockford_spawned');
        }
      }
    }
  }

  updateRockford(x, y) {
    if (this.state !== 'PLAYING') return;

    const dir = this.moving.dir;
    if (dir === null) return;

    if (dir === DIR.LEFT) this.moving.lastXDir = DIR.LEFT;
    if (dir === DIR.RIGHT) this.moving.lastXDir = DIR.RIGHT;

    const targetPos = this.getNeighborPos(x, y, dir);
    const targetObj = this.get(targetPos.x, targetPos.y);

    // GRAB IN PLACE (Spacebar + direction)
    if (this.moving.grab) {
      if (targetObj === OBJECT.DIRT) {
        this.set(targetPos.x, targetPos.y, OBJECT.SPACE);
        this.onEvent('dig');
      } else if (targetObj === OBJECT.DIAMOND || targetObj === OBJECT.DIAMONDFALLING) {
        this.set(targetPos.x, targetPos.y, OBJECT.SPACE);
        this.collectDiamond();
      } else if ((dir === DIR.LEFT || dir === DIR.RIGHT) && targetObj === OBJECT.BOULDER) {
        this.pushBoulder(x, y, targetPos.x, targetPos.y, dir, false);
      }
      return;
    }

    // NORMAL WALKING
    if (targetObj === OBJECT.SPACE || targetObj === OBJECT.DIRT) {
      if (targetObj === OBJECT.DIRT) {
        this.onEvent('dig');
      }
      this.move(x, y, targetPos.x, targetPos.y, OBJECT.ROCKFORD);
      this.rockford = { x: targetPos.x, y: targetPos.y };
    } else if (targetObj === OBJECT.DIAMOND) {
      this.move(x, y, targetPos.x, targetPos.y, OBJECT.ROCKFORD);
      this.rockford = { x: targetPos.x, y: targetPos.y };
      this.collectDiamond();
    } else if ((dir === DIR.LEFT || dir === DIR.RIGHT) && targetObj === OBJECT.BOULDER) {
      this.pushBoulder(x, y, targetPos.x, targetPos.y, dir, true);
    }
  }

  pushBoulder(rx, ry, bx, by, dir, moveRockford) {
    const behindPos = this.getNeighborPos(bx, by, dir);
    if (this.get(behindPos.x, behindPos.y) === OBJECT.SPACE) {
      if (Math.random() < 0.25) {
        this.move(bx, by, behindPos.x, behindPos.y, OBJECT.BOULDER);
        if (moveRockford) {
          this.move(rx, ry, bx, by, OBJECT.ROCKFORD);
          this.rockford = { x: bx, y: by };
        }
        this.onEvent('push');
      }
    }
  }

  updateBoulder(x, y) {
    const below = this.get(x, y + 1);
    if (below === OBJECT.SPACE) {
      this.set(x, y, OBJECT.BOULDERFALLING);
    } else if (this.isRounded(x, y + 1)) {
      if (this.get(x - 1, y) === OBJECT.SPACE && this.get(x - 1, y + 1) === OBJECT.SPACE) {
        this.move(x, y, x - 1, y, OBJECT.BOULDERFALLING);
      } else if (this.get(x + 1, y) === OBJECT.SPACE && this.get(x + 1, y + 1) === OBJECT.SPACE) {
        this.move(x, y, x + 1, y, OBJECT.BOULDERFALLING);
      }
    }
  }

  updateBoulderFalling(x, y) {
    const below = this.get(x, y + 1);

    if (below === OBJECT.SPACE) {
      this.move(x, y, x, y + 1, OBJECT.BOULDERFALLING);
    } else if (below === OBJECT.ROCKFORD) {
      this.explode(x, y + 1, false);
    } else if (this.isExplodable(below)) {
      const isButterfly = (below === OBJECT.BUTTERFLY1 || below === OBJECT.BUTTERFLY2 ||
                           below === OBJECT.BUTTERFLY3 || below === OBJECT.BUTTERFLY4);
      this.explode(x, y + 1, isButterfly);
    } else if (below === OBJECT.MAGICWALL) {
      this.doMagicWall(x, y, OBJECT.DIAMONDFALLING);
    } else if (this.isRounded(x, y + 1)) {
      if (this.get(x - 1, y) === OBJECT.SPACE && this.get(x - 1, y + 1) === OBJECT.SPACE) {
        this.move(x, y, x - 1, y, OBJECT.BOULDERFALLING);
      } else if (this.get(x + 1, y) === OBJECT.SPACE && this.get(x + 1, y + 1) === OBJECT.SPACE) {
        this.move(x, y, x + 1, y, OBJECT.BOULDERFALLING);
      } else {
        this.set(x, y, OBJECT.BOULDER);
        this.onEvent('boulder_drop');
      }
    } else {
      this.set(x, y, OBJECT.BOULDER);
      this.onEvent('boulder_drop');
    }
  }

  updateDiamond(x, y) {
    const below = this.get(x, y + 1);
    if (below === OBJECT.SPACE) {
      this.set(x, y, OBJECT.DIAMONDFALLING);
    } else if (this.isRounded(x, y + 1)) {
      if (this.get(x - 1, y) === OBJECT.SPACE && this.get(x - 1, y + 1) === OBJECT.SPACE) {
        this.move(x, y, x - 1, y, OBJECT.DIAMONDFALLING);
      } else if (this.get(x + 1, y) === OBJECT.SPACE && this.get(x + 1, y + 1) === OBJECT.SPACE) {
        this.move(x, y, x + 1, y, OBJECT.DIAMONDFALLING);
      }
    }
  }

  updateDiamondFalling(x, y) {
    const below = this.get(x, y + 1);

    if (below === OBJECT.SPACE) {
      this.move(x, y, x, y + 1, OBJECT.DIAMONDFALLING);
    } else if (below === OBJECT.ROCKFORD) {
      this.explode(x, y + 1, false);
    } else if (this.isExplodable(below)) {
      const isButterfly = (below === OBJECT.BUTTERFLY1 || below === OBJECT.BUTTERFLY2 ||
                           below === OBJECT.BUTTERFLY3 || below === OBJECT.BUTTERFLY4);
      this.explode(x, y + 1, isButterfly);
    } else if (below === OBJECT.MAGICWALL) {
      this.doMagicWall(x, y, OBJECT.BOULDERFALLING);
    } else if (this.isRounded(x, y + 1)) {
      if (this.get(x - 1, y) === OBJECT.SPACE && this.get(x - 1, y + 1) === OBJECT.SPACE) {
        this.move(x, y, x - 1, y, OBJECT.DIAMONDFALLING);
      } else if (this.get(x + 1, y) === OBJECT.SPACE && this.get(x + 1, y + 1) === OBJECT.SPACE) {
        this.move(x, y, x + 1, y, OBJECT.DIAMONDFALLING);
      } else {
        this.set(x, y, OBJECT.DIAMOND);
      }
    } else {
      this.set(x, y, OBJECT.DIAMOND);
    }
  }

  doMagicWall(x, y, toObj) {
    this.magicWallActive = true;
    this.set(x, y, OBJECT.SPACE);
    if (this.get(x, y + 2) === OBJECT.SPACE) {
      this.set(x, y + 2, toObj);
      this.onEvent('magic_wall');
    }
  }

  updateFirefly(x, y, obj) {
    const dirs = [DIR.LEFT, DIR.UP, DIR.RIGHT, DIR.DOWN];
    const fireflyObjs = [OBJECT.FIREFLY1, OBJECT.FIREFLY2, OBJECT.FIREFLY3, OBJECT.FIREFLY4];
    const curIdx = fireflyObjs.indexOf(obj);

    for (const d of [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT]) {
      const neighbor = this.getNeighbor(x, y, d);
      if (neighbor === OBJECT.ROCKFORD || neighbor === OBJECT.AMOEBA) {
        this.explode(x, y, false);
        return;
      }
    }

    const leftDir = (curIdx + 3) % 4;
    const forwardDir = curIdx;
    const rightDir = (curIdx + 1) % 4;

    const leftPos = this.getNeighborPos(x, y, dirs[leftDir]);
    const fwdPos = this.getNeighborPos(x, y, dirs[forwardDir]);

    if (this.get(leftPos.x, leftPos.y) === OBJECT.SPACE) {
      this.move(x, y, leftPos.x, leftPos.y, fireflyObjs[leftDir]);
    } else if (this.get(fwdPos.x, fwdPos.y) === OBJECT.SPACE) {
      this.move(x, y, fwdPos.x, fwdPos.y, fireflyObjs[forwardDir]);
    } else {
      this.set(x, y, fireflyObjs[rightDir]);
    }
  }

  updateButterfly(x, y, obj) {
    const dirs = [DIR.DOWN, DIR.LEFT, DIR.UP, DIR.RIGHT];
    const butterflyObjs = [OBJECT.BUTTERFLY1, OBJECT.BUTTERFLY2, OBJECT.BUTTERFLY3, OBJECT.BUTTERFLY4];
    const curIdx = butterflyObjs.indexOf(obj);

    for (const d of [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT]) {
      const neighbor = this.getNeighbor(x, y, d);
      if (neighbor === OBJECT.ROCKFORD || neighbor === OBJECT.AMOEBA) {
        this.explode(x, y, true);
        return;
      }
    }

    const rightDir = (curIdx + 1) % 4;
    const forwardDir = curIdx;
    const leftDir = (curIdx + 3) % 4;

    const rightPos = this.getNeighborPos(x, y, dirs[rightDir]);
    const fwdPos = this.getNeighborPos(x, y, dirs[forwardDir]);

    if (this.get(rightPos.x, rightPos.y) === OBJECT.SPACE) {
      this.move(x, y, rightPos.x, rightPos.y, butterflyObjs[rightDir]);
    } else if (this.get(fwdPos.x, fwdPos.y) === OBJECT.SPACE) {
      this.move(x, y, fwdPos.x, fwdPos.y, butterflyObjs[forwardDir]);
    } else {
      this.set(x, y, butterflyObjs[leftDir]);
    }
  }

  updateAmoeba(x, y) {
    if (this.amoeba.dead) {
      this.set(x, y, this.amoeba.dead);
      return;
    }

    this.amoeba.size++;

    const neighbors = [
      this.get(x, y - 1),
      this.get(x, y + 1),
      this.get(x - 1, y),
      this.get(x + 1, y)
    ];

    for (const n of neighbors) {
      if (n === OBJECT.SPACE || n === OBJECT.DIRT) {
        this.amoeba.enclosed = false;
        break;
      }
    }

    const canGrow = (this.amoeba.slow > 0) ? (Math.random() < 0.03) : (Math.random() < 0.25);
    if (canGrow) {
      const dirs = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];
      const growDir = dirs[Math.floor(Math.random() * dirs.length)];
      const targetPos = this.getNeighborPos(x, y, growDir);
      const targetObj = this.get(targetPos.x, targetPos.y);

      if (targetObj === OBJECT.SPACE || targetObj === OBJECT.DIRT) {
        this.set(targetPos.x, targetPos.y, OBJECT.AMOEBA);
      }
    }
  }

  explode(centerX, centerY, toDiamonds = false) {
    const explosionBase = toDiamonds ? OBJECT.EXPLODETODIAMOND0 : OBJECT.EXPLODETOSPACE0;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = centerX + dx;
        const ty = centerY + dy;
        const targetObj = this.get(tx, ty);

        if (targetObj !== OBJECT.STEELWALL) {
          this.set(tx, ty, explosionBase);
        }
      }
    }

    this.onEvent('explosion', { toDiamonds });

    // Permadeath check
    const hitRockford = this.rockford && (
      (centerX === this.rockford.x && centerY === this.rockford.y) ||
      (Math.abs(this.rockford.x - centerX) <= 1 && Math.abs(this.rockford.y - centerY) <= 1)
    );

    if (hitRockford && !this.lost) {
      this.deathPos = { x: this.rockford.x, y: this.rockford.y };
      this.lost = true;
      this.state = 'LOST';
      this.onEvent('rockford_died', {
        diamonds: this.diamondsCollected,
        score: this.score,
        depth: this.maxDepth,
        time: Math.round(this.timeElapsed),
        seed: this.seed,
        deathPos: { ...this.deathPos }
      });
    }
  }

  updateExplosionToSpace(x, y, obj) {
    const stages = [
      OBJECT.EXPLODETOSPACE0,
      OBJECT.EXPLODETOSPACE1,
      OBJECT.EXPLODETOSPACE2,
      OBJECT.EXPLODETOSPACE3,
      OBJECT.EXPLODETOSPACE4
    ];
    const idx = stages.indexOf(obj);
    if (idx < stages.length - 1) {
      this.set(x, y, stages[idx + 1]);
    } else {
      this.set(x, y, OBJECT.SPACE);
    }
  }

  updateExplosionToDiamond(x, y, obj) {
    const stages = [
      OBJECT.EXPLODETODIAMOND0,
      OBJECT.EXPLODETODIAMOND1,
      OBJECT.EXPLODETODIAMOND2,
      OBJECT.EXPLODETODIAMOND3,
      OBJECT.EXPLODETODIAMOND4
    ];
    const idx = stages.indexOf(obj);
    if (idx < stages.length - 1) {
      this.set(x, y, stages[idx + 1]);
    } else {
      this.set(x, y, OBJECT.DIAMOND);
    }
  }

  collectDiamond() {
    this.diamondsCollected++;
    this.score += this.diamondValue;

    this.onEvent('diamond_collected', {
      collected: this.diamondsCollected,
      score: this.score
    });

    // Check if player reached the next milestone
    if (this.nextMilestone && this.diamondsCollected >= this.nextMilestone.count) {
      const milestone = this.nextMilestone;
      this.score += milestone.bonus;
      this.flashFrames = 8;

      this.onEvent('milestone_reached', {
        count: milestone.count,
        title: milestone.title,
        bonus: milestone.bonus,
        totalDiamonds: this.diamondsCollected
      });

      this.nextMilestone = getNextMilestone(this.diamondsCollected);
    }
  }
}
