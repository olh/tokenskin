# Token Skin — Landmark Development Roadmap

This roadmap delineates the comprehensive developmental trajectory for **Token Skin**, transforming the functioning browser-based voxel engine into an expansive, world-class MMORPG (in the vein of classic RuneScape) with a seamless, high-intensity Battle Royale mode ("The Token Arena").

In accordance with our architecture goals, this roadmap is structured around strategic **Landmarks** and **Milestones**, outlining technical deliverables, game design systems, and network infrastructure.

---

## Landmark Phase 1: High-Performance Voxel Core & Biospheric World Generation

### Landmark 1.1: Greedy Meshing & Voxel Buffer Optimization
- [x] Implement face-culling voxel chunk mesher (`Chunk.ts`) to eliminate hidden geometry.
- [x] Construct procedural 16x16 pixel-art procedural texture atlas with nearest-neighbor filtering.
- [ ] Upgrade chunk renderer to full 3D Greedy Meshing algorithm (quad coalescing), reducing triangle count by an additional 60-70%.
- [ ] Implement Worker-based asynchronous chunk generation and meshing on Web Workers to maintain 60-120 FPS without main-thread stalling.
- [ ] Implement Level-of-Detail (LOD) chunk pyramids for distant terrain horizons up to 32 chunks (512 meters).

### Landmark 1.2: Biosphere Diversity & Underground Caverns
- [x] Procedural multi-octave Simplex terrain with rolling plains, beaches, and oak forests.
- [x] Ore vein clustering for Coal, Gold, and Token Diamond gems.
- [ ] Add distinct biomes: Scorched Desert, Glacial Tundra, Volcanic Crag, Swamps, and Deep Dark Underworld.
- [ ] 3D Perlin worm cave generation producing winding subterranean cave systems, stalactites, and underground lakes.
- [ ] Biome-specific vegetation and flora: Pine trees, jungle canopies, desert cacti, harvestable herbs, and glowing cave mushrooms.

---

## Landmark Phase 2: RuneScape-Style Skill Progression & Resource Economy

### Landmark 2.1: The Gathering Skills
- [x] **Woodcutting**: Tree chopping mechanics, wood logs itemization, XP tracking, level progression (Lv. 1-99).
- [x] **Mining**: Mineral and stone extraction, hardness tiers, tool effectiveness scaling.
- [ ] **Fishing**: Coastal and river fishing nodes, rod and harpoon tools, animated bobbers, raw fish types (Trout, Salmon, Shark).
- [ ] **Farming & Foraging**: Crop patches, seed cultivation, growth ticks, herb harvesting for alchemy.

### Landmark 2.2: The Artisan Skills
- [ ] **Firemaking & Cooking**: Burning harvested logs to ignite campfires; cooking raw meats and fish with burn/success rates.
- [ ] **Smithing & Metallurgy**: Smelting ores into bronze, iron, steel, mithril, adamant, and runite bars at furnaces; forging blades, plate armor, and arrowheads at anvils.
- [ ] **Crafting & Leatherworking**: Tanning beast hides, carving wooden bows, cutting gems into stat-boosting rings and amulets.
- [ ] **Runecrafting**: Extracting elemental essence from altars to create battle runes for arcane spells.

### Landmark 2.3: Economic Foundations & Player Stash
- [x] 28-slot classic RuneScape inventory grid with tooltips and stackable commodities.
- [x] 9-slot fast-action hotbar with keybind mapping and mouse-wheel cycling.
- [ ] Central Bank Vault system: Secure bank deposit chests located in settlement hubs with tab organization, search filter, and PIN security.
- [ ] Player-to-Player Direct Trading: Two-party confirmation trade window with counterfeit prevention.
- [ ] Grand Exchange / Auction House: Global asynchronous buy/sell order book for items and raw materials.

---

## Landmark Phase 3: Combat Triangle, Boss Encounters & Mob Intelligence

### Landmark 3.1: The Combat Triangle (Melee, Ranged, Magic)
- [x] Real-time melee hitboxes, weapon damage scaling, dynamic combat XP distribution, and floating combat text.
- [x] First-person and third-person chase camera toggling (`V` key).
- [ ] **Ranged Combat**: Bows, crossbows, projectile trajectory physics, arrow drop, quiver ammunition slot.
- [ ] **Magic Combat**: Spellbook UI, projectile spells (Fire Strike, Ice Barrage, Wind Surge), teleportation rituals, and binding curses.
- [ ] Combat Triangle balance mechanics (Melee beats Ranged, Ranged beats Magic, Magic beats Melee).

### Landmark 3.2: Advanced Entity AI & Boss Raids
- [x] Entity state machine (Idle, Patrol, Aggro Chase, Melee Attack, Flinch, Death).
- [x] Friendly NPC interaction (Elder Bob) with speech dialogue modal and quest triggers.
- [x] Mobs: Forest Goblins, Crypt Zombies, Skeleton Raiders with procedural limb animation.
- [ ] Hierarchical Pathfinding (A* navigation mesh over voxel terrain with jumping and obstacle clearing).
- [ ] Group Pack Tactics: Goblin pack call-for-help mechanics, flanking behaviors, and ranged archer kiting.
- [ ] Multi-Phase World Bosses:
  - *The Stone Titan*: Ground slam shockwaves, falling boulder attacks, and breakable weak points.
  - *The Necromancer of the Rift*: Summoning waves of skeletons, area-of-effect shadow pools, and soul-drain phases.

