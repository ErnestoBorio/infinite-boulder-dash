# Infinite Boulder Dash

A procedural roguelike reimagining of the 1984 8-bit classic **Boulder Dash**, featuring endless subterranean exploration, permadeath mechanics, and authentic Commodore 64 physics running natively in the modern browser.

Created by **Ernesto Borio** using LLM assistance, based on the original Commodore 64 classic.

🎮 **[Play Online](https://ernestoborio.github.io/infinite-boulder-dash/)**

---

## 📖 Overview

Unlike the original game's fixed rectangular levels, **Infinite Boulder Dash** generates an endless, persistent underground labyrinth as you explore. Dig through dirt, dodge tumbling boulders, collect sparkling diamonds, and delve as deep into the earth as you can survive.

- **Infinite Procedural Caverns**: Terrain generates on-the-fly in $16 \times 16$ tile chunks as you move in any direction.
- **Persistent World Memory**: Caverns stay as you left them. Dug paths, dropped boulders, and cleared pockets persist in memory as you roam and return.
- **True Permadeath**: One life per expedition. When crushed or caught in an explosion, your run ends, recording your maximum depth and final score before rolling a fresh world seed.
- **Milestone Rewards**: Reaching diamond collection milestones triggers celebratory space-flashing fanfare and score bonuses.
- **Dynamic Retro Aesthetics**: Graphics are rendered using authentic 1984 sprite tiles, recolored dynamically with vibrant 16-color retro palettes that randomly vary on each run while ensuring walls and magic walls share matching camouflage.

---

## 🕹️ Controls

| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Move Up** | <kbd>↑</kbd> / <kbd>W</kbd> | D-Pad Up |
| **Move Down** | <kbd>↓</kbd> / <kbd>S</kbd> | D-Pad Down |
| **Move Left** | <kbd>←</kbd> / <kbd>A</kbd> | D-Pad Left |
| **Move Right** | <kbd>→</kbd> / <kbd>D</kbd> | D-Pad Right |
| **Grab / Dig in Place** | <kbd>Space</kbd> + Direction / <kbd>Shift</kbd> + Direction | <kbd>GRAB</kbd> + D-Pad |
| **New Expedition (Reset)** | <kbd>R</kbd> | `NEW WORLD` Button |
| **Toggle Audio** | <kbd>M</kbd> | `SOUND: ON/OFF` Button |

---

## ⚙️ Core Mechanics & Physics

Infinite Boulder Dash preserves the authentic cellular-automaton simulation of the 1984 Commodore 64 release:

- **10Hz Discrete Engine**: Physics run on a deterministic 10 ticks-per-second discrete cycle matching Peter Liepa's original timing.
- **Rounded Surface Slide**: Boulders and diamonds slip and roll off rounded objects (other boulders, diamonds, and brick walls) whenever adjacent and lower spaces are open.
- **Amoeba Dynamics**: Living amoeba slowly expands through dirt and space. Enclosing it entirely converts it into valuable diamonds; letting it grow unchecked turns it into solid rock.
- **Magic Walls**: Dormant magic walls share the same appearance and color palette as standard brick walls. Once struck by a falling boulder, they activate—transforming falling boulders into diamonds and diamonds into boulders for a brief period.
- **Creature Explosions**: Fireflies explode into open space upon impact; butterflies burst into a $3 \times 3$ bounty of 9 diamonds.
- **Camera Deadzone**: A central $\frac{1}{3}$ rectangular deadzone prevents camera shake during subtle movements while smoothly panning as Rockford explores outward.
- **Procedural Audio**: Sound effects (crunching dirt, falling boulders, diamond glints, and explosions) are synthesized in real-time via the Web Audio API with zero external audio assets.

---

## 🚀 Running Locally

The project runs natively with pure HTML5, CSS3, and modern ES modules—no bundlers or build steps required.

### Quick Start

```bash
# Start a local static server
npx http-server -p 8088 -o

# Or using Python 3
python3 -m http.server 8088
```

Then visit [http://localhost:8088](http://localhost:8088) in your browser.

### Running Test Suites

```bash
npm test
```

Verifies cave decoding, procedural PRNG determinism, physics engine gravity/movement, infinite memory retention, and palette consistency.

---

## 📁 Project Structure

```
BoulderDash/
├── index.html            # Responsive game container and HUD overlay
├── css/
│   └── boulderdash.css   # Dark glassmorphic styling and touch controls
├── images/
│   └── sprites.png       # Extracted Commodore 64 tile and sprite graphic sheet
├── src/
│   ├── caves.js          # Retro color palette definitions and authentic data structures
│   ├── engine.js         # Core Boulder Dash physics, milestones, and roguelike state
│   ├── infinite-world.js # Procedural chunk streamer, memory cache, and corridors
│   ├── renderer.js       # Canvas 2D renderer, deadzone tracking, and palette shader
│   ├── sound.js          # Real-time Web Audio C64 sound synthesizer
│   └── main.js           # Lifecycle management, input handling, and HUD bindings
├── test/
│   ├── test-caves.js     # Cave decoding and PRNG validation
│   ├── test-engine.js    # Movement, diamond collection, and boulder physics tests
│   ├── test-infinite.js  # Infinite streaming, persistence, and palette tests
│   └── test-roguelike.js # Permadeath, milestones, and seed generation tests
├── package.json          # Test runner configuration
└── README.md             # Project documentation
```

---

## 🌟 Credits & Acknowledgments

This project is built with deep appreciation for classic gaming history and open-source preservation:

- **Peter Liepa & Chris Gray** — Creators of the original **Boulder Dash** (1984, First Star Software) on the Commodore 64.
- **Jake Gordon** — Author of the open-source [javascript-boulderdash](https://github.com/jakesgordon/javascript-boulderdash) HTML5 port, whose extracted sprite assets and architecture provided an essential foundation.

---

## 📜 License

This project is open-source and free to adapt, modify, and build upon. Please preserve due attribution to **Peter Liepa**, **Chris Gray**, and **Jake Gordon**.
