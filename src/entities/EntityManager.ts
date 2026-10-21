import * as THREE from 'three';
import { Entity } from './Entity';
import { NPC } from './NPC';
import { Monster, MonsterType } from './Monster';
import { World } from '../voxel/World';
import { SoundEngine } from '../core/SoundEngine';
import { AABB } from '../physics/AABB';

export class EntityManager {
  public entities: Entity[] = [];
  public scene: THREE.Scene;
  public sound: SoundEngine;

  constructor(scene: THREE.Scene, sound: SoundEngine) {
    this.scene = scene;
    this.sound = sound;
  }

  public addEntity(entity: Entity): void {
    this.entities.push(entity);
    this.scene.add(entity.mesh);
  }

  public removeEntity(entity: Entity): void {
    const idx = this.entities.indexOf(entity);
    if (idx !== -1) {
      this.entities.splice(idx, 1);
      this.scene.remove(entity.mesh);
    }
  }

  public populateInitialWorld(world: World): void {
    // 1. Spawn friendly Sage NPC "Elder Bob" near the shrine
    const sageX = 8;
    const sageZ = 5;
    let sageY = 12;
    while (sageY < 25 && world.getBlock(sageX, sageY, sageZ) !== 0) sageY++;

    const sage = new NPC(
      'npc_elder_bob',
      'Elder Bob',
      sageX + 0.5,
      sageY,
      sageZ + 0.5,
      [
        'Greetings, adventurer! Welcome to the Token Skin realms.',
        'This world is shifting between peaceful wilderness and the perilous Arena rift.',
        'Chop wood, mine stone, and hone your combat skills to survive what lies ahead!',
        'Beware the goblins roaming beyond the trees—and the closing Storm!'
      ],
      'quest_awakening'
    );
    this.addEntity(sage);

    // 2. Spawn hostile mobs across the landscape
    const mobSpawns: { type: MonsterType; x: number; z: number }[] = [
      { type: 'goblin', x: 18, z: 12 },
      { type: 'goblin', x: 22, z: 24 },
      { type: 'goblin', x: -12, z: 15 },
      { type: 'skeleton', x: -18, z: -10 },
      { type: 'skeleton', x: 26, z: -8 },
      { type: 'zombie', x: 14, z: -22 },
      { type: 'zombie', x: -16, z: -20 },
      { type: 'goblin', x: 5, z: 28 }
    ];

    mobSpawns.forEach((spawn, idx) => {
      let y = 12;
      while (y < 28 && world.getBlock(Math.floor(spawn.x), y, Math.floor(spawn.z)) !== 0) y++;
      const mob = new Monster(`mob_${idx}`, spawn.type, spawn.x + 0.5, y + 0.5, spawn.z + 0.5);
      this.addEntity(mob);
    });
  }

  public update(dt: number, world: World, playerPos: THREE.Vector3, camera: THREE.Camera): {
    damageDealtToPlayer: number;
    slainMonsters: Monster[];
  } {
    let damageDealtToPlayer = 0;
    const slainMonsters: Monster[] = [];

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      entity.update(dt, world, playerPos, this.sound);
      entity.updateHealthBar(camera);

      if (entity instanceof Monster) {
        if (entity.isDead) {
          // If finished death timer, remove from scene
          slainMonsters.push(entity);
          this.removeEntity(entity);
          continue;
        }

        // Check if monster lands melee attack on player
        if (entity.state === 3 && entity.attackCooldown >= 1.5) {
          const dx = playerPos.x - entity.position.x;
          const dy = playerPos.y - entity.position.y;
          const dz = playerPos.z - entity.position.z;
          const dist = Math.hypot(dx, dy, dz);
          if (dist <= entity.attackRange + 0.4) {
            damageDealtToPlayer += entity.attackDamage;
            this.sound.playHit();
          }
        }
      }
    }

    return { damageDealtToPlayer, slainMonsters };
  }

  /**
   * Raycast or sphere check for entities hit by player's melee weapon
   */
  public getEntityInAttackCone(origin: THREE.Vector3, direction: THREE.Vector3, maxRange: number = 3.5): Entity | null {
    const dir = direction.clone().normalize();
    let bestEntity: Entity | null = null;
    let closestDist = maxRange;

    for (const entity of this.entities) {
      if (entity.isDead) continue;
      const aabb = entity.getAABB();
      const center = aabb.getCenter();
      const toCenter = center.clone().sub(origin);
      const proj = toCenter.dot(dir);

      if (proj > 0 && proj <= maxRange) {
        const perpDistSq = toCenter.lengthSq() - proj * proj;
        if (perpDistSq < 1.0) {
          if (proj < closestDist) {
            closestDist = proj;
            bestEntity = entity;
          }
        }
      }
    }

    return bestEntity;
  }
}
