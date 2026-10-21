import * as THREE from 'three';
import { Entity } from './Entity';
import { Physics } from '../physics/Physics';
import { World } from '../voxel/World';
import { SoundEngine } from '../core/SoundEngine';

export enum MonsterState {
  IDLE = 0,
  PATROL = 1,
  CHASE = 2,
  ATTACK = 3,
  DEAD = 4
}

export type MonsterType = 'goblin' | 'skeleton' | 'zombie';

export class Monster extends Entity {
  public monsterType: MonsterType;
  public state: MonsterState = MonsterState.IDLE;
  public attackDamage: number;
  public attackCooldown: number = 0;
  public aggroRange: number = 14.0;
  public attackRange: number = 2.0;

  // Visuals
  private headMesh: THREE.Mesh;
  private bodyMesh: THREE.Mesh;
  private leftArmMesh: THREE.Mesh;
  private rightArmMesh: THREE.Mesh;
  private leftLegMesh: THREE.Mesh;
  private rightLegMesh: THREE.Mesh;
  private animPhase: number = 0;
  private hurtTimer: number = 0;
  private deathTimer: number = 0;

  // AI timers
  private stateTimer: number = 0;
  private wanderDir: THREE.Vector3 = new THREE.Vector3();

  // Loot table
  public lootDrops: { id: string; chance: number; count: number }[] = [];

