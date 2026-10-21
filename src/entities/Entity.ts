import * as THREE from 'three';
import { AABB } from '../physics/AABB';
import { World } from '../voxel/World';
import { SoundEngine } from '../core/SoundEngine';

export abstract class Entity {
  public id: string;
  public name: string;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public dimensions: THREE.Vector3;
  public mesh: THREE.Group;
  public health: number;
  public maxHealth: number;
  public isDead: boolean = false;
  public isHostile: boolean = false;

  // Visuals
  protected healthBarBg: THREE.Mesh;
  protected healthBarFg: THREE.Mesh;

  constructor(id: string, name: string, x: number, y: number, z: number, health: number, width = 0.6, height = 1.8) {
    this.id = id;
    this.name = name;
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3();
    this.dimensions = new THREE.Vector3(width, height, width);
    this.health = health;
    this.maxHealth = health;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    // Overhead Health Bar
    const bgGeom = new THREE.PlaneGeometry(0.8, 0.1);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide });
    this.healthBarBg = new THREE.Mesh(bgGeom, bgMat);
    this.healthBarBg.position.set(0, height + 0.3, 0);

    const fgGeom = new THREE.PlaneGeometry(0.78, 0.08);
    const fgMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    this.healthBarFg = new THREE.Mesh(fgGeom, fgMat);
    this.healthBarFg.position.set(0, height + 0.3, 0.005);

    this.mesh.add(this.healthBarBg);
    this.mesh.add(this.healthBarFg);
  }

  public getAABB(): AABB {
    const halfW = this.dimensions.x * 0.5;
    const halfD = this.dimensions.z * 0.5;
    return new AABB(
      new THREE.Vector3(this.position.x - halfW, this.position.y, this.position.z - halfD),
      new THREE.Vector3(this.position.x + halfW, this.position.y + this.dimensions.y, this.position.z + halfD)
    );
  }

  public updateHealthBar(camera: THREE.Camera): void {
    const pct = Math.max(0, Math.min(1, this.health / this.maxHealth));
    this.healthBarFg.scale.x = pct;
    this.healthBarFg.position.x = -(0.78 * (1 - pct)) / 2;

    // Billboarding: Face camera
    this.healthBarBg.quaternion.copy(camera.quaternion);
    this.healthBarFg.quaternion.copy(camera.quaternion);
  }

  public abstract update(dt: number, world: World, playerPos: THREE.Vector3, sound: SoundEngine): void;
  public abstract takeDamage(amount: number, knockbackDir: THREE.Vector3, sound: SoundEngine): void;
}
