/**
 * Infinite Boulder Dash - Full-Window Canvas 2D Renderer
 * Renders an infinite procedural cave with smooth scrolling, Drean 16-color palette, and clean HUD.
 */

import { OBJECT, DIR, DREAN_PALETTE } from './caves.js';

/**
 * Deterministic PRNG for seed-based palette generation.
 */
export function createPRNG(seed) {
  let s = (typeof seed === 'number' ? seed : (seed ? String(seed).split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 0) : Math.floor(Math.random() * 1000000000))) >>> 0;
  return function() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Curated thematic palettes from Ernesto Borio's 16-color Drean palette.
 * Fine-tuned for authentic shape, high contrast, and material identity:
 * - Boulders retain realistic mineral/rock shading (granite, slate, sandstone, basalt, volcanic, limestone, etc.)
 * - Diamonds glitter as sparkling precious gemstones with brilliant glint highlights
 * - Rockford has readable facial contrast and distinctive clothes separation
 * - Dirt looks like porous subterranean cavern soil
 * - Titanium blocks look heavy and metallic
 *
 * Each theme defines [Slot0 (black/cutout), Slot1 (accent/midtone), Slot2 (body/shadow), Slot3 (highlight/face)].
 */
export const ENTITY_THEMES = {
  rockford: [
    [0, 1, 8, 2],   // Classic Explorer: Blue pants, Light Skin face, Red shirt
    [0, 1, 6, 1],   // Blue Miner: Blue pants, Yellow skin, Blue shirt
    [0, 1, 7, 2],   // Retro 1984 Rockford: Blue pants, White skin, Red shirt
    [0, 15, 8, 6],  // Spelunker Pro: Dark Gray pants, Light Skin face, Yellow shirt
    [0, 1, 8, 7],   // Arctic Adventurer: Blue pants, Light Skin face, White parka
    [0, 9, 8, 13],  // Desert Scavenger: Brown pants, Light Skin face, Light Red shirt
    [0, 11, 8, 5],  // Neon Cyberminer: Violet pants, Light Skin face, Cyan shirt
    [0, 10, 8, 14], // Deep Cavernier: Teal pants, Light Skin face, Light Gray shirt
    [0, 15, 8, 2],  // Lava Diver: Dark Gray pants, Light Skin face, Red shirt
    [0, 9, 8, 4],   // Forest Ranger: Brown pants, Light Skin face, Green shirt
    [0, 14, 12, 7], // Hazmat Operative: Light Gray suit, Sky Blue visor, White helmet
    [0, 15, 8, 14]  // Stealth Miner: Dark Gray suit, Light Skin face, Light Gray vest
  ],
  boulder: [
    [0, 14, 15, 7], // Classic Granite: Light Gray midtone, Dark Gray shadow, White rim
    [0, 8, 9, 6],   // Sandstone: Light Skin midtone, Brown shadow, Yellow highlight
    [0, 10, 15, 14],// Slate / Riverstone: Teal midtone, Dark Gray shadow, Light Gray rim
    [0, 2, 15, 13], // Basalt / Volcanic: Red midtone, Dark Gray shadow, Light Red rim
    [0, 14, 9, 7],  // Limestone: Light Gray midtone, Brown shadow, White highlight
    [0, 4, 15, 14], // Mossy Cobble: Green midtone, Dark Gray shadow, Light Gray rim
    [0, 11, 15, 12],// Amethyst Ore: Violet midtone, Dark Gray shadow, Sky Blue glint
    [0, 9, 15, 13], // Ironstone: Brown midtone, Dark Gray shadow, Light Red rim
    [0, 5, 1, 7],   // Glacial Stone: Cyan midtone, Blue shadow, White rim
    [0, 6, 15, 7]   // Pyrite Gold Ore: Yellow midtone, Dark Gray shadow, White rim
  ],
  diamond: [
    [0, 1, 12, 7],  // Sapphire: Blue, Sky Blue, White
    [0, 4, 5, 7],   // Emerald: Green, Cyan, White
    [0, 2, 13, 7],  // Ruby: Red, Light Red, White
    [0, 11, 3, 7],  // Amethyst: Violet, Magenta, White
    [0, 9, 6, 7],   // Topaz: Brown, Yellow, White
    [0, 10, 5, 7],  // Aquamarine: Teal, Cyan, White
    [0, 15, 14, 7], // Pure Diamond: Dark Gray, Light Gray, White
    [0, 11, 4, 7],  // Alexandrite: Violet, Green, White
    [0, 2, 6, 7]    // Sunstone: Red, Yellow, White
  ],
  dirt: [
    [0, 9, 15, 8],  // Classic Earth: Brown, Dark Gray, Light Skin
    [0, 9, 2, 13],  // Red Clay: Brown, Red, Light Red
    [0, 15, 9, 14], // Cavern Peat: Dark Gray, Brown, Light Gray
    [0, 9, 15, 10], // Mossy Grotto: Brown, Dark Gray, Teal
    [0, 9, 6, 8],   // Sandy Subsoil: Brown, Yellow, Light Skin
    [0, 15, 2, 13], // Volcanic Ash: Dark Gray, Red, Light Red
    [0, 15, 11, 14],// Deep Strata: Dark Gray, Violet, Light Gray
    [0, 15, 10, 12] // Glacial Permafrost: Dark Gray, Teal, Sky Blue
  ],
  brickwall: [
    [0, 9, 2, 13],  // Terracotta: Brown, Red, Light Red
    [0, 15, 14, 7], // Dungeon Cobble: Dark Gray, Light Gray, White
    [0, 10, 5, 14], // Ancient Teal Ruins: Teal, Cyan, Light Gray
    [0, 9, 8, 6],   // Sandstone Masonry: Brown, Light Skin, Yellow
    [0, 15, 10, 12],// Subterranean Fortress: Dark Gray, Teal, Sky Blue
    [0, 11, 3, 14]  // Royal Vault Bricks: Violet, Magenta, Light Gray
  ],
  steelwall: [
    [0, 15, 14, 7], // Industrial Titanium: Dark Gray, Light Gray, White
    [0, 15, 10, 5], // Cobalt Teal: Dark Gray, Teal, Cyan
    [0, 1, 12, 7],  // Heavy Blue Alloy: Blue, Sky Blue, White
    [0, 15, 12, 7], // Chrome: Dark Gray, Sky Blue, White
    [0, 15, 11, 14] // Tungsten / Obsidian Alloy: Dark Gray, Violet, Light Gray
  ],
  magicwall: [
    [0, 11, 3, 7],  // Arcane Violet: Violet, Magenta, White
    [0, 10, 5, 7],  // Mystic Cyan: Teal, Cyan, White
    [0, 2, 6, 7],   // Solar Flare: Red, Yellow, White
    [0, 1, 12, 7],  // Frost Magic: Blue, Sky Blue, White
    [0, 4, 5, 7]    // Emerald Glow: Green, Cyan, White
  ],
  amoeba: [
    [0, 4, 10, 6],  // Toxic Slime: Green, Teal, Yellow
    [0, 5, 12, 7],  // Bioluminescent Jelly: Cyan, Sky Blue, White
    [0, 3, 11, 13], // Alien Biomass: Magenta, Violet, Light Red
    [0, 2, 13, 6],  // Magma Ooze: Red, Light Red, Yellow
    [0, 4, 6, 7]    // Acidic Blob: Green, Yellow, White
  ],
  firefly: [
    [0, 2, 6, 7],   // Fiery Amber: Red, Yellow, White
    [0, 3, 13, 6],  // Plasma Spark: Magenta, Light Red, Yellow
    [0, 1, 5, 7],   // Electric Lightning: Blue, Cyan, White
    [0, 4, 6, 7]    // Toxic Wasp: Green, Yellow, White
  ],
  butterfly: [
    [0, 2, 6, 7],   // Monarch: Red, Yellow, White
    [0, 1, 12, 7],  // Blue Morpho: Blue, Sky Blue, White
    [0, 11, 3, 8],  // Orchid: Violet, Magenta, Light Skin
    [0, 4, 5, 7],   // Emerald Wing: Green, Cyan, White
    [0, 9, 6, 7]    // Solar Swallowtail: Brown, Yellow, White
  ],
  explosion: [
    [0, 2, 6, 7],   // Classic Inferno: Red, Yellow, White
    [0, 3, 6, 7],   // Supernova: Magenta, Yellow, White
    [0, 5, 12, 7],  // Shockwave: Cyan, Sky Blue, White
    [0, 13, 6, 7]   // Solar Burst: Light Red, Yellow, White
  ]
};

