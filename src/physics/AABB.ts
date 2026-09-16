import * as THREE from 'three';

export class AABB {
  public min: THREE.Vector3;
  public max: THREE.Vector3;

  constructor(min: THREE.Vector3, max: THREE.Vector3) {
    this.min = min.clone();
    this.max = max.clone();
  }

  public set(min: THREE.Vector3, max: THREE.Vector3): void {
    this.min.copy(min);
    this.max.copy(max);
  }

  public clone(): AABB {
    return new AABB(this.min, this.max);
  }

  public copy(other: AABB): AABB {
    this.min.copy(other.min);
    this.max.copy(other.max);
    return this;
  }

  public intersects(other: AABB): boolean {
    return (
      this.min.x < other.max.x &&
      this.max.x > other.min.x &&
      this.min.y < other.max.y &&
      this.max.y > other.min.y &&
      this.min.z < other.max.z &&
      this.max.z > other.min.z
    );
  }

  public offset(x: number, y: number, z: number): AABB {
    this.min.x += x;
    this.min.y += y;
    this.min.z += z;
    this.max.x += x;
    this.max.y += y;
    this.max.z += z;
    return this;
  }

  public getCenter(): THREE.Vector3 {
    return new THREE.Vector3(
      (this.min.x + this.max.x) * 0.5,
      (this.min.y + this.max.y) * 0.5,
      (this.min.z + this.max.z) * 0.5
    );
  }

  public getSize(): THREE.Vector3 {
    return new THREE.Vector3(
      this.max.x - this.min.x,
      this.max.y - this.min.y,
      this.max.z - this.min.z
    );
  }
}
