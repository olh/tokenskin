# Token Skin ⚔️🌲⚡

> **An open-world voxel MMORPG & Battle Royale web browser game engine, merging the creative freedom of Minecraft with the depth of RuneScape and high-intensity competitive arena survival.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Engine: Three.js](https://img.shields.io/badge/Engine-Three.js%20WebGL-emerald.svg)](https://threejs.org/)
[![Language: TypeScript](https://img.shields.io/badge/Language-TypeScript%20Strict-blue.svg)](https://www.typescriptlang.org/)
[![Tooling: Vite](https://img.shields.io/badge/Bundler-Vite%208-purple.svg)](https://vitejs.dev/)
[![Audio: Web Audio API](https://img.shields.io/badge/Audio-Procedural%20Web%20Audio-orange.svg)]()

---

## 🌟 Executive Overview

**Token Skin** is a browser-native 3D open-world game built from the ground up using modern web technologies (Three.js, WebGL, TypeScript, Vite, and Web Audio API). It brings together two legendary gameplay philosophies:
1. **The Sandbox Voxel World & MMORPG Progression**: Explore infinite procedurally-generated terrain, chop trees for wood, mine deep veins for gold and token diamonds, level up skills (Woodcutting, Mining, Combat, Defense) following classic RuneScape mechanics, converse with NPCs like *Elder Bob*, and complete multi-tiered quests while battling hostile goblins, skeletons, and zombies.
2. **The Token Arena (Battle Royale Mode)**: Toggle seamlessly into competitive survival mode where an electric storm forcefield continuously shrinks towards a randomized ground center. Scavenge glowing golden supply drops, outmaneuver roaming threats, and fight to be the last survivor.

All gameplay, rendering, voxel meshing, collision physics, and synthesized sound effects run **100% locally in the browser with zero external asset dependencies or downloads**.

---

## 🎯 Who It's For

- **Web Gamers & RPG Fans**: Players looking for a zero-install, instant-loading 3D open-world experience that runs directly in modern browsers at a smooth 60+ FPS.
- **Classic MMORPG Enthusiasts**: Players who appreciate old-school skill grinding, XP milestones, level-up fanfares, quest journals, and inventory equipment management reminiscent of RuneScape.
- **Battle Royale Players**: Gamers who love storm-survival mechanics, tactical looting, and tension-filled zone rotations.
- **Developers & Engine Architects**: Programmers interested in custom voxel engines, face-culling meshing algorithms, deterministic AABB physics, procedural Web Audio synthesis, and modular game architectures.

---

## 🚀 Key Features

### 1. High-Performance Voxel Sandbox Engine
- **Chunk Management**: 16x32x16 voxel chunk architecture with automated dynamic streaming.
- **Face Culling & Ambient Occlusion**: Only exposed voxel faces adjacent to air/water are meshed; vertex-colored ambient occlusion adds authentic corner depth while keeping render calls ultra-low.
- **Multi-Octave Procedural Worldgen**: Seedable 2D/3D Simplex noise generates natural rolling hills, beaches, subterranean caverns, and mineral deposits (Coal, Gold, Diamond).
- **Procedural Pixel-Art Textures**: Clean 16x16 pixel-art canvas textures generated at runtime with `NearestFilter` for sharp retro-modern visuals without external image lag.
- **Dynamic Block Interactions**: Real-time raycasting for block targeting, block destruction with particle drops, and valid block placement.

### 2. RuneScape-Inspired MMORPG Systems
- **Skill Progression (Lv. 1 - 99)**:
  - **Woodcutting**: Chop trees to harvest logs and earn Woodcutting XP.
  - **Mining**: Mine stone, cobblestone, gold ore, and rare diamond gems.
  - **Combat & Attack**: Strike hostile monsters; damage scales with equipment and combat levels.
  - **Defense & Vitality**: Leveling defense enhances total survivability.
  - **XP Popups & Fanfare**: Floating XP text on actions and triumphant musical chords on level-ups.
- **Interactive Quests**:
  - *"The Pioneer's Awakening"*: Harvest wood, craft planks, and learn survival fundamentals.
  - *"Goblin Incursion"*: Eliminate hostile goblins encroaching on the settlement.
  - *"Depths of Wealth"*: Delve underground to extract precious ores.
  - *"Arena Gladiator"*: Survive storm phases in Battle Royale mode.
- **NPCs & Hostile Entities**:
  - Friendly sage **Elder Bob** with interactive dialogue trees.
  - Hostile monsters: **Forest Goblins**, **Crypt Zombies**, and **Skeleton Raiders** featuring complete AI state machines (Idle, Patrol, Aggro Chase, Melee Attack, Flinch, Death) with loot drops.
- **Inventory & Hotbar**: 28-slot inventory grid (RuneScape style) and 9-slot quick-action hotbar (Minecraft style).

### 3. "The Token Arena" — Battle Royale Mode
- **Instant Mode Switch**: Seamlessly transition between MMORPG and Battle Royale modes anytime via `B` or the HUD badge.
- **Shrinking Electric Storm**: A towering holographic forcefield cylinder that collapses across 3 timed phases towards safe zones.
- **Storm Hazard**: Players outside the boundary receive periodic storm damage ticks, triggering screen hazard vignettes and warning sirens.
- **Supply Drop Crates**: Scattered golden chests with sky beacon beams containing rare weapons and restorative elixirs.
- **Simulated Arena Match**: Dynamic killfeed notifications and live participant tracking leading to the **VICTORY ROYALE** screen.

### 4. Pure Procedural Web Audio Engine
- **Zero External Audio Files**: 100% synthesized through the browser's native `AudioContext`.
- Real-time synthesis for footsteps (grass/stone/wood), block breaking, block placement, sword whooshes, metallic combat impacts, creature groans, supply chest chimes, level-up arpeggios, and storm klaxons.

### 5. Dual Camera & Minimap Radar
- **Camera Toggle (`V`)**: Switch between First-Person pointer-lock view and Third-Person chase camera.
- **Live Minimap Radar**: Top-down 2D canvas radar displaying player orientation, cardinal directions, nearby monsters (red), NPCs (green), and shrinking storm zones (purple).

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies |
| :--- | :--- |
| **3D Rendering** | [Three.js](https://threejs.org/) (WebGL 2.0 / PCF Soft Shadows / BufferGeometry) |
| **Language & Tooling** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) & [Vite](https://vitejs.dev/) |
| **Procedural Terrain** | Multi-Octave Fractal Simplex Noise (2D/3D fBm) |
| **Physics** | Custom deterministic AABB (Axis-Aligned Bounding Box) voxel collision & step climbing |
| **Audio** | Native HTML5 [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) (Oscillators, Noise buffers, Biquad filters, ADSR envelopes) |
| **User Interface** | Modular HTML5, CSS3 Glassmorphism, and 2D Canvas Radar |

```
tokenskin/
├── index.html                  # Game canvas, HUD overlays, modals, and hotbar
├── vite.config.ts              # Vite development & build configuration
├── tsconfig.json               # TypeScript strict configuration
├── package.json                # Project dependencies and npm scripts
├── LICENSE                     # MIT License
├── README.md                   # Project overview, installation, and controls
├── ROADMAP.md                  # Comprehensive landmark development plan
└── src/
    ├── main.ts                 # Application entry point
    ├── style.css               # Game HUD styling, theme, and animations
    ├── core/
    │   ├── Engine.ts           # Main game loop, scene setup, lighting, and coordination
    │   ├── InputManager.ts     # Keyboard, pointer lock, mouse clicks, and wheel cycling
    │   └── SoundEngine.ts      # Pure procedural Web Audio API sound synthesizer
    ├── voxel/
    │   ├── BlockTypes.ts       # Block registry, hardness, drops, and sound profiles
    │   ├── TextureAtlas.ts     # Procedural 16x16 pixel-art canvas textures
    │   ├── SimplexNoise.ts     # Seedable 2D/3D fractal simplex noise
    │   ├── Chunk.ts            # Voxel data storage, face culling, and AO meshing
    │   └── World.ts            # Chunk streaming, worldgen, and DDA voxel raycasting
    ├── physics/
    │   ├── AABB.ts             # 3D bounding boxes and intersection math
    │   └── Physics.ts          # Continuous voxel collision, gravity, jumping, and step-up
    ├── player/
    │   ├── Player.ts           # Player entity, 3D avatar, dual cameras, stats, and animations
    │   ├── SkillsManager.ts    # RuneScape skill leveling (Lv. 1-99) & XP curves
    │   └── Inventory.ts        # 28 inventory slots + 9 hotbar slots + equipment slots
    ├── entities/
    │   ├── Entity.ts           # Base entity class with overhead health bars
    │   ├── EntityManager.ts    # Entity lifecycle, spawning, and combat detection
    │   ├── NPC.ts              # Friendly quest givers (Elder Bob) with speech dialogue
    │   └── Monster.ts          # Hostile mobs (Goblins, Zombies, Skeletons) with AI state machine
    ├── rpg/
    │   └── QuestManager.ts     # Multi-stage questlines, objectives, and rewards
    ├── battleroyale/
    │   └── BattleRoyaleManager.ts # Electric storm forcefield, phases, supply chests, and victory
    └── ui/
        ├── HUD.ts              # UI controller, health/stamina/XP gauges, modals, notifications
        └── Minimap.ts          # Real-time top-down 2D radar
```

---

## 🎮 How to Run

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0 or newer recommended)
- `npm` (v9.0 or newer)

### Installation & Launch

1. **Clone or navigate into the repository**:
   ```bash
   cd tokenskin
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open your browser to the local URL (typically **`http://localhost:3000`**).

4. **Build production bundle**:
   ```bash
   npm run build
   ```
   The compiled, optimized distribution will be output to the `dist/` directory.

5. **Preview production build**:
   ```bash
   npm run preview
   ```

---

## 🕹️ Controls Guide

| Input | Action |
| :--- | :--- |
| **`W` / `A` / `S` / `D`** | Move forward, left, backward, right |
| **`Mouse Movement`** | Look around (Pointer Lock active) |
| **`Left Mouse Click`** | Attack monsters / Mine targeted block |
| **`Right Mouse Click`** | Place block / Consume food & potions / Talk to NPCs |
| **`Space`** | Jump / Swim upwards in water |
| **`Left Shift`** | Sprint (boosts speed; consumes Stamina) |
| **`V`** | **Toggle Camera**: Switch between 1st Person & 3rd Person View |
| **`B`** | **Toggle Mode**: Switch between MMORPG Open World & Battle Royale Arena |
| **`1` – `9` / `Scroll Wheel`** | Select active hotbar item slot |
| **`E`** | Open / Close 28-Slot Inventory Grid |
| **`Q`** | Open / Close Quest Journal |
| **`H`** | Open / Close Game Controls & Help Guide |
| **`Esc`** | Release mouse pointer lock |

---

## 🗺️ Roadmap & Future Development

A comprehensive landmark roadmap detailing phases, feature expansions (WebGPU graphics, high-concurrency multiplayer networking, Grand Exchange economy, boss raids, clan citadels, mobile touch support) is available in [ROADMAP.md](ROADMAP.md).

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for complete details.
