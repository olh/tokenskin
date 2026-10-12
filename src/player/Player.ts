import * as THREE from 'three';
import { Physics } from '../physics/Physics';
import { World, RaycastResult } from '../voxel/World';
import { BlockType } from '../voxel/BlockTypes';
import { SkillsManager } from './SkillsManager';
import { Inventory, ITEM_REGISTRY } from './Inventory';
import { SoundEngine } from '../core/SoundEngine';

export class Player {
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public dimensions: THREE.Vector3 = new THREE.Vector3(0.6, 1.8, 0.6);

  public camera: THREE.PerspectiveCamera;
  public yaw: number = 0;
  public pitch: number = 0;
  public isThirdPerson: boolean = false;

  // Stats
  public health: number = 100;
  public maxHealth: number = 100;
  public stamina: number = 100;
  public maxStamina: number = 100;

  // State flags
  public onGround: boolean = false;
  public inWater: boolean = false;
  public isSprinting: boolean = false;
  public isMoving: boolean = false;

  // Subsystems
  public skills: SkillsManager;
  public inventory: Inventory;
  public sound: SoundEngine;

  // 3D Visuals
  public avatarGroup: THREE.Group;
  public headMesh: THREE.Mesh;
  public bodyMesh: THREE.Mesh;
  public leftArmMesh: THREE.Mesh;
  public rightArmMesh: THREE.Mesh;
  public leftLegMesh: THREE.Mesh;
  public rightLegMesh: THREE.Mesh;

  // First person viewmodel (hand / weapon)
  public viewModelGroup: THREE.Group;
  public heldWeaponMesh: THREE.Mesh;
  public swingProgress: number = 0; // 0 to 1

  // Target block wireframe highlight
  public highlightWireframe: THREE.LineSegments;
  public targetedBlock: RaycastResult | null = null;

  // Timers
  private footstepTimer: number = 0;
  private limbWalkPhase: number = 0;

