/**
 * Infinite Boulder Dash - Full-Window Canvas 2D Renderer
 * Renders an infinite procedural cave with smooth scrolling, 16-color retro palette, and clean HUD.
 */

import { OBJECT, DIR, RETRO_PALETTE } from './caves.js';

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
 * Curated thematic palettes from 16-color retro palette.
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
    [0, 5, 4, 10],  // Toxic Explorer: Cyan pants, Bright Green skin, Dark Green shirt
    [0, 7, 14, 15],  // Noir / Phantom: White pants, Light Gray skin, Dark Gray shirt
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
    [0, 9, 15, 14], // Classic Earth / Rich Humus: Brown, Dark Gray, Light Gray
    [0, 9, 2, 13],  // Red Clay: Brown, Red, Light Red
    [0, 15, 9, 14], // Cavern Peat: Dark Gray, Brown, Light Gray
    [0, 9, 15, 10], // Mossy Grotto: Brown, Dark Gray, Teal
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
  // Note: magicwall shares the exact same palette as brickwall
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
 * Generates independent 4-color retro palettes for every entity in the game.
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
      RETRO_PALETTE[indices[0]], // Slot 0 (Black)
      RETRO_PALETTE[indices[1]], // Slot 1
      RETRO_PALETTE[indices[2]], // Slot 2
      RETRO_PALETTE[indices[3]]  // Slot 3
    ];
  }

  // Magic walls share the exact same palette as brick walls
  palettes['magicwall'] = palettes['brickwall'];

  // High-contrast palettes for UI glyphs/fonts
  palettes['fontWhite'] = [
    RETRO_PALETTE[0],
    RETRO_PALETTE[7],  // White
    RETRO_PALETTE[14], // Light Gray
    RETRO_PALETTE[7]   // White
  ];
  palettes['fontYellow'] = [
    RETRO_PALETTE[0],
    RETRO_PALETTE[6],  // Yellow
    RETRO_PALETTE[15], // Dark Gray
    RETRO_PALETTE[7]   // White
  ];
  palettes['default'] = [
    RETRO_PALETTE[0],
    RETRO_PALETTE[9],  // Brown
    RETRO_PALETTE[10], // Teal
    RETRO_PALETTE[14]  // Light Gray
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

    // Center HUD Title Image
    this.titleImage = null;
    this.titleImageLoaded = false;
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

        this.recolorWithPalette(this.engine ? this.engine.seed : null);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  async loadTitle(src = 'images/infinite-boulder-dash.png') {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, c.width, c.height);
          const data = imgData.data;

          // Check if image already has native transparency
          let hasTransparent = false;
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 250) {
              hasTransparent = true;
              break;
            }
          }

          // If fully opaque without alpha, key out pure black background
          if (!hasTransparent) {
            for (let i = 0; i < data.length; i += 4) {
              if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) {
                data[i + 3] = 0;
              }
            }
            ctx.putImageData(imgData, 0, 0);
          }

          // Auto-trim transparent borders (threshold of alpha > 15 ignores faint mask dust)
          let minX = c.width, maxX = 0, minY = c.height, maxY = 0;
          let hasVisible = false;
          for (let y = 0; y < c.height; y++) {
            for (let x = 0; x < c.width; x++) {
              const a = data[(y * c.width + x) * 4 + 3];
              if (a > 15) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                hasVisible = true;
              }
            }
          }

          if (hasVisible && (minX > 0 || minY > 0 || maxX < c.width - 1 || maxY < c.height - 1)) {
            const trimW = maxX - minX + 1;
            const trimH = maxY - minY + 1;
            const trimmed = document.createElement('canvas');
            trimmed.width = trimW;
            trimmed.height = trimH;
            const trimCtx = trimmed.getContext('2d');
            trimCtx.drawImage(c, minX, minY, trimW, trimH, 0, 0, trimW, trimH);
            this.titleImage = trimmed;
          } else {
            this.titleImage = c;
          }

          this.titleImageLoaded = true;
          resolve(this.titleImage);
        } catch (e) {
          this.titleImage = img;
          this.titleImageLoaded = true;
          resolve(img);
        }
      };
      img.onerror = () => {
        const fallbacks = [
          'infinite-boulder-dash.png',
          'images/IBD.png',
          'IBD.png',
          'images/title.png'
        ];
        const next = fallbacks.find((f) => f !== src);
        if (next) {
          this.loadTitle(next).then(resolve);
        } else {
          this.titleImageLoaded = false;
          resolve(null);
        }
      };
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
   * Recolor spritesheet dynamically using independent 4-color retro palettes for each entity.
   * Rockford, boulders, diamonds, dirt, walls, etc. each get their own 4 retro colors.
   * Automatically randomized on every game reset.
   */
  recolorWithPalette(palettesOrSeed = null) {
    if (!this.spritesLoaded) return;

    let palettes;
    if (palettesOrSeed && typeof palettesOrSeed === 'object' && !Array.isArray(palettesOrSeed) && palettesOrSeed.rockford) {
      palettes = Object.assign({}, palettesOrSeed);
      if (palettes.brickwall) {
        palettes.magicwall = palettes.brickwall;
      }
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

  cycleRockfordPalette() {
    const themes = ENTITY_THEMES.rockford;
    const themeNames = [
      "Toxic Explorer (Cyan pants, Bright Green skin, Dark Green shirt)",
      "Noir / Phantom (White pants, Light Gray skin, Dark Gray shirt)",
      "Classic Explorer (Blue pants, Light Skin face, Red shirt)",
      "Blue Miner (Blue pants, Yellow skin, Blue shirt)",
      "Retro 1984 (Blue pants, White skin, Red shirt)",
      "Spelunker Pro (Dark Gray pants, Light Skin face, Yellow shirt)",
      "Arctic Adventurer (Blue pants, Light Skin face, White parka)",
      "Desert Scavenger (Brown pants, Light Skin face, Light Red shirt)",
      "Neon Cyberminer (Violet pants, Light Skin face, Cyan shirt)",
      "Deep Cavernier (Teal pants, Light Skin face, Light Gray shirt)",
      "Lava Diver (Dark Gray pants, Light Skin face, Red shirt)",
      "Forest Ranger (Brown pants, Light Skin face, Green shirt)",
      "Hazmat Operative (Light Gray suit, Sky Blue visor, White helmet)",
      "Stealth Miner (Dark Gray suit, Light Skin face, Light Gray vest)"
    ];
    this.rockfordThemeIdx = ((this.rockfordThemeIdx ?? -1) + 1) % themes.length;
    const indices = themes[this.rockfordThemeIdx];
    const newPalettes = Object.assign({}, this.currentPalettes || generateRandomEntityPalettes(this.engine ? this.engine.seed : null));
    newPalettes.rockford = [
      RETRO_PALETTE[indices[0]],
      RETRO_PALETTE[indices[1]],
      RETRO_PALETTE[indices[2]],
      RETRO_PALETTE[indices[3]]
    ];
    this.recolorWithPalette(newPalettes);
    return {
      index: this.rockfordThemeIdx,
      total: themes.length,
      name: themeNames[this.rockfordThemeIdx] || `Theme ${this.rockfordThemeIdx + 1}`,
      palette: newPalettes.rockford
    };
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  getRockfordScreenPos() {
    const ts = this.tileSize;
    const px = (this.engine.rockford ? this.engine.rockford.x + 0.5 : (this.engine.deathPos ? this.engine.deathPos.x + 0.5 : 4.5)) * ts;
    const py = (this.engine.rockford ? this.engine.rockford.y + 0.5 : (this.engine.deathPos ? this.engine.deathPos.y + 0.5 : 4.5)) * ts;
    return {
      x: Math.round(px - this.camera.x),
      y: Math.round(py - this.camera.y)
    };
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

    // Flash empty spaces white twice during milestone celebration:
    // Frames 6 & 5 (~200ms): First white flash
    // Frame 4 (~100ms): Dark gap
    // Frames 3 & 2 (~200ms): Second white flash
    // Frame 1 (~100ms): Dark gap
    const ff = this.engine.flashFrames;
    this.spaceFlashWhite = (ff === 6 || ff === 5 || ff === 3 || ff === 2);

    // Render all visible cells (automatically generates & stores in memory any newly explored chunks)
    for (let y = minCellY; y <= maxCellY; y++) {
      for (let x = minCellX; x <= maxCellX; x++) {
        const cell = this.engine.world.getCell(x, y);
        const screenX = x * ts - Math.round(this.camera.x);
        const screenY = y * ts - Math.round(this.camera.y);

        this.renderCell(ctx, cell, screenX, screenY, ts, ts);
      }
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
      const dir = this.engine.moving.dir;
      const isMoving = dir !== null;
      const isFacingLeft = (dir === DIR.LEFT) || (dir !== DIR.RIGHT && this.engine.moving.lastXDir === DIR.LEFT);

      if (isMoving || this.engine.moving.grab) {
        sprite = isFacingLeft ? OBJECT.ROCKFORD.left : OBJECT.ROCKFORD.right;
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

    // Accent line underneath
    ctx.fillStyle = RETRO_PALETTE[10].hex; // Teal
    ctx.fillRect(0, hudHeight - 2, cw, 2);

    // 1. Diamond icon & Milestone progress
    this.renderSpriteIcon(ctx, OBJECT.DIAMOND.sprite, 14, 6, 32, 32);

    ctx.font = '700 15px "Press Start 2P", monospace';
    ctx.fillStyle = RETRO_PALETTE[6].hex; // Yellow
    const nextTarget = this.engine.nextMilestone ? this.engine.nextMilestone.count : '∞';
    const diamText = `${this.engine.diamondsCollected}/${nextTarget}`;
    ctx.fillText(diamText, 52, 28);
    const diamWidth = ctx.measureText(diamText).width;

    // 2. Score (positioned safely on left next to diamonds, unoccluded by top-right toolbar buttons)
    ctx.font = '700 14px "Press Start 2P", monospace';
    ctx.fillStyle = RETRO_PALETTE[7].hex; // White
    const scoreStr = String(this.engine.score).padStart(6, '0');
    const scoreText = (cw < 560) ? scoreStr : `SCORE ${scoreStr}`;
    const scoreX = Math.round(52 + diamWidth + (cw < 560 ? 14 : 24));
    ctx.fillText(scoreText, scoreX, 28);
    const scoreWidth = ctx.measureText(scoreText).width;

    // 3. Exploration Depth (displayed when space permits before center title)
    const targetW = Math.min(276, Math.max(120, cw - 460));
    const titleLeft = Math.round((cw - targetW) / 2);
    const depthX = scoreX + scoreWidth + 22;

    if (cw >= 820 && depthX + 85 < titleLeft) {
      ctx.font = '600 13px "Outfit", sans-serif';
      ctx.fillStyle = RETRO_PALETTE[12].hex; // Sky Blue
      ctx.fillText(`DEPTH: ${this.engine.maxDepth}m`, depthX, 27);
    }
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
