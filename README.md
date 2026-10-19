# Infinite Boulder Dash

A roguelike permadeath infinite cave exploring version of the classic **Boulder Dash**
Made by **Ernesto Borio** with LLMs based on the original Commodore 64 game.



## Credits & Acknowledgments

- **Peter Liepa and Chris Gray** — The creators of the original **Boulder Dash** (1984, First Star Software) on the Commodore 64.
- **Jake Gordon** — Creator of the open-source HTML5 Boulder Dash port. [https://github.com/jakesgordon/javascript-boulderdash]


## Description
The cave is semi-randomly generated as the user explores it, giving the impression of an infinite world.  
The world is generated anew each time the user looses a life.  
There's no level goal, the game just goes on infinitely.  
Achieve the maximum score and exploration depth.

### Play it online
https://ernestoborio.github.io/infinite-boulder-dash

### Renewed aesthetics
- The graphics are the same as the Commodore 64 version, but the palettes have been redesigned to look more vibrant.

### Authentic 1984 Physics Engine
- 10Hz tick-rate discrete simulation mirroring Peter Liepa's original Commodore 64 engine logic.
- Rounded surface physics: boulders and diamonds slide off rounded boulders, diamonds, and brick walls if the space below and adjacent is clear.
- Amoeba growth lifecycle: suffocates into diamonds if enclosed, or turns into boulders if it grows too large.
- Magic wall activation: transforms falling boulders into diamonds and diamonds into boulders for a limited duration.
- Creature explosions: butterflies explode into 9 diamonds; fireflies explode into empty space.



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



## 🚀 Running Locally

The game is built with zero external build dependencies — pure HTML5, CSS3, and native ES modules:

```bash
# Start any static HTTP server
npx http-server -p 8088 -o

# Open in browser
open http://localhost:8088/

# Test
npm test
```



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


## License
This project is free for you to do whatever you want, just give due credit to Peter Liepa, Chris Gray and Jake Gordon.