/**
 * Generates independent 4-color Drean palettes for every entity in the game.
 * Uses curated harmonic themes to guarantee high visual contrast and material identity
 * (e.g., boulders consistently look like natural minerals/rocks, diamonds glitter).
 */
export function generateRandomEntityPalettes(seed = null) {
  const prng = (seed != null) ? createPRNG(seed) : Math.random;
  const entityKeys = Object.keys(ENTITY_THEMES);
  const palettes = {};

  for (const ent of entityKeys) {
    const themes = ENTITY_THEMES[ent];
    const themeIdx = Math.floor(prng() * themes.length);
    const indices = themes[themeIdx];

    palettes[ent] = [
      DREAN_PALETTE[indices[0]], // Slot 0 (Black)
      DREAN_PALETTE[indices[1]], // Slot 1
      DREAN_PALETTE[indices[2]], // Slot 2
      DREAN_PALETTE[indices[3]]  // Slot 3
    ];
  }

  // High-contrast palettes for UI glyphs/fonts
  palettes['fontWhite'] = [
    DREAN_PALETTE[0],
    DREAN_PALETTE[7],  // White
    DREAN_PALETTE[14], // Light Gray
    DREAN_PALETTE[7]   // White
  ];
  palettes['fontYellow'] = [
    DREAN_PALETTE[0],
    DREAN_PALETTE[6],  // Yellow
    DREAN_PALETTE[15], // Dark Gray
    DREAN_PALETTE[7]   // White
  ];
  palettes['default'] = [
    DREAN_PALETTE[0],
    DREAN_PALETTE[9],  // Brown
    DREAN_PALETTE[10], // Teal
    DREAN_PALETTE[14]  // Light Gray
  ];

  return palettes;
}

