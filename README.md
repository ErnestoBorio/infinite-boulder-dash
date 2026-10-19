# Infinite Boulder Dash

A modern, infinite procedural roguelike reimagining of the 1984 8-bit classic **Boulder Dash**, running natively in the browser with authentic physics, dynamic 16-color retro palettes, and persistent subterranean exploration.

---

## 🌟 Credits & Acknowledgments

This project stands on the shoulders of gaming history and passionate open-source preservation:

- **Peter Liepa** (along with Chris Gray) — The brilliant creator of the original **Boulder Dash** (1984, First Star Software) on the Commodore 64. Peter Liepa designed the revolutionary cellular-automaton physics, falling rock gravity, diamond glints, amoeba growth, and butterfly transformations that defined the action-puzzle genre.
- **Jake Gordon** — Creator of the open-source HTML5 Boulder Dash port, whose sprite extraction and clean canvas architecture served as an invaluable reference.


---

## 🎮 Key Features

### 1. Infinite Procedural Subterranean World
- **Chunk-Based Streaming**: Cave terrain generates on-the-fly in $16 \times 16$ tile chunks as Rockford moves in any direction.
- **Persistent Memory Retention**: All explored chunks remain in memory. If you dig a tunnel, drop a boulder, or carve a cavern at coordinates `(120, -85)`, walking away and returning later reveals the exact state you left behind.
- **Anti-Trapping Highway Corridors**: Procedural generator guarantees unobstructed horizontal and vertical coordinate corridors, ensuring Rockford always has avenues for escape.
- **Titanium Blocks**: Indestructible titanium blocks flank chambers and structure clusters, adding tactical choke points.
- **Macro-Structure Clusters**: Procedural generation stamps subterranean landmarks including Diamond Vaults, Ancient Pillar Halls, Underground Labyrinths, Long Tunnels, Subterranean Outposts, and Magic Laboratories.
- **Procedural Starter Hubs**: 5 varied starting chamber archetypes for chunk `(0, 0)` ensure no two expeditions begin the same way.

### 2. Roguelike Permadeath & Tiered Milestones
- **Permadeath**: True roguelike stakes — one life per expedition. Crushed by a falling boulder or caught in a bug explosion? Your expedition ends, displaying your final depth, diamonds gathered, and score.
- **Tiered Spelunker Milestones**: Collect diamonds to ascend the prestigious milestone ladder:
  - 💎 **10 Diamonds** — `CAVE EXPLORER` (+500 pts)
  - 💎 **25 Diamonds** — `GEM HUNTER` (+1,000 pts)
  - 💎 **50 Diamonds** — `PROSPECTOR` (+2,500 pts)
  - 💎 **100 Diamonds** — `DIAMOND MASTER` (+5,000 pts)
  - 💎 **150 Diamonds** — `DEEP DELVER` (+7,500 pts)
  - 💎 **200 Diamonds** — `MYTHIC EXCAVATOR` (+10,000 pts)
  - 💎 **300 Diamonds** — `MEGA SPELUNKER` (+15,000 pts)
  - 💎 **500 Diamonds** — `DIAMOND EXTERMINATOR` (+25,000 pts)
  - 💎 **1,000 Diamonds** — `MYTHIC MEGA LEGEND` (+50,000 pts)
  - 💎 **2,000 Diamonds** — `UNIVERSAL PRODIGY` (+100,000 pts)
  - 💎 **5,000+ Diamonds** — `MISSINGNO.` (+999,999 pts, recurring every 1,000 diamonds)

### 3. Curated 16-Color Harmonic Retro Palettes
- **Beyond C64 Hardware Limits**: The original C64 VIC-II chip forced all character tiles to share global multicolor registers (black, red, dark gray, plus one custom color). *Infinite Boulder Dash* removes this limit.
- **Independent 4-Color Palettes per Entity**: Rockford, boulders, diamonds, dirt, brick walls, titanium blocks, magic walls, amoeba, fireflies, butterflies, and explosions each possess their own distinct 4-color palette.
- **Curated Harmonic Themes**: Rather than harsh random noise, every entity draws from curated palettes specifically balanced for **luminance, depth, and material identity**:
  - **Boulders** always look like natural mineral stones (Granite, Slate, Sandstone, Basalt, Limestone, Mossy Cobble, Amethyst Ore, Ironstone, Glacial Stone, Pyrite).
  - **Diamonds** glitter as sparkling precious gemstones (Sapphire, Emerald, Ruby, Amethyst, Topaz, Aquamarine, Alexandrite, Sunstone) with brilliant white facet highlights.
  - **Rockford** features crisp facial contrast and readable clothes separation across 10 adventurer archetypes.
  - **Dirt** preserves organic cavern soil texture with dark pores.
  - **Titanium Blocks** retain metallic heavy-alloy plating.