  constructor(id: string, type: MonsterType, x: number, y: number, z: number) {
    const isGoblin = type === 'goblin';
    const isZombie = type === 'zombie';
    const hp = isGoblin ? 45 : isZombie ? 80 : 55;
    const height = isGoblin ? 1.4 : 1.8;
    const name = isGoblin ? 'Forest Goblin' : isZombie ? 'Crypt Zombie' : 'Skeleton Raider';

    super(id, name, x, y, z, hp, 0.6, height);
    this.monsterType = type;
    this.isHostile = true;
    this.attackDamage = isGoblin ? 8 : isZombie ? 16 : 12;

    // Materials
    const skinColor = isGoblin ? 0x4ade80 : isZombie ? 0x15803d : 0xe2e8f0;
    const armorColor = isGoblin ? 0x854d0e : isZombie ? 0x1e3a8a : 0x475569;
    const skinMat = new THREE.MeshLambertMaterial({ color: skinColor });
    const armorMat = new THREE.MeshLambertMaterial({ color: armorColor });

    // Model
    const headScale = isGoblin ? 0.35 : 0.4;
    this.headMesh = new THREE.Mesh(new THREE.BoxGeometry(headScale, headScale, headScale), skinMat);
    this.headMesh.position.set(0, height - 0.2, 0);
    this.mesh.add(this.headMesh);

    this.bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, height * 0.45, 0.3), armorMat);
    this.bodyMesh.position.set(0, height * 0.55, 0);
    this.mesh.add(this.bodyMesh);

    const armGeom = new THREE.BoxGeometry(0.16, height * 0.4, 0.16);
    this.leftArmMesh = new THREE.Mesh(armGeom, skinMat);
    this.leftArmMesh.position.set(-0.35, height * 0.55, 0);
    this.mesh.add(this.leftArmMesh);

    this.rightArmMesh = new THREE.Mesh(armGeom, skinMat);
    this.rightArmMesh.position.set(0.35, height * 0.55, 0);
    this.mesh.add(this.rightArmMesh);

    const legGeom = new THREE.BoxGeometry(0.18, height * 0.45, 0.18);
    this.leftLegMesh = new THREE.Mesh(legGeom, armorMat);
    this.leftLegMesh.position.set(-0.15, height * 0.22, 0);
    this.mesh.add(this.leftLegMesh);

    this.rightLegMesh = new THREE.Mesh(legGeom, armorMat);
    this.rightLegMesh.position.set(0.15, height * 0.22, 0);
    this.mesh.add(this.rightLegMesh);

    // Setup loot table
    if (isGoblin) {
      this.lootDrops = [
        { id: 'coins', chance: 0.8, count: 15 },
        { id: 'goblin_dagger', chance: 0.35, count: 1 },
        { id: 'apple', chance: 0.5, count: 2 }
      ];
    } else if (isZombie) {
      this.lootDrops = [
        { id: 'coins', chance: 0.9, count: 25 },
        { id: 'iron_sword', chance: 0.25, count: 1 },
        { id: 'health_potion', chance: 0.4, count: 1 }
      ];
    } else {
      this.lootDrops = [
        { id: 'coins', chance: 0.85, count: 20 },
        { id: 'diamond', chance: 0.2, count: 1 },
        { id: 'cobblestone', chance: 0.7, count: 4 }
      ];
    }
  }

  public update(dt: number, world: World, playerPos: THREE.Vector3, sound: SoundEngine): void {
    if (this.isDead) {
      this.deathTimer += dt;
      if (this.deathTimer < 0.6) {
        this.mesh.rotation.x = (this.deathTimer / 0.6) * (Math.PI / 2);
      }
      return;
    }

    // Flash white/red on hurt
    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
    }

    // Attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    // Distance to player
    const dx = playerPos.x - this.position.x;
    const dy = playerPos.y - this.position.y;
    const dz = playerPos.z - this.position.z;
    const distXZ = Math.hypot(dx, dz);
    const distTotal = Math.hypot(dx, dy, dz);

    this.stateTimer += dt;

    // State machine logic
    if (distTotal <= this.aggroRange && Math.abs(dy) < 5.0) {
      if (distXZ <= this.attackRange) {
        this.state = MonsterState.ATTACK;
      } else {
        this.state = MonsterState.CHASE;
      }
    } else {
      if (this.state === MonsterState.CHASE || this.state === MonsterState.ATTACK) {
        this.state = MonsterState.IDLE;
      }
    }

    const moveSpeed = this.monsterType === 'goblin' ? 3.8 : 2.5;

    switch (this.state) {
      case MonsterState.CHASE: {
        const angle = Math.atan2(dx, dz);
        this.mesh.rotation.y = angle;
        this.velocity.x = Math.sin(angle) * moveSpeed;
        this.velocity.z = Math.cos(angle) * moveSpeed;

        // Jump over small blocks
        const blockInFront = world.getBlock(
          Math.floor(this.position.x + Math.sin(angle) * 0.6),
          Math.floor(this.position.y),
          Math.floor(this.position.z + Math.cos(angle) * 0.6)
        );
        if (blockInFront !== 0 && this.velocity.y === 0) {
          this.velocity.y = 7.0;
        }

        // Animate walking limbs
        this.animPhase += dt * 10;
        const swing = Math.sin(this.animPhase) * 0.7;
        this.leftLegMesh.rotation.x = swing;
        this.rightLegMesh.rotation.x = -swing;
        this.leftArmMesh.rotation.x = -swing;
        this.rightArmMesh.rotation.x = swing;
        break;
      }

      case MonsterState.ATTACK: {
        const angle = Math.atan2(dx, dz);
        this.mesh.rotation.y = angle;
        this.velocity.x *= 0.5;
        this.velocity.z *= 0.5;

        // Attack swing animation & hit trigger
        if (this.attackCooldown <= 0) {
          this.attackCooldown = 1.6;
          this.rightArmMesh.rotation.x = -Math.PI / 2;
          sound.playSwordSwing();
        } else {
          this.rightArmMesh.rotation.x = THREE.MathUtils.lerp(this.rightArmMesh.rotation.x, 0, dt * 5);
        }
        break;
      }

      case MonsterState.PATROL:
      case MonsterState.IDLE:
      default: {
        if (this.stateTimer > 3.0) {
          this.stateTimer = 0;
          if (Math.random() > 0.4) {
            this.state = MonsterState.PATROL;
            const wanderAngle = Math.random() * Math.PI * 2;
            this.wanderDir.set(Math.sin(wanderAngle), 0, Math.cos(wanderAngle));
          } else {
            this.state = MonsterState.IDLE;
            this.wanderDir.set(0, 0, 0);
          }
        }

        this.velocity.x = this.wanderDir.x * 1.5;
        this.velocity.z = this.wanderDir.z * 1.5;
        if (this.wanderDir.lengthSq() > 0) {
          this.mesh.rotation.y = Math.atan2(this.wanderDir.x, this.wanderDir.z);
          this.animPhase += dt * 6;
          const swing = Math.sin(this.animPhase) * 0.4;
          this.leftLegMesh.rotation.x = swing;
          this.rightLegMesh.rotation.x = -swing;
        } else {
          this.leftLegMesh.rotation.x = 0;
          this.rightLegMesh.rotation.x = 0;
        }
        break;
      }
    }

    // Apply physics
    Physics.simulate(this.position, this.velocity, this.dimensions, dt, world);
    this.mesh.position.copy(this.position);
  }

  public takeDamage(amount: number, knockbackDir: THREE.Vector3, sound: SoundEngine): void {
    if (this.isDead) return;
    this.health = Math.max(0, this.health - amount);
    this.hurtTimer = 0.2;
    sound.playHit();

    // Knockback
    this.velocity.x += knockbackDir.x * 6.0;
    this.velocity.y = 5.0;
    this.velocity.z += knockbackDir.z * 6.0;

    if (this.health <= 0) {
      this.isDead = true;
      this.state = MonsterState.DEAD;
      this.velocity.set(0, 0, 0);
      sound.playHit();
    }
  }
}
