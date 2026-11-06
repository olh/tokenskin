import * as THREE from 'three';
import { World } from '../voxel/World';
import { BlockType, BLOCK_DEFINITIONS } from '../voxel/BlockTypes';
import { TextureAtlas } from '../voxel/TextureAtlas';
import { Player } from '../player/Player';
import { EntityManager } from '../entities/EntityManager';
import { NPC } from '../entities/NPC';
import { Monster } from '../entities/Monster';
import { QuestManager } from '../rpg/QuestManager';
import { BattleRoyaleManager } from '../battleroyale/BattleRoyaleManager';
import { SoundEngine } from './SoundEngine';
import { InputManager } from './InputManager';
import { HUD } from '../ui/HUD';
import { Minimap } from '../ui/Minimap';
import { ITEM_REGISTRY } from '../player/Inventory';

export class Engine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  public world: World;
  public player: Player;
  public entityManager: EntityManager;
  public questManager: QuestManager;
  public brManager: BattleRoyaleManager;
  public sound: SoundEngine;
  public input: InputManager;
  public hud: HUD;
  public minimap: Minimap;

  // Lighting & Sky
  private sunLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private skyTime: number = 0;

  // Loop timing
  private lastTime: number = performance.now();
  private isRunning: boolean = true;

  constructor() {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    const minimapCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;

    // 1. Three.js Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7dd3fc); // Daylight sky
    this.scene.fog = new THREE.FogExp2(0x7dd3fc, 0.015);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Initialize Core Subsystems
    this.sound = new SoundEngine();
    TextureAtlas.init();

    this.world = new World(this.scene);
    this.player = new Player(this.camera, this.sound);
    this.scene.add(this.player.avatarGroup);
    this.scene.add(this.player.highlightWireframe);

    this.entityManager = new EntityManager(this.scene, this.sound);
    this.questManager = new QuestManager(this.sound);
    this.brManager = new BattleRoyaleManager(this.scene, this.sound);
    this.hud = new HUD(this.player, this.questManager, this.brManager);
    this.minimap = new Minimap(minimapCanvas);
    this.input = new InputManager(canvas);

    // 3. Lighting Setup
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
    this.hemiLight.position.set(0, 100, 0);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.2);
    this.sunLight.position.set(40, 80, 40);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 200;
    const shadowD = 40;
    this.sunLight.shadow.camera.left = -shadowD;
    this.sunLight.shadow.camera.right = shadowD;
    this.sunLight.shadow.camera.top = shadowD;
    this.sunLight.shadow.camera.bottom = -shadowD;
    this.scene.add(this.sunLight);

    // 4. Initial World & Entity Population
    this.initWorldAndSpawns();

    // 5. Wire Input Handlers
    this.setupInteractions();

    // 6. Handle Window Resize
    window.addEventListener('resize', () => this.onWindowResize());

    // 7. Start Game Loop
    this.animate();
  }

  private initWorldAndSpawns(): void {
    // Generate initial chunks around player
    this.world.initSurroundingChunks(0, 0, 2);

    // Place player at highest safe ground
    let startY = 16;
    while (startY < 30 && this.world.getBlock(8, startY, 8) !== BlockType.AIR) {
      startY++;
    }
    this.player.position.set(8.5, startY + 1.0, 8.5);

    // Populate NPCs and hostile monsters
    this.entityManager.populateInitialWorld(this.world);
  }

  private setupInteractions(): void {
    // Mouse Look
    this.input.onLook = (deltaYaw, deltaPitch) => {
      this.player.yaw += deltaYaw;
      this.player.pitch = Math.max(-Math.PI / 2.05, Math.min(Math.PI / 2.05, this.player.pitch + deltaPitch));
    };

    // Camera Toggle (V)
    this.input.onCameraToggle = () => {
      const is3rd = this.player.toggleCamera();
      this.hud.spawnNotification(is3rd ? '📷 Switched to 3rd Person View (RuneScape style)' : '📷 Switched to 1st Person View');
    };

    // Inventory Toggle (E)
    this.input.onInventoryToggle = () => {
      this.hud.toggleInventory();
    };

    // Quest Log Toggle (Q)
    this.input.onQuestToggle = () => {
      this.hud.toggleQuestModal();
    };

    // Help Modal Toggle (H)
    this.input.onHelpToggle = () => {
      this.hud.toggleHelpModal();
    };

    // Battle Royale Mode Toggle (B)
    this.input.onBattleRoyaleToggle = () => {
      this.hud.toggleGameMode();
    };

    // Hotbar selection
    this.input.onHotbarSelect = (slotOrDir) => {
      if (typeof slotOrDir === 'number') {
        if (slotOrDir >= 0 && slotOrDir < 9) {
          this.player.inventory.selectedHotbarSlot = slotOrDir;
        } else {
          // Relative wheel scroll
          const next = (this.player.inventory.selectedHotbarSlot + slotOrDir + 9) % 9;
          this.player.inventory.selectedHotbarSlot = next;
        }
      }
    };

    // Left Click: Attack or Mine Block
    this.input.onLeftClick = () => {
      this.player.triggerAttackSwing();

      // Check if striking an entity first
      const camDir = new THREE.Vector3();
      this.camera.getWorldDirection(camDir);
      const hitEntity = this.entityManager.getEntityInAttackCone(this.camera.position, camDir, 3.8);

      if (hitEntity) {
        if (hitEntity instanceof Monster) {
          // Combat damage calculation
          const equipped = this.player.inventory.equippedWeapon;
          const weaponDef = equipped ? ITEM_REGISTRY[equipped.id] : null;
          const baseDmg = weaponDef?.damage || 8;
          const combatLvl = this.player.skills.skills.combat.level;
          const totalDmg = Math.floor(baseDmg + combatLvl * 1.5 + (Math.random() - 0.5) * 4);

          // Apply damage
          const knockback = camDir.clone().setY(0.2).normalize();
          hitEntity.takeDamage(totalDmg, knockback, this.sound);

          // Floating combat text
          this.hud.spawnFloatingText(`-${totalDmg}`, '#ef4444');

          // Award Combat XP
          const xp = totalDmg * 4;
          this.player.skills.addXp('combat', xp);

          // Check if dead
          if (hitEntity.isDead) {
            this.hud.spawnFloatingText(`+${xp * 2} BONUS COMBAT XP`, '#f59e0b');
            this.player.skills.addXp('combat', xp * 2);
            this.questManager.reportProgress('goblin_kill', 1);

            // Give loot to player
            hitEntity.lootDrops.forEach((loot) => {
              if (Math.random() <= loot.chance) {
                this.player.inventory.addItem(loot.id, loot.count);
                this.hud.spawnNotification(`🎁 Looted: ${loot.count}x ${ITEM_REGISTRY[loot.id]?.name || loot.id}`);
              }
            });
          }
        }
        return;
      }

      // Check if breaking a targeted block
      const target = this.player.targetedBlock;
      if (target && target.hit) {
        const def = BLOCK_DEFINITIONS[target.blockType];
        if (def && def.hardness < Infinity) {
          this.world.setBlock(target.blockPos.x, target.blockPos.y, target.blockPos.z, BlockType.AIR);
          this.sound.playBlockBreak();

          // Award harvesting XP
          if (def.xpSkill) {
            this.player.skills.addXp(def.xpSkill, def.xpAmount || 15);
          }

          // Add dropped item
          if (def.dropItemId) {
            this.player.inventory.addItem(def.dropItemId, def.dropCount || 1);
          }

          // Report quest progress
          if (target.blockType === BlockType.WOOD) {
            this.questManager.reportProgress('wood_chop', 1);
          } else if (target.blockType === BlockType.STONE || target.blockType === BlockType.COBBLESTONE) {
            this.questManager.reportProgress('stone_mine', 1);
          } else if (target.blockType === BlockType.GOLD_ORE || target.blockType === BlockType.DIAMOND_ORE) {
            this.questManager.reportProgress('ore_mine', 1);
          } else if (target.blockType === BlockType.CHEST) {
            this.questManager.reportProgress('open_chest', 1);
            this.player.inventory.addItem('diamond_sword', 1);
            this.player.inventory.addItem('health_potion', 3);
            this.player.inventory.addItem('coins', 150);
            this.sound.playChestOpen();
            this.hud.spawnNotification('💎 Supply Chest Opened! Claimed Diamond Sun Blade & Elixirs!');
          }
        }
      }
    };

    // Right Click: Place Block or Interact with NPC / Consumables
    this.input.onRightClick = () => {
      // Check if interacting with friendly NPC
      const camDir = new THREE.Vector3();
      this.camera.getWorldDirection(camDir);
      const hitEntity = this.entityManager.getEntityInAttackCone(this.camera.position, camDir, 4.0);

      if (hitEntity && hitEntity instanceof NPC) {
        this.hud.showDialogue(hitEntity.name, hitEntity.dialogue);
        return;
      }

      // Check active hotbar item
      const activeItem = this.player.inventory.getActiveItem();
      if (!activeItem) return;

      const def = ITEM_REGISTRY[activeItem.id];
      if (!def) return;

      // Consumable food or potion
      if (def.category === 'consumable' && def.healAmount) {
        this.player.heal(def.healAmount);
        this.player.inventory.removeItem(activeItem.id, 1);
        this.hud.spawnFloatingText(`+${def.healAmount} HP`, '#22c55e');
        return;
      }

      // Block placement
      if (def.category === 'block' && def.blockType !== undefined) {
        const target = this.player.targetedBlock;
        if (target && target.hit) {
          const placeX = target.blockPos.x + target.faceNormal.x;
          const placeY = target.blockPos.y + target.faceNormal.y;
          const placeZ = target.blockPos.z + target.faceNormal.z;

          // Check if placement box overlaps with player
          const playerBox = this.player.avatarGroup.position;
          const distToPlayer = Math.hypot(placeX + 0.5 - playerBox.x, placeY + 0.5 - playerBox.y, placeZ + 0.5 - playerBox.z);
          if (distToPlayer < 1.0) {
            return; // Don't place inside player body
          }

          const success = this.world.setBlock(placeX, placeY, placeZ, def.blockType);
          if (success) {
            this.sound.playBlockPlace();
            this.player.inventory.removeItem(activeItem.id, 1);
            if (def.blockType === BlockType.PLANKS) {
              this.questManager.reportProgress('planks_place', 1);
            }
          }
        }
      }
    };
  }

  private animate(): void {
    if (!this.isRunning) return;
    requestAnimationFrame(() => this.animate());

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1); // clamp to prevent delta explosion
    this.lastTime = now;

    // 1. Day / Night Sky Progression
    this.skyTime += dt * 0.02;
    const sunAngle = this.skyTime;
    this.sunLight.position.set(Math.cos(sunAngle) * 80 + 8, Math.sin(sunAngle) * 80 + 10, Math.sin(sunAngle * 0.5) * 50 + 8);

    // 2. Player Update
    const movement = this.input.getMovementInput();
    this.player.update(dt, movement, this.world);

    // 3. Entities Update
    const entityResult = this.entityManager.update(dt, this.world, this.player.position, this.camera);
    if (entityResult.damageDealtToPlayer > 0) {
      this.player.takeDamage(entityResult.damageDealtToPlayer);
      this.hud.spawnFloatingText(`-${entityResult.damageDealtToPlayer}`, '#dc2626');
    }

    // 4. Battle Royale Mode Update
    const brResult = this.brManager.update(dt, this.player);
    this.hud.setStormHazard(brResult.isPlayerInStorm);

    // 5. UI Updates
    this.hud.update();
    this.minimap.render(this.player, this.entityManager.entities, this.brManager, this.world);

    // 6. Three.js Render Pass
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