- **Randomized on Reset**: Every new expedition rolls fresh harmonious palettes across entities from hundreds of millions of combinations.

### 4. Authentic 1984 Physics Engine
- 10Hz tick-rate discrete simulation mirroring Peter Liepa's original Commodore 64 engine logic.
- Rounded surface physics: boulders and diamonds slide off rounded boulders, diamonds, and brick walls if the space below and adjacent is clear.
- Amoeba growth lifecycle: suffocates into diamonds if enclosed, or turns into boulders if it grows too large.
- Magic wall activation: transforms falling boulders into diamonds and diamonds into boulders for a limited duration.
- Creature explosions: butterflies explode into 9 diamonds; fireflies explode into empty space.

### 5. Camera Tracking with 1/3 Deadzone
- Rockford moves freely inside a central $\frac{1}{3}$ rectangular window without camera jitter.
- Once Rockford reaches the boundary, the camera smoothly pans just enough to maintain his position within the deadzone.

### 6. Web Audio C64 Synthesizer
- Built-in procedural sound synthesis without external audio files:
  - Diamond collection chime
  - Boulder drop / impact thud
  - Dirt digging footstep crunch
  - Noise-burst explosions
  - Quota reached fanfare

---

## 🕹️ Controls

| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Move Up** | `Arrow Up` / `W` | D-Pad Up |
| **Move Down** | `Arrow Down` / `S` | D-Pad Down |
| **Move Left** | `Arrow Left` / `A` | D-Pad Left |
| **Move Right** | `Arrow Right` / `D` | D-Pad Right |
| **Grab / Dig in Place** | `Space` + `Arrow` / `Shift` + `Arrow` | `GRAB` + D-Pad |
| **New Expedition (Reset)** | `R` | `NEW WORLD` Button |
| **Toggle Audio** | `M` | `SOUND: ON/OFF` Button |

---

## 🚀 Running Locally

The game is built with zero external build dependencies — pure HTML5, CSS3, and native ES modules:

```bash
# Clone or navigate to repository
cd BoulderDash

# Start any static HTTP server (Python 3, Node, or Nginx)
python3 -m http.server 8088

# Open in browser
open http://localhost:8088/
```

### Running Tests
The project includes automated verification test suites for cave decoding, physics, infinite memory persistence, and palette generation:

```bash
npm test
```

---

## 📁 Project Structure

```
BoulderDash/
├── index.html            # Responsive full-window UI and game viewport
├── css/
│   └── boulderdash.css   # Dark HUD styling and D-pad controls
├── images/
│   └── sprites.png       # Extracted C64 tile and sprite graphic sheet
├── src/
│   ├── caves.js          # 16-color retro palette, object definitions, and PRNG
│   ├── engine.js         # Core Boulder Dash physics, milestones, and roguelike state
│   ├── infinite-world.js # Infinite chunk generator, memory caching, anti-trapping highways
│   ├── renderer.js       # Canvas 2D renderer, 1/3 deadzone camera, dynamic retro palettes
│   ├── sound.js          # Web Audio C64 sound synthesizer
│   └── main.js           # Game lifecycle, input loop, and DOM HUD bindings
├── test/
│   ├── test-caves.js     # Cave decoder and PRNG determinism tests
│   ├── test-engine.js    # Physics simulation, movement, and gravity tests
│   ├── test-infinite.js  # Infinite chunk generation, persistence, and palette tests
│   └── test-roguelike.js # Permadeath, milestones, and seed generation tests
├── package.json          # Test runner scripts
└── README.md             # Project documentation
```

---

## 📜 License
This project is created for educational and preservation purposes, paying homage to the legendary 1984 masterpiece created by **Peter Liepa** and **First Star Software**.