export class BoulderDashRenderer {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.engine = engine;

    this.spritesImage = null;
    this.recoloredCanvas = null;
    this.recoloredCtx = null;
    this.spritesLoaded = false;
    this.currentPalettes = null;

    // Tile size in pixels
    this.tileSize = 32;

    // Smooth camera position in world pixel space
    this.camera = { x: 0, y: 0 };
    this.hasInitCamera = false;

    // Animation frame timer
    this.animTime = 0;
  }

  async loadSprites(src = 'images/sprites.png') {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.spritesImage = img;
        this.spritesLoaded = true;

        this.recoloredCanvas = document.createElement('canvas');
        this.recoloredCanvas.width = img.width;
        this.recoloredCanvas.height = img.height;
        this.recoloredCtx = this.recoloredCanvas.getContext('2d');

        this.recolorWithDreanPalette(this.engine ? this.engine.seed : null);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * Identifies which entity a tile coordinate (tx, ty) belongs to in the spritesheet.
   */
  getEntityNameAtTile(tx, ty) {
    if (ty >= 0 && ty <= 5 && tx <= 7) return 'rockford';
    if (ty === 6 && (tx === 1 || tx === 2)) return 'steelwall';
    if (ty === 6 && tx === 3) return 'brickwall';
    if (ty === 6 && tx >= 4 && tx <= 7) return 'magicwall';
    if (ty === 7 && tx === 0) return 'boulder';
    if (ty === 7 && (tx === 1 || tx === 2)) return 'dirt';
    if (ty === 7 && tx >= 3 && tx <= 7) return 'explosion';
    if (ty === 8 && tx <= 7) return 'amoeba';
    if (ty === 9 && tx <= 7) return 'firefly';
    if (ty === 10 && tx <= 7) return 'diamond';
    if (ty === 11 && tx <= 7) return 'butterfly';
    if (tx === 8) return 'fontWhite';
    if (tx === 9) return 'fontYellow';
    return 'default';
  }

  /**
   * Recolor spritesheet dynamically using independent 4-color Drean palettes for each entity.
   * Rockford, boulders, diamonds, dirt, walls, etc. each get their own 4 Drean colors.
   * Automatically randomized on every game reset.
   */
  recolorWithDreanPalette(palettesOrSeed = null) {
    if (!this.spritesLoaded) return;

    let palettes;
    if (palettesOrSeed && typeof palettesOrSeed === 'object' && !Array.isArray(palettesOrSeed) && palettesOrSeed.rockford) {
      palettes = palettesOrSeed;
    } else {
      const seed = (palettesOrSeed != null) ? palettesOrSeed : (this.engine ? this.engine.seed : Math.floor(Math.random() * 1000000000));
      palettes = generateRandomEntityPalettes(seed);
    }
    this.currentPalettes = palettes;

    const w = this.spritesImage.width;
    const h = this.spritesImage.height;

    this.recoloredCtx.clearRect(0, 0, w, h);
    this.recoloredCtx.drawImage(this.spritesImage, 0, 0);

    const imgData = this.recoloredCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Pre-extract RGB values for fast pixel mapping loop
    const fastPalettes = {};
    for (const ent of Object.keys(palettes)) {
      const p = palettes[ent];
      fastPalettes[ent] = [
        [(p[0].rgb >> 16) & 0xff, (p[0].rgb >> 8) & 0xff, p[0].rgb & 0xff],
        [(p[1].rgb >> 16) & 0xff, (p[1].rgb >> 8) & 0xff, p[1].rgb & 0xff],
        [(p[2].rgb >> 16) & 0xff, (p[2].rgb >> 8) & 0xff, p[2].rgb & 0xff],
        [(p[3].rgb >> 16) & 0xff, (p[3].rgb >> 8) & 0xff, p[3].rgb & 0xff]
      ];
    }
    const defaultFast = fastPalettes['default'] || fastPalettes['rockford'];

    for (let y = 0; y < h; y++) {
      const ty = Math.floor(y / 32);
      const rowOffset = y * w * 4;
      for (let x = 0; x < w; x++) {
        const tx = Math.floor(x / 32);
        const i = rowOffset + x * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a === 0) continue;

        let slot = 0;
        if (r === 0 && g === 0 && b === 0) {
          slot = 0;
        } else if ((r > 120 && g < 100 && b < 50) || (r === 0 && g > 200 && b === 0) || (r > 200 && g > 200 && b < 50)) {
          slot = 1;
        } else if (r > 30 && r < 100 && g > 30 && g < 100 && b > 30 && b < 100) {
          slot = 2;
        } else if (r > 200 && g > 200 && b > 200) {
          slot = 3;
        }

        const ent = this.getEntityNameAtTile(tx, ty);
        const entityColors = fastPalettes[ent] || defaultFast;
        const col = entityColors[slot];

        data[i] = col[0];
        data[i + 1] = col[1];
        data[i + 2] = col[2];
      }
    }

    this.recoloredCtx.putImageData(imgData, 0, 0);
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  render(deltaTime = 0) {
    if (!this.spritesLoaded) return;

    this.animTime += deltaTime;
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;

    const cw = this.width;
    const ch = this.height;

    // Background color: Pitch black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, cw, ch);

    // Camera tracking with 1/3 rectangular window deadzone:
    // Rockford moves freely inside the central 1/3 window without camera scrolling.
    // When Rockford reaches the window boundaries, camera smoothly scrolls just enough to keep him inside.
    const ts = this.tileSize;
    const px = (this.engine.rockford ? this.engine.rockford.x + 0.5 : (this.engine.deathPos ? this.engine.deathPos.x + 0.5 : 4.5)) * ts;
    const py = (this.engine.rockford ? this.engine.rockford.y + 0.5 : (this.engine.deathPos ? this.engine.deathPos.y + 0.5 : 4.5)) * ts;

    if (!this.hasInitCamera) {
      this.camera.x = px - cw / 2;
      this.camera.y = py - ch / 2;
      this.hasInitCamera = true;
    } else {
      const minScreenX = cw / 3;
      const maxScreenX = (2 * cw) / 3;
      const minScreenY = ch / 3;
      const maxScreenY = (2 * ch) / 3;

      const screenX = px - this.camera.x;
      const screenY = py - this.camera.y;

      let targetX = this.camera.x;
      let targetY = this.camera.y;

      if (screenX < minScreenX) {
        targetX = px - minScreenX;
      } else if (screenX > maxScreenX) {
        targetX = px - maxScreenX;
      }

      if (screenY < minScreenY) {
        targetY = py - minScreenY;
      } else if (screenY > maxScreenY) {
        targetY = py - maxScreenY;
      }

      // Smoothly scroll camera just enough to keep Rockford inside the 1/3 window
      this.camera.x += (targetX - this.camera.x) * 0.14;
      this.camera.y += (targetY - this.camera.y) * 0.14;
    }

    // Determine visible coordinate range in world grid
    const minCellX = Math.floor(this.camera.x / ts) - 1;
    const maxCellX = Math.ceil((this.camera.x + cw) / ts) + 1;
    const minCellY = Math.floor(this.camera.y / ts) - 1;
    const maxCellY = Math.ceil((this.camera.y + ch) / ts) + 1;

    // Check if empty space should flash white on this frame during milestone celebration (~14Hz rapid strobe)
    this.spaceFlashWhite = (this.engine.flashFrames > 0) && (Math.floor(this.animTime * 14) % 2 === 0);

    // Render all visible cells (automatically generates & stores in memory any newly explored chunks)
    for (let y = minCellY; y <= maxCellY; y++) {
      for (let x = minCellX; x <= maxCellX; x++) {
        const cell = this.engine.world.getCell(x, y);
        const screenX = x * ts - Math.round(this.camera.x);
        const screenY = y * ts - Math.round(this.camera.y);

        this.renderCell(ctx, cell, screenX, screenY, ts, ts);
      }
    }

    // When Rockford dies, subtly darken the screen without blacking it out
    if (this.engine.lost) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
      ctx.fillRect(0, 0, cw, ch);
    }

    // Draw Top HUD Bar
    this.renderHUD(ctx, cw, ch);
  }

  renderCell(ctx, cell, sx, sy, sw, sh) {
    const obj = cell.object;
    if (obj === OBJECT.SPACE) {
      if (this.spaceFlashWhite) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(Math.round(sx), Math.round(sy), sw, sh);
      }
      return;
    }

    let sprite = obj.sprite;

    // Rockford animated states
    if (obj === OBJECT.ROCKFORD) {
      if (this.engine.moving.dir === DIR.LEFT || (this.engine.moving.dir === null && this.engine.moving.lastXDir === DIR.LEFT && this.engine.moving.grab)) {
        sprite = OBJECT.ROCKFORD.left;
      } else if (this.engine.moving.dir === DIR.RIGHT || (this.engine.moving.dir === null && this.engine.moving.lastXDir === DIR.RIGHT && this.engine.moving.grab)) {
        sprite = OBJECT.ROCKFORD.right;
      } else if (this.engine.idle.blink && this.engine.idle.tap) {
        sprite = OBJECT.ROCKFORD.blinktap;
      } else if (this.engine.idle.blink) {
        sprite = OBJECT.ROCKFORD.blink;
      } else if (this.engine.idle.tap) {
        sprite = OBJECT.ROCKFORD.tap;
      } else {
        sprite = OBJECT.ROCKFORD.sprite;
      }
    } else if (obj === OBJECT.MAGICWALL && !this.engine.magicWallActive) {
      sprite = OBJECT.BRICKWALL.sprite;
    }

    if (!sprite) return;

    let frameOffset = 0;
    if (sprite.f && sprite.f > 1) {
      const fps = sprite.fps || 10;
      frameOffset = Math.floor(this.animTime * fps) % sprite.f;
    }

    const srcX = (sprite.x + frameOffset) * 32;
    const srcY = sprite.y * 32;

    ctx.drawImage(
      this.recoloredCanvas,
      srcX, srcY, 32, 32,
      Math.round(sx), Math.round(sy), Math.ceil(sw), Math.ceil(sh)
    );
  }

  renderHUD(ctx, cw, ch) {
    const hudHeight = 44;

    // Top HUD glassmorphic bar
    ctx.fillStyle = 'rgba(15, 13, 27, 0.90)';
    ctx.fillRect(0, 0, cw, hudHeight);

    // Accent line underneath using Drean Teal
    ctx.fillStyle = DREAN_PALETTE[10].hex; // Teal
    ctx.fillRect(0, hudHeight - 2, cw, 2);

    // 1. Diamond icon & Milestone progress
    this.renderSpriteIcon(ctx, OBJECT.DIAMOND.sprite, 14, 6, 32, 32);

    ctx.font = '700 15px "Press Start 2P", monospace';
    ctx.fillStyle = DREAN_PALETTE[6].hex; // Yellow
    const nextTarget = this.engine.nextMilestone ? this.engine.nextMilestone.count : '∞';
    ctx.fillText(`${this.engine.diamondsCollected}/${nextTarget}`, 52, 28);

    // 2. Exploration Depth
    ctx.font = '600 13px "Outfit", sans-serif';
    ctx.fillStyle = DREAN_PALETTE[12].hex; // Sky Blue
    ctx.fillText(`DEPTH: ${this.engine.maxDepth}m`, 160, 27);

    // 3. Seed / Roguelike World
    ctx.fillStyle = DREAN_PALETTE[14].hex; // Light Gray
    ctx.fillText(`SEED: #${this.engine.seed}`, 270, 27);

    // 4. Score on the right, safely to the left of the top-toolbar (which is docked at right: 16px)
    ctx.font = '700 15px "Press Start 2P", monospace';
    ctx.fillStyle = DREAN_PALETTE[7].hex; // White
    const scoreStr = String(this.engine.score).padStart(6, '0');
    const scoreText = `SCORE ${scoreStr}`;
    const scoreWidth = ctx.measureText(scoreText).width;
    const toolbarMargin = 245; // Reserved width for top toolbar buttons
    const scoreX = Math.max(380, cw - toolbarMargin - scoreWidth - 16);
    ctx.fillText(scoreText, scoreX, 28);
  }

  renderSpriteIcon(ctx, sprite, sx, sy, sw, sh) {
    if (!this.recoloredCanvas || !sprite) return;
    const srcX = sprite.x * 32;
    const srcY = sprite.y * 32;
    ctx.drawImage(
      this.recoloredCanvas,
      srcX, srcY, 32, 32,
      Math.round(sx), Math.round(sy), Math.ceil(sw), Math.ceil(sh)
    );
  }
}