  constructor(camera: THREE.PerspectiveCamera, sound: SoundEngine) {
    this.camera = camera;
    this.sound = sound;
    this.position = new THREE.Vector3(8.5, 16.0, 8.5);
    this.velocity = new THREE.Vector3();

    this.skills = new SkillsManager();
    this.inventory = new Inventory();

    // Build 3D Avatar
    this.avatarGroup = new THREE.Group();
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    const clothesMat = new THREE.MeshLambertMaterial({ color: 0x2563eb }); // blue tunic
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x1e293b }); // dark pants

    // Head
    const headGeom = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    this.headMesh = new THREE.Mesh(headGeom, skinMat);
    this.headMesh.position.set(0, 1.6, 0);
    this.avatarGroup.add(this.headMesh);

    // Torso
    const bodyGeom = new THREE.BoxGeometry(0.5, 0.65, 0.3);
    this.bodyMesh = new THREE.Mesh(bodyGeom, clothesMat);
    this.bodyMesh.position.set(0, 1.1, 0);
    this.avatarGroup.add(this.bodyMesh);

    // Arms
    const armGeom = new THREE.BoxGeometry(0.18, 0.6, 0.18);
    this.leftArmMesh = new THREE.Mesh(armGeom, skinMat);
    this.leftArmMesh.position.set(-0.35, 1.1, 0);
    this.avatarGroup.add(this.leftArmMesh);

    this.rightArmMesh = new THREE.Mesh(armGeom, skinMat);
    this.rightArmMesh.position.set(0.35, 1.1, 0);
    this.avatarGroup.add(this.rightArmMesh);

    // Legs
    const legGeom = new THREE.BoxGeometry(0.2, 0.75, 0.2);
    this.leftLegMesh = new THREE.Mesh(legGeom, pantsMat);
    this.leftLegMesh.position.set(-0.15, 0.4, 0);
    this.avatarGroup.add(this.leftLegMesh);

    this.rightLegMesh = new THREE.Mesh(legGeom, pantsMat);
    this.rightLegMesh.position.set(0.15, 0.4, 0);
    this.avatarGroup.add(this.rightLegMesh);

    // First person weapon model attached to camera
    this.viewModelGroup = new THREE.Group();
    const swordBladeGeom = new THREE.BoxGeometry(0.08, 0.6, 0.04);
    const swordMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 });
    this.heldWeaponMesh = new THREE.Mesh(swordBladeGeom, swordMat);
    this.heldWeaponMesh.position.set(0.25, -0.25, -0.5);
    this.heldWeaponMesh.rotation.set(-Math.PI / 4, 0, Math.PI / 8);
    this.viewModelGroup.add(this.heldWeaponMesh);
    this.camera.add(this.viewModelGroup);

    // Highlight wireframe cube
    const wireGeom = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    const edges = new THREE.EdgesGeometry(wireGeom);
    this.highlightWireframe = new THREE.LineSegments(edges, wireMat);
    this.highlightWireframe.visible = false;
  }

  public update(
    dt: number,
    input: { forward: boolean; backward: boolean; left: boolean; right: boolean; jump: boolean; sprint: boolean },
    world: World
  ): void {
    // Movement calculation
    let moveSpeed = 4.3; // m/s
    this.isSprinting = false;

    if (input.sprint && this.stamina > 5 && (input.forward || input.backward || input.left || input.right)) {
      moveSpeed = 6.8;
      this.isSprinting = true;
      this.stamina = Math.max(0, this.stamina - 15 * dt);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 10 * dt);
    }

    // Direction vector from camera yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const moveDir = new THREE.Vector3();
    if (input.forward) moveDir.add(forward);
    if (input.backward) moveDir.sub(forward);
    if (input.right) moveDir.add(right);
    if (input.left) moveDir.sub(right);

    this.isMoving = moveDir.lengthSq() > 0.001;
    if (this.isMoving) {
      moveDir.normalize();
      this.velocity.x = moveDir.x * moveSpeed;
      this.velocity.z = moveDir.z * moveSpeed;

      // Limb swing animation
      this.limbWalkPhase += dt * (this.isSprinting ? 14 : 9);
      const angle = Math.sin(this.limbWalkPhase) * 0.6;
      this.leftLegMesh.rotation.x = angle;
      this.rightLegMesh.rotation.x = -angle;
      this.leftArmMesh.rotation.x = -angle;
      if (this.swingProgress === 0) {
        this.rightArmMesh.rotation.x = angle;
      }

      // Footstep sound
      this.footstepTimer += dt;
      const stepInterval = this.isSprinting ? 0.32 : 0.48;
      if (this.footstepTimer >= stepInterval && this.onGround) {
        this.footstepTimer = 0;
        const blockBelow = world.getBlock(
          Math.floor(this.position.x),
          Math.floor(this.position.y - 0.2),
          Math.floor(this.position.z)
        );
        const surface = blockBelow === BlockType.STONE || blockBelow === BlockType.COBBLESTONE ? 'stone' :
                        blockBelow === BlockType.WOOD || blockBelow === BlockType.PLANKS ? 'wood' : 'grass';
        this.sound.playFootstep(surface);
      }
    } else {
      this.velocity.x *= 0.7;
      this.velocity.z *= 0.7;
      this.leftLegMesh.rotation.x = 0;
      this.rightLegMesh.rotation.x = 0;
      this.leftArmMesh.rotation.x = 0;
      if (this.swingProgress === 0) {
        this.rightArmMesh.rotation.x = 0;
      }
    }

    // Jump
    if (input.jump) {
      if (this.onGround) {
        this.velocity.y = Physics.JUMP_VELOCITY;
        this.onGround = false;
        this.sound.playFootstep('wood');
      } else if (this.inWater) {
        this.velocity.y = 4.0;
      }
    }

    // Run physics simulation
    const phys = Physics.simulate(this.position, this.velocity, this.dimensions, dt, world);
    this.onGround = phys.onGround;
    this.inWater = phys.inWater;

    // Update avatar mesh position and rotation
    this.avatarGroup.position.copy(this.position);
    this.avatarGroup.rotation.y = this.yaw;
    this.avatarGroup.visible = this.isThirdPerson;

    // Dual Camera update
    const eyeHeight = 1.62;
    if (this.isThirdPerson) {
      this.viewModelGroup.visible = false;
      const camDist = 4.5;
      const camHeight = 2.0;

      // Position camera behind player
      const offset = new THREE.Vector3(
        Math.sin(this.yaw) * camDist * Math.cos(this.pitch),
        camHeight - Math.sin(this.pitch) * camDist,
        Math.cos(this.yaw) * camDist * Math.cos(this.pitch)
      );

      this.camera.position.copy(this.position).add(offset);
      const targetLook = this.position.clone().add(new THREE.Vector3(0, eyeHeight * 0.8, 0));
      this.camera.lookAt(targetLook);
    } else {
      this.viewModelGroup.visible = true;
      this.camera.position.set(this.position.x, this.position.y + eyeHeight, this.position.z);
      this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    }

    // Weapon swing animation
    if (this.swingProgress > 0) {
      this.swingProgress = Math.max(0, this.swingProgress - dt * 4.5);
      const swingAngle = Math.sin(this.swingProgress * Math.PI) * 0.8;
      this.heldWeaponMesh.rotation.x = -Math.PI / 4 + swingAngle;
      this.heldWeaponMesh.position.z = -0.5 + swingAngle * 0.2;
      this.rightArmMesh.rotation.x = -swingAngle * 1.5;
    }

    // Raycast target block
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    this.targetedBlock = world.raycast(this.camera.position, camDir, 5.5);

    if (this.targetedBlock.hit) {
      this.highlightWireframe.visible = true;
      this.highlightWireframe.position.set(
        this.targetedBlock.blockPos.x + 0.5,
        this.targetedBlock.blockPos.y + 0.5,
        this.targetedBlock.blockPos.z + 0.5
      );
    } else {
      this.highlightWireframe.visible = false;
    }
  }

  public triggerAttackSwing(): void {
    if (this.swingProgress === 0) {
      this.swingProgress = 1.0;
      this.sound.playSwordSwing();
    }
  }

  public toggleCamera(): boolean {
    this.isThirdPerson = !this.isThirdPerson;
    return this.isThirdPerson;
  }

  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    this.sound.playHit();
  }

  public heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.sound.playItemPickup();
  }
}