---

## Landmark Phase 4: Narrative Engine, Non-Linear Quests & World Lore

### Landmark 4.1: Quest Engine Architecture
- [x] Multi-stage quest tracking with discrete objectives, state persistence, and completion fanfares.
- [x] Starter questlines: "The Pioneer's Awakening", "Goblin Incursion", "Depths of Wealth", "Arena Gladiator".
- [ ] Branching Dialogue Tree system with player moral choices, faction reputation adjustments, and cutscene camera tracks.
- [ ] Dynamic Quest Journals with parchment UI, riddle clues, maps, and sketch hints.

### Landmark 4.2: World Lore & Epic Quest Campaigns
- [ ] "The Fallen Monolith": An archeological mystery investigating ancient runic beacons across the biomes.
- [ ] "The Goblin King's Tribute": Infiltration and diplomatic/combat resolution inside an underground goblin fortress.
- [ ] "Curse of the Sunken Citadel": Diving deep into submerged ocean ruins to reforge a shattered legendary trident.
- [ ] Dynamic World Events: Wandering merchants, goblin raids on settlement outposts, and meteor strikes containing star-metal ore.

---

## Landmark Phase 5: "The Token Arena" — Battle Royale Mode Expansion

### Landmark 5.1: High-Stakes Survival Loop
- [x] Instant toggle between MMORPG Open World and Battle Royale Arena modes (`B` key).
- [x] The Electric Storm: Cylindrical forcefield barrier with multi-phase contraction and outside-zone damage ticks.
- [x] Supply Drop Chests with sky beacons containing high-tier armaments and elixirs.
- [x] Simulated dynamic killfeed and remaining player count tracker.
- [ ] Airborne Infiltration: Paraglider / Skydiving drop phase from the storm mothership at match start.
- [ ] Storm Surge mechanics: Damage increases exponentially in late-game circles to deter heal-off stalling.

### Landmark 5.2: Arena Infrastructure & Competitive Systems
- [ ] Destructible Cover & Tactical Fortifications: Fast-building wooden/stone walls, ramps, and barricades.
- [ ] Loot Rarities & Tier System (Common, Uncommon, Rare, Epic, Legendary, Mythic) with colored particle glows.
- [ ] Spectator Camera System: Free-cam and first-person spectating of eliminating player upon defeat.
- [ ] Competitive Leaderboards: Elo rating, match history, victory crown badges, and seasonal rewards.

---

## Landmark Phase 6: High-Concurrency Multiplayer Networking & Infrastructure

### Landmark 6.1: Authoritative Server Architecture
- [ ] Authoritative WebSocket / WebTransport game server daemon built in Rust or Node.js.
- [ ] Spatial Grid Partitioning: Dynamic interest management broadcasting updates only to players within visibility radius.
- [ ] Client-Side Prediction & Server Reconciliation for snappy zero-latency player movement.
- [ ] Entity Interpolation & Lag Compensation for accurate projectile and melee registration.

### Landmark 6.2: Sharding & Persistence
- [ ] Seamless World Sharding: Transitioning between continental map zones without loading screens.
- [ ] Persistent PostgreSQL / Redis database backend for player inventory, bank vaults, quest logs, and skills.
- [ ] Cheat Prevention & Validation: Server-side raycast collision verification, speedhack prevention, and inventory transaction atomic locks.

---

## Landmark Phase 7: Player Social Systems, Guilds & Clan Citadels

### Landmark 7.1: Social Fabric
- [ ] Global, Regional, Whisper, and Clan chat channels with profanity filtering and player reporting.
- [ ] Friends List, Ignored List, and status presence indicators.
- [ ] Emote System: Procedural character gestures (Wave, Dance, Bow, Cheer, Level-Up flex).

### Landmark 7.2: Clan Citadels & Territory Wars
- [ ] Player Clan Creation: Clan cloaks, custom crest banners, and hierarchy roles.
- [ ] Modular Clan Citadels: Instanced voxel islands where clans pool gathered resources to construct keeps, resource factories, and battle arenas.
- [ ] Castle Siege Wars: Scheduled weekly PvP battles for control of territorial beacon monuments granting realm-wide resource buffs.

---

## Landmark Phase 8: WebGPU Graphics Pipeline, Shaders & Cross-Platform Reach

### Landmark 8.1: Modern Web Graphics & Audio
- [x] Pure procedural Web Audio API sound synthesizer with zero external asset dependencies.
- [ ] WebGPU backend integration alongside WebGL fallback for next-gen compute shader meshing.
- [ ] Custom GLSL Shaders:
  - Dynamic water surface with vertex waves, depth refraction, and foam edges.
  - Volumetric Atmospheric God Rays from the sun.
  - Screen-space ambient occlusion (SSAO) and bloom passes.
- [ ] Dynamic weather engine: Rainstorms with splashing ripples, snow accumulation on block tops, and thunder strikes.

### Landmark 8.2: Cross-Platform & Mobile Optimization
- [ ] Virtual Dual-Joystick Touch Controls for mobile and tablet browsers.
- [ ] Progressive Web App (PWA) manifest and Service Worker caching for instant offline boot.
- [ ] Gamepad API integration (full Xbox, PlayStation, and generic Bluetooth controller mapping with vibration feedback).
- [ ] Open Modding API: Sandboxed JavaScript plugin API allowing community creators to script custom quests, weapons, and block types.
